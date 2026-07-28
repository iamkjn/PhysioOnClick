// Live camera "Check your facial motion" screen for palsy/stroke/older
// patients — the facial counterpart of motion_check_screen.dart. Streams camera
// frames through ML Kit's on-device Face Mesh detector into a single
// [FaceJudge], grading left/right SYMMETRY plus gentle reps, and saves the
// session summary via [MotionService.saveFaceMotionSession].
//
// Nothing here ever leaves the device except the final numeric summary — no
// video or frame data is uploaded or persisted.
//
// PLATFORM NOTE: ML Kit Face Mesh is Android-only. On iOS this screen shows an
// explanatory message instead of attempting to open the detector.

import 'dart:async';
import 'dart:io' show Platform;
import 'dart:math' as math;

import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_mlkit_face_mesh_detection/google_mlkit_face_mesh_detection.dart';

import '../../core/analytics/analytics_service.dart';
import '../../core/app_colors.dart';
import 'face_adapter.dart';
import 'face_engine.dart';
import 'motion_service.dart';

enum _Phase { consent, running, saving }

class FaceCheckScreen extends StatefulWidget {
  const FaceCheckScreen({
    super.key,
    required this.exerciseId,
    required this.exerciseTitle,
    required this.target,
    required this.uid,
    required this.personId,
  });

  final String exerciseId;
  final String exerciseTitle;
  final FaceTarget target;
  final String uid;
  final String personId;

  @override
  State<FaceCheckScreen> createState() => _FaceCheckScreenState();
}

class _FaceCheckScreenState extends State<FaceCheckScreen>
    with WidgetsBindingObserver {
  static const _orientations = {
    DeviceOrientation.portraitUp: 0,
    DeviceOrientation.landscapeLeft: 90,
    DeviceOrientation.portraitDown: 180,
    DeviceOrientation.landscapeRight: 270,
  };

  _Phase _phase = _Phase.consent;

  late final FaceJudge _judge;
  CameraController? _controller;
  CameraDescription? _cameraDescription;
  FaceMeshDetector? _meshDetector;

  bool _isDetecting = false;
  bool _isSaving = false;
  DateTime? _startedAt;
  String? _errorMessage;

  FaceFrameResult? _latest;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _judge = FaceJudge(widget.target);
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
    final detector = _meshDetector;
    _meshDetector = null;
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
    // ML Kit Face Mesh is Android-only — fail early and clearly on iOS rather
    // than opening the camera to a detector that will never return a mesh.
    if (!Platform.isAndroid) {
      setState(() {
        _phase = _Phase.consent;
        _errorMessage =
            'Facial motion check is currently available on Android devices '
            'only. The body-movement checks work on this device.';
      });
      return;
    }
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

      _meshDetector ??= FaceMeshDetector(option: FaceMeshDetectorOptions.faceMesh);

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

      final detector = _meshDetector;
      if (detector == null) return;
      final meshes = await detector.processImage(inputImage);
      if (meshes.isEmpty || !mounted || _phase != _Phase.running) return;

      final swapped = rotation == InputImageRotation.rotation90deg ||
          rotation == InputImageRotation.rotation270deg;
      final landmarks = faceLandmarksFromMesh(
        meshes.first,
        imageWidth: swapped ? image.height.toDouble() : image.width.toDouble(),
        imageHeight: swapped ? image.width.toDouble() : image.height.toDouble(),
      );

      final result = _judge.update(landmarks);
      if (!mounted) return;
      setState(() => _latest = result);
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
    final summary = _judge.summary();

    Analytics.track('face_motion_check_complete', {
      'exercise': widget.exerciseTitle,
      'reps': summary.reps,
      'symmetry_avg': summary.symmetryAvg,
      'duration_sec': elapsedSec,
    });

    try {
      await MotionService.saveFaceMotionSession(
        widget.uid,
        widget.personId,
        target: widget.target,
        summary: summary,
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
          Text('Check your facial motion', style: theme.textTheme.headlineMedium),
          const SizedBox(height: 6),
          Text('Face · ${widget.exerciseTitle}', style: theme.textTheme.bodyMedium),
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.tealLight,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Text(
              'This uses your camera to measure how evenly the two sides of your '
              'face move. All processing happens on your device — your video is '
              'never recorded, uploaded or stored. Only your movement scores '
              '(reps and symmetry) are saved.',
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
                  'Face · ${widget.exerciseTitle}',
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
                      result?.cue ?? 'Get your face into frame',
                      style: theme.textTheme.bodyMedium,
                      textAlign: TextAlign.end,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              _buildSymmetryMeter(result),
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
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildCameraArea(CameraController controller) {
    final isFrontCamera =
        _cameraDescription?.lensDirection == CameraLensDirection.front;

    Widget preview = CameraPreview(controller);

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

  Widget _buildSymmetryMeter(FaceFrameResult? result) {
    final symmetry = result?.symmetry ?? 100;
    final left = (result?.leftPct ?? 0) / 100;
    final right = (result?.rightPct ?? 0) / 100;
    final tone = symmetry >= 75
        ? AppColors.teal
        : symmetry >= 50
            ? const Color(0xFFE2A03F)
            : AppColors.error;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Left / right symmetry'),
            Text('$symmetry%',
                style: TextStyle(color: tone, fontWeight: FontWeight.w700)),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(child: _sideBar('Left', left.clamp(0.0, 1.0), tone)),
            const SizedBox(width: 12),
            Expanded(child: _sideBar('Right', right.clamp(0.0, 1.0), tone)),
          ],
        ),
      ],
    );
  }

  Widget _sideBar(String label, double value, Color tone) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: Theme.of(context).textTheme.bodySmall),
        const SizedBox(height: 4),
        ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: LinearProgressIndicator(
            value: value,
            minHeight: 10,
            backgroundColor: AppColors.border,
            valueColor: AlwaysStoppedAnimation(tone),
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
