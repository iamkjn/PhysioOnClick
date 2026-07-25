// Live camera "Check your motion" screen: gates on explicit consent, then
// streams camera frames through an on-device ML Kit pose detector into a
// single `MotionJudge`, rendering a skeleton overlay + rep/range-of-motion
// feedback, and finally saves the session summary via `MotionService`.
//
// Nothing here ever leaves the device except the final numeric summary
// (reps/ROM/quality) written by `MotionService.saveMotionSession` — no video
// or frame data is ever uploaded or persisted.

import 'dart:async';
import 'dart:io' show Platform;
import 'dart:math' as math;

import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_mlkit_pose_detection/google_mlkit_pose_detection.dart';

import '../../core/app_colors.dart';
import 'motion_engine.dart';
import 'motion_service.dart';
import 'motion_targets.dart';
import 'pose_adapter.dart';

enum _Phase { consent, running, saving }

class MotionCheckScreen extends StatefulWidget {
  const MotionCheckScreen({
    super.key,
    required this.exerciseId,
    required this.exerciseTitle,
    required this.target,
    required this.uid,
    required this.personId,
  });

  final String exerciseId;
  final String exerciseTitle;
  final MotionTarget target;
  final String uid;
  final String personId;

  @override
  State<MotionCheckScreen> createState() => _MotionCheckScreenState();
}

class _MotionCheckScreenState extends State<MotionCheckScreen>
    with WidgetsBindingObserver {
  // Maps CameraController.value.deviceOrientation -> degrees, used to derive
  // the correct InputImageRotation on Android (front camera also needs the
  // sensor-orientation compensation applied below).
  static const _orientations = {
    DeviceOrientation.portraitUp: 0,
    DeviceOrientation.landscapeLeft: 90,
    DeviceOrientation.portraitDown: 180,
    DeviceOrientation.landscapeRight: 270,
  };

  _Phase _phase = _Phase.consent;

  late final MotionJudge _judge;
  CameraController? _controller;
  CameraDescription? _cameraDescription;
  PoseDetector? _poseDetector;

  bool _isDetecting = false;
  bool _isSaving = false;
  DateTime? _startedAt;
  String? _errorMessage;

  FrameResult? _latest;
  List<Landmark>? _latestLandmarks;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _judge = MotionJudge(widget.target);
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    final controller = _controller;
    if (controller == null || !controller.value.isInitialized) return;

    if (state == AppLifecycleState.inactive ||
        state == AppLifecycleState.paused) {
      _controller = null;
      unawaited(_disposeController(controller));
    } else if (state == AppLifecycleState.resumed) {
      if (_phase == _Phase.running && _errorMessage == null) {
        unawaited(_initCameraAndDetector());
      }
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    final controller = _controller;
    _controller = null;
    if (controller != null) {
      unawaited(_disposeController(controller));
    }
    final detector = _poseDetector;
    _poseDetector = null;
    if (detector != null) {
      unawaited(detector.close());
    }
    super.dispose();
  }

  Future<void> _disposeController(CameraController controller) async {
    try {
      if (controller.value.isStreamingImages) {
        await controller.stopImageStream();
      }
    } catch (_) {
      // Best-effort cleanup — the controller is being torn down regardless.
    }
    await controller.dispose();
  }

  Future<void> _onAllowPressed() async {
    setState(() => _phase = _Phase.running);
    await _initCameraAndDetector();
  }

  Future<void> _initCameraAndDetector() async {
    setState(() => _errorMessage = null);

    try {
      final cameras = await availableCameras();
      if (cameras.isEmpty) {
        throw CameraException(
          'noCamerasAvailable',
          'No camera was found on this device.',
        );
      }

      final camera = cameras.firstWhere(
        (c) => c.lensDirection == CameraLensDirection.front,
        orElse: () => cameras.first,
      );
      _cameraDescription = camera;

      _poseDetector ??= PoseDetector(
        options: PoseDetectorOptions(mode: PoseDetectionMode.stream),
      );

      final controller = CameraController(
        camera,
        ResolutionPreset.medium,
        enableAudio: false,
        imageFormatGroup:
            Platform.isAndroid ? ImageFormatGroup.nv21 : ImageFormatGroup.bgra8888,
      );

      await controller.initialize();
      if (!mounted) {
        await controller.dispose();
        return;
      }

      _controller = controller;
      _startedAt ??= DateTime.now();
      await controller.startImageStream(_onCameraImage);

      if (!mounted) return;
      setState(() {});
    } on CameraException catch (e) {
      if (!mounted) return;
      setState(() => _errorMessage = _messageForCameraException(e));
    } catch (_) {
      if (!mounted) return;
      setState(
        () => _errorMessage = 'We could not start the camera on this device.',
      );
    }
  }

  String _messageForCameraException(CameraException e) {
    switch (e.code) {
      case 'CameraAccessDenied':
      case 'CameraAccessDeniedWithoutPrompt':
      case 'CameraAccessRestricted':
        return 'Camera access was denied. Enable camera permission for '
            'PhysioOnClick in your device Settings to use Check your motion.';
      case 'noCamerasAvailable':
        return 'No camera was found on this device.';
      default:
        return 'We could not start the camera (${e.description ?? e.code}).';
    }
  }

  /// Derives the [InputImageRotation] ML Kit needs from the camera's sensor
  /// orientation plus the live device orientation, compensating for the
  /// front-facing lens on Android. This is the standard rotation-handling
  /// pattern used across ML Kit + camera Flutter integrations.
  InputImageRotation? _rotationForImage() {
    final camera = _cameraDescription;
    final controller = _controller;
    if (camera == null || controller == null) return null;

    final sensorOrientation = camera.sensorOrientation;
    if (Platform.isIOS) {
      return InputImageRotationValue.fromRawValue(sensorOrientation);
    }
    if (Platform.isAndroid) {
      final deviceDegrees = _orientations[controller.value.deviceOrientation];
      if (deviceDegrees == null) return null;
      final rotationCompensation =
          camera.lensDirection == CameraLensDirection.front
              ? (sensorOrientation + deviceDegrees) % 360
              : (sensorOrientation - deviceDegrees + 360) % 360;
      return InputImageRotationValue.fromRawValue(rotationCompensation);
    }
    return null;
  }

  Future<void> _onCameraImage(CameraImage image) async {
    if (_isDetecting || !mounted || _phase != _Phase.running) return;
    _isDetecting = true;

    try {
      final rotation = _rotationForImage();
      if (rotation == null) return;

      final format = InputImageFormatValue.fromRawValue(image.format.raw);
      if (format == null || image.planes.length != 1) return;
      final plane = image.planes.first;

      final inputImage = InputImage.fromBytes(
        bytes: plane.bytes,
        metadata: InputImageMetadata(
          size: Size(image.width.toDouble(), image.height.toDouble()),
          rotation: rotation,
          format: format,
          bytesPerRow: plane.bytesPerRow,
        ),
      );

      final detector = _poseDetector;
      if (detector == null) return;
      final poses = await detector.processImage(inputImage);
      if (poses.isEmpty || !mounted || _phase != _Phase.running) return;

      // ML Kit returns landmark x/y relative to the rotated (upright) image.
      // The raw CameraImage width/height are sensor-native (landscape) for a
      // 90/270 rotation, so swap them here to normalize into the same
      // upright frame the skeleton overlay paints against.
      final swapped = rotation == InputImageRotation.rotation90deg ||
          rotation == InputImageRotation.rotation270deg;
      final landmarks = landmarksFromPose(
        poses.first,
        imageWidth: swapped ? image.height.toDouble() : image.width.toDouble(),
        imageHeight: swapped ? image.width.toDouble() : image.height.toDouble(),
      );

      final result = _judge.update(landmarks);
      if (!mounted) return;
      setState(() {
        _latest = result;
        _latestLandmarks = landmarks;
      });
    } catch (_) {
      // Drop a bad frame silently — the next frame retries.
    } finally {
      _isDetecting = false;
    }
  }

  Future<void> _stopStreamSafely() async {
    final controller = _controller;
    if (controller != null && controller.value.isStreamingImages) {
      try {
        await controller.stopImageStream();
      } catch (_) {
        // Ignore — we're finishing up regardless.
      }
    }
  }

  Future<void> _exitWithoutSaving() async {
    await _stopStreamSafely();
    if (mounted) Navigator.of(context).pop(false);
  }

  Future<void> _onFinish() async {
    if (_isSaving) return;
    setState(() {
      _isSaving = true;
      _phase = _Phase.saving;
    });

    await _stopStreamSafely();

    final elapsedSec = _startedAt == null
        ? 0
        : DateTime.now().difference(_startedAt!).inSeconds;

    try {
      await MotionService.saveMotionSession(
        widget.uid,
        widget.personId,
        target: widget.target,
        summary: _judge.summary(),
        date: _todayDateKey(),
        durationSec: elapsedSec,
      );
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _isSaving = false;
        _phase = _Phase.running;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'We could not save your session. Check your connection and try again.',
          ),
        ),
      );
      return;
    }

    if (!mounted) return;
    Navigator.of(context).pop(true);
  }

  String _todayDateKey() {
    final now = DateTime.now();
    final month = now.month.toString().padLeft(2, '0');
    final day = now.day.toString().padLeft(2, '0');
    return '${now.year}-$month-$day';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: switch (_phase) {
          _Phase.consent => _buildConsentPanel(context),
          _Phase.running => _buildRunningPanel(context),
          _Phase.saving => _buildSavingPanel(context),
        },
      ),
    );
  }

  Widget _buildConsentPanel(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text('Check your motion', style: theme.textTheme.headlineMedium),
          const SizedBox(height: 6),
          Text(
            '${widget.target.bodyPart} · ${widget.exerciseTitle}',
            style: theme.textTheme.bodyMedium,
          ),
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.tealLight,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Text(
              'This uses your camera to measure how you move. All processing '
              'happens on your device — your video is never recorded, '
              'uploaded or stored. Only your movement scores are saved.',
              style: theme.textTheme.bodyMedium,
            ),
          ),
          if (_errorMessage != null) ...[
            const SizedBox(height: 16),
            Text(
              _errorMessage!,
              style: theme.textTheme.bodyMedium?.copyWith(color: AppColors.error),
            ),
          ],
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: _onAllowPressed,
            child: const Text('Allow camera & continue'),
          ),
          const SizedBox(height: 10),
          OutlinedButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
        ],
      ),
    );
  }

  Widget _buildRunningPanel(BuildContext context) {
    if (_errorMessage != null) {
      return _buildErrorPanel(context);
    }

    final controller = _controller;
    if (controller == null || !controller.value.isInitialized) {
      return const Center(child: CircularProgressIndicator());
    }

    final theme = Theme.of(context);
    final result = _latest;

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 8, 4),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  '${widget.target.bodyPart} · ${widget.exerciseTitle}',
                  style: theme.textTheme.titleMedium,
                ),
              ),
              IconButton(
                onPressed: _exitWithoutSaving,
                icon: const Icon(Icons.close_rounded),
                tooltip: 'Close',
              ),
            ],
          ),
        ),
        Expanded(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: _buildCameraArea(controller),
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Reps: ${result?.reps ?? 0} / ${widget.target.repTarget}',
                    style: theme.textTheme.titleMedium,
                  ),
                  Flexible(
                    child: Text(
                      result?.cue ?? 'Get into position',
                      style: theme.textTheme.bodyMedium,
                      textAlign: TextAlign.end,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              _buildRomMeter(result),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _isSaving ? null : _onFinish,
                child: const Text('Finish'),
              ),
              const SizedBox(height: 12),
              Text(
                'Movement feedback only — not a medical assessment.',
                textAlign: TextAlign.center,
                style: theme.textTheme.bodySmall,
              ),
              const SizedBox(height: 8),
              const _TroubleContactFooter(),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildCameraArea(CameraController controller) {
    final isFrontCamera =
        _cameraDescription?.lensDirection == CameraLensDirection.front;

    Widget preview = CameraPreview(
      controller,
      child: CustomPaint(
        painter: _PoseOverlayPainter(
          landmarks: _latestLandmarks,
          joint: widget.target.joint,
        ),
      ),
    );

    if (isFrontCamera) {
      preview = Transform(
        alignment: Alignment.center,
        transform: Matrix4.rotationY(math.pi),
        child: preview,
      );
    }

    return ClipRRect(
      borderRadius: BorderRadius.circular(20),
      child: preview,
    );
  }

  Widget _buildRomMeter(FrameResult? result) {
    final angle = result?.angle ?? 0;
    final target = widget.target.targetRomMax;
    final ratio = target <= 0 ? 0.0 : (angle / target).clamp(0.0, 1.0);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Range of motion'),
            Text('$angle° / $target°'),
          ],
        ),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: LinearProgressIndicator(
            value: ratio,
            minHeight: 10,
            backgroundColor: AppColors.border,
            valueColor: const AlwaysStoppedAnimation(AppColors.teal),
          ),
        ),
      ],
    );
  }

  Widget _buildErrorPanel(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.videocam_off_rounded, size: 40, color: AppColors.error),
          const SizedBox(height: 16),
          Text(
            _errorMessage ?? 'We could not access the camera.',
            style: theme.textTheme.bodyLarge,
          ),
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  Widget _buildSavingPanel(BuildContext context) {
    final theme = Theme.of(context);
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const CircularProgressIndicator(),
          const SizedBox(height: 16),
          Text('Saving your session…', style: theme.textTheme.bodyMedium),
        ],
      ),
    );
  }
}

class _TroubleContactFooter extends StatelessWidget {
  const _TroubleContactFooter();

  @override
  Widget build(BuildContext context) {
    return Wrap(
      alignment: WrapAlignment.center,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: [
        Text(
          'Having trouble? Contact your physio: ',
          style: Theme.of(context).textTheme.bodySmall,
        ),
        SelectableText(
          'hello@physioonclick.co.uk',
          style: Theme.of(context)
              .textTheme
              .bodySmall
              ?.copyWith(color: AppColors.teal, fontWeight: FontWeight.w600),
        ),
      ],
    );
  }
}

/// Draws the tracked joint's three landmarks (a -> vertex -> b) and the two
/// connecting bones on top of the camera preview.
class _PoseOverlayPainter extends CustomPainter {
  const _PoseOverlayPainter({required this.landmarks, required this.joint});

  final List<Landmark>? landmarks;
  final MotionJoint joint;

  @override
  void paint(Canvas canvas, Size size) {
    final points = landmarks;
    if (points == null) return;
    if (joint.a >= points.length ||
        joint.vertex >= points.length ||
        joint.b >= points.length) {
      return;
    }

    final a = points[joint.a];
    final v = points[joint.vertex];
    final b = points[joint.b];

    // Nothing detected yet for this joint — avoid drawing a spurious mark at
    // the canvas origin.
    if (a.x == 0 && a.y == 0 && v.x == 0 && v.y == 0 && b.x == 0 && b.y == 0) {
      return;
    }

    Offset toOffset(Landmark l) => Offset(l.x * size.width, l.y * size.height);

    final pa = toOffset(a);
    final pv = toOffset(v);
    final pb = toOffset(b);

    final linePaint = Paint()
      ..color = const Color(0xFF00E5FF)
      ..strokeWidth = 4
      ..strokeCap = StrokeCap.round;

    canvas.drawLine(pa, pv, linePaint);
    canvas.drawLine(pv, pb, linePaint);

    final dotFillPaint = Paint()..color = Colors.white;
    final dotBorderPaint = Paint()
      ..color = AppColors.teal
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3;

    for (final p in [pa, pv, pb]) {
      canvas.drawCircle(p, 8, dotFillPaint);
      canvas.drawCircle(p, 8, dotBorderPaint);
    }
  }

  @override
  bool shouldRepaint(covariant _PoseOverlayPainter oldDelegate) {
    return oldDelegate.landmarks != landmarks || oldDelegate.joint != joint;
  }
}
