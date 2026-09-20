import 'dart:convert';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:path_drawing/path_drawing.dart';

import '../../core/app_colors.dart';
import 'body_chart_regions.dart';
import 'body_regions.dart';

/// Anatomical body chart matching web's `components/body-chart.tsx` +
/// `lib/body-chart.ts`: a stylised skeleton underlay with tappable muscle
/// regions (front / back), sourced from the same `body-muscles` package
/// (Apache-2.0, Copyright 2024 Ivan Vulović) web uses — see
/// `assets/body_chart/muscle_paths.json` and `body_chart_regions.dart`.
class BodyChart extends StatefulWidget {
  const BodyChart({required this.value, required this.onChange, super.key});

  final List<String> value;
  final ValueChanged<List<String>> onChange;

  @override
  State<BodyChart> createState() => _BodyChartState();
}

class _BodyChartState extends State<BodyChart> {
  String _view = 'front';
  bool _showBones = false;
  Map<String, ui.Path>? _frontPaths;
  Map<String, ui.Path>? _backPaths;
  String? _tapped;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final raw = await rootBundle.loadString('assets/body_chart/muscle_paths.json');
    final data = json.decode(raw) as Map<String, dynamic>;
    final front = <String, ui.Path>{
      for (final m in (data['front'] as List)) (m as Map)['id'] as String: parseSvgPathData(m['path'] as String),
    };
    final back = <String, ui.Path>{
      for (final m in (data['back'] as List)) (m as Map)['id'] as String: parseSvgPathData(m['path'] as String),
    };
    if (mounted) {
      setState(() {
        _frontPaths = front;
        _backPaths = back;
      });
    }
  }

  void _toggle(String key) {
    setState(() => _tapped = key);
    if (key == somewhereElse) {
      widget.onChange(widget.value.contains(somewhereElse) ? [] : [somewhereElse]);
      return;
    }
    final next = widget.value.where((k) => k != somewhereElse).toSet();
    if (next.contains(key)) {
      next.remove(key);
    } else {
      next.add(key);
    }
    widget.onChange(next.toList());
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final front = _frontPaths;
    final back = _backPaths;
    if (front == null || back == null) {
      return const SizedBox(height: 300, child: Center(child: CircularProgressIndicator()));
    }

    final paths = _view == 'front' ? front : back;
    final viewBox = _view == 'front' ? const Rect.fromLTWH(0, 0, 35, 93) : const Rect.fromLTWH(37, 0, 35, 93);
    final figureRegions = bodyRegions.where((r) {
      final ids = _view == 'front' ? regionMuscles[r.key]?.front ?? const [] : regionMuscles[r.key]?.back ?? const [];
      return ids.isNotEmpty;
    }).toList();
    final selected = widget.value.toSet();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Wrap(
          spacing: 8,
          runSpacing: 8,
          crossAxisAlignment: WrapCrossAlignment.center,
          children: [
            _ViewToggleButton(
              label: 'Front',
              selected: _view == 'front',
              onTap: () => setState(() {
                _view = 'front';
                _tapped = null;
              }),
            ),
            _ViewToggleButton(
              label: 'Back',
              selected: _view == 'back',
              onTap: () => setState(() {
                _view = 'back';
                _tapped = null;
              }),
            ),
            OutlinedButton(
              onPressed: () => setState(() => _showBones = !_showBones),
              style: OutlinedButton.styleFrom(
                minimumSize: Size.zero,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                backgroundColor: _showBones ? AppColors.navy.withValues(alpha: 0.1) : Colors.transparent,
                foregroundColor: _showBones ? AppColors.navy : AppColors.textSecondary,
                side: BorderSide(color: _showBones ? AppColors.navy : AppColors.border, width: 1.5),
              ),
              child: Text(_showBones ? 'Hide bones' : 'Show bones'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 260),
            child: AspectRatio(
              aspectRatio: viewBox.width / viewBox.height,
              child: LayoutBuilder(
                builder: (context, constraints) {
                  final size = Size(constraints.maxWidth, constraints.maxHeight);
                  final scale = size.width / viewBox.width;
                  return GestureDetector(
                    onTapUp: (details) {
                      final svgPoint = Offset(
                        details.localPosition.dx / scale + viewBox.left,
                        details.localPosition.dy / scale + viewBox.top,
                      );
                      for (final r in figureRegions.reversed) {
                        final ids = _view == 'front' ? regionMuscles[r.key]!.front : regionMuscles[r.key]!.back;
                        final hit = ids.any((id) => paths[id]?.contains(svgPoint) ?? false);
                        if (hit) {
                          _toggle(r.key);
                          return;
                        }
                      }
                    },
                    child: CustomPaint(
                      size: size,
                      painter: _BodyChartPainter(
                        view: _view,
                        viewBox: viewBox,
                        paths: paths,
                        figureRegions: figureRegions,
                        selected: selected,
                        tapped: _tapped,
                        showBones: _showBones,
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
        ),
        if (_tapped != null) ...[
          const SizedBox(height: 8),
          Center(
            child: Column(
              children: [
                Text(regionLabel(_tapped!), style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w700)),
                if (regionClinicalNames[_tapped!] != null)
                  Text(
                    regionClinicalNames[_tapped!]!,
                    style: theme.textTheme.bodySmall?.copyWith(color: AppColors.textSecondary),
                  ),
              ],
            ),
          ),
        ],
        const SizedBox(height: 16),
        Center(
          child: OutlinedButton(
            onPressed: () => _toggle(somewhereElse),
            style: OutlinedButton.styleFrom(minimumSize: Size.zero, padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10)),
            child: const Text('Somewhere else / not sure'),
          ),
        ),
        if (widget.value.isNotEmpty) ...[
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: widget.value
                .map((k) => Chip(
                      label: Text(regionLabel(k)),
                      onDeleted: () => _toggle(k),
                      backgroundColor: AppColors.tealLight,
                      side: BorderSide(color: AppColors.teal.withValues(alpha: 0.3)),
                    ))
                .toList(),
          ),
        ],
      ],
    );
  }
}

class _ViewToggleButton extends StatelessWidget {
  const _ViewToggleButton({required this.label, required this.selected, required this.onTap});

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return OutlinedButton(
      onPressed: onTap,
      style: OutlinedButton.styleFrom(
        minimumSize: Size.zero,
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        backgroundColor: selected ? AppColors.teal : Colors.transparent,
        foregroundColor: selected ? Colors.white : AppColors.navy,
        side: BorderSide(color: selected ? AppColors.teal : AppColors.border),
      ),
      child: Text(label),
    );
  }
}

class _BodyChartPainter extends CustomPainter {
  _BodyChartPainter({
    required this.view,
    required this.viewBox,
    required this.paths,
    required this.figureRegions,
    required this.selected,
    required this.tapped,
    required this.showBones,
  });

  final String view;
  final Rect viewBox;
  final Map<String, ui.Path> paths;
  final List<BodyRegion> figureRegions;
  final Set<String> selected;
  final String? tapped;
  final bool showBones;

  @override
  void paint(Canvas canvas, Size size) {
    final scale = size.width / viewBox.width;
    canvas.save();
    canvas.scale(scale);
    canvas.translate(-viewBox.left, -viewBox.top);

    _paintSkeleton(canvas, view, showBones);

    for (final r in figureRegions) {
      final ids = view == 'front' ? regionMuscles[r.key]!.front : regionMuscles[r.key]!.back;
      final isSelected = selected.contains(r.key);
      final isTapped = tapped == r.key;
      // Mirrors web's default (visible outline), hover/selected fill,
      // and .show-bones (dims non-selected regions so bones pop through).
      final dim = showBones && !isSelected ? 0.5 : 1.0;
      final fill = Paint()
        ..style = PaintingStyle.fill
        ..color = isSelected
            ? AppColors.teal.withValues(alpha: 0.85)
            : isTapped
                ? AppColors.teal.withValues(alpha: 0.34 * dim)
                : AppColors.teal.withValues(alpha: 0.15 * dim);
      final stroke = Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = isSelected ? 0.22 : 0.16
        ..color = isSelected ? AppColors.tealDark : AppColors.teal.withValues(alpha: 0.42 * dim);
      for (final id in ids) {
        final p = paths[id];
        if (p == null) continue;
        canvas.drawPath(p, fill);
        canvas.drawPath(p, stroke);
      }
    }

    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant _BodyChartPainter oldDelegate) {
    return oldDelegate.view != view ||
        oldDelegate.selected != selected ||
        oldDelegate.tapped != tapped ||
        oldDelegate.showBones != showBones;
  }
}

/// Stylised skeleton, ported from web's `Skeleton` (`components/body-chart.tsx`)
/// — joint coordinates measured from the body-muscles figure so the bones
/// register with the muscle regions. L / R are image-left / image-right.
class _Frame {
  const _Frame({
    required this.cx,
    required this.skull,
    required this.shoulderL,
    required this.shoulderR,
    required this.elbowL,
    required this.elbowR,
    required this.wristL,
    required this.wristR,
    required this.hipL,
    required this.hipR,
    required this.kneeL,
    required this.kneeR,
    required this.ankleL,
    required this.ankleR,
    required this.spineTop,
    required this.spineBottom,
    required this.ribcage,
  });

  final double cx;
  final Offset skull;
  final Offset shoulderL, shoulderR;
  final Offset elbowL, elbowR;
  final Offset wristL, wristR;
  final Offset hipL, hipR;
  final Offset kneeL, kneeR;
  final Offset ankleL, ankleR;
  final double spineTop, spineBottom;
  final bool ribcage;
}

const _frameFront = _Frame(
  cx: 16,
  skull: Offset(16, 3.6),
  shoulderL: Offset(22.5, 17),
  shoulderR: Offset(9.5, 17),
  elbowL: Offset(28.5, 30),
  elbowR: Offset(3.5, 30),
  wristL: Offset(27.5, 43),
  wristR: Offset(4.5, 43),
  hipL: Offset(19.5, 49),
  hipR: Offset(12.5, 49),
  kneeL: Offset(20, 66),
  kneeR: Offset(12, 66),
  ankleL: Offset(20, 86),
  ankleR: Offset(12.5, 86),
  spineTop: 8,
  spineBottom: 46,
  ribcage: true,
);

const _frameBack = _Frame(
  cx: 52.5,
  skull: Offset(52.5, 5),
  shoulderL: Offset(45.5, 17),
  shoulderR: Offset(59.5, 17),
  elbowL: Offset(42, 30),
  elbowR: Offset(63, 30),
  wristL: Offset(42, 43),
  wristR: Offset(63, 43),
  hipL: Offset(48.5, 49),
  hipR: Offset(56.5, 49),
  kneeL: Offset(49, 66),
  kneeR: Offset(56, 66),
  ankleL: Offset(50, 86),
  ankleR: Offset(55, 86),
  spineTop: 9,
  spineBottom: 46,
  ribcage: false,
);

void _paintSkeleton(Canvas canvas, String view, bool showBones) {
  final f = view == 'front' ? _frameFront : _frameBack;
  final boneAlpha = showBones ? 0.85 : 0.4;
  final bone = Paint()
    ..style = PaintingStyle.stroke
    ..strokeWidth = showBones ? 0.4 : 0.32
    ..strokeCap = StrokeCap.round
    ..color = AppColors.navy.withValues(alpha: boneAlpha);
  final fillBone = Paint()
    ..style = PaintingStyle.fill
    ..color = AppColors.navy.withValues(alpha: boneAlpha * 0.65);

  // skull + jaw
  canvas.drawOval(Rect.fromCenter(center: f.skull, width: 3.9 * 2, height: 4.3 * 2), bone);
  final jaw = Path()
    ..moveTo(f.skull.dx - 3, f.skull.dy + 1)
    ..quadraticBezierTo(f.skull.dx, f.skull.dy + 5.5, f.skull.dx + 3, f.skull.dy + 1);
  canvas.drawPath(jaw, bone);

  // spine, segmented
  final segments = ((f.spineBottom - f.spineTop) / 2.2).round();
  for (var i = 0; i < segments; i++) {
    final y = f.spineTop + i * 2.2;
    final w = y < 15 ? 1.1 : (y < 34 ? 1.6 : 2.1);
    final rect = RRect.fromRectAndRadius(Rect.fromLTWH(f.cx - w / 2, y, w, 1.4), const Radius.circular(0.5));
    canvas.drawRRect(rect, fillBone);
  }

  // clavicles/ribcage (front) or scapulae (back)
  if (f.ribcage) {
    final clavL = Path()
      ..moveTo(f.cx - 0.6, 15)
      ..quadraticBezierTo((f.cx + f.shoulderL.dx) / 2, 14, f.shoulderL.dx, f.shoulderL.dy);
    canvas.drawPath(clavL, bone);
    final clavR = Path()
      ..moveTo(f.cx + 0.6, 15)
      ..quadraticBezierTo((f.cx + f.shoulderR.dx) / 2, 14, f.shoulderR.dx, f.shoulderR.dy);
    canvas.drawPath(clavR, bone);
    canvas.drawRRect(
      RRect.fromRectAndRadius(Rect.fromLTWH(f.cx - 0.9, 15, 1.8, 13), const Radius.circular(0.6)),
      fillBone,
    );
    for (var i = 0; i < 5; i++) {
      final y = 17.5 + i * 3;
      final r = 7.2 - i * 0.5;
      final ribL = Path()
        ..moveTo(f.cx - 0.8, y)
        ..quadraticBezierTo(f.cx - r, y + 1, f.cx - r + 1.2, y + 5);
      canvas.drawPath(ribL, bone);
      final ribR = Path()
        ..moveTo(f.cx + 0.8, y)
        ..quadraticBezierTo(f.cx + r, y + 1, f.cx + r - 1.2, y + 5);
      canvas.drawPath(ribR, bone);
    }
  } else {
    final scapL = Path()
      ..moveTo(f.cx - 1.5, 16.5)
      ..lineTo(f.shoulderL.dx - 1.5, 17)
      ..lineTo(f.cx - 2.5, 25)
      ..close();
    canvas.drawPath(scapL, bone);
    final scapR = Path()
      ..moveTo(f.cx + 1.5, 16.5)
      ..lineTo(f.shoulderR.dx + 1.5, 17)
      ..lineTo(f.cx + 2.5, 25)
      ..close();
    canvas.drawPath(scapR, bone);
  }

  // pelvis
  final pelvis = Path()
    ..moveTo(f.hipR.dx - 1, f.spineBottom - 3)
    ..cubicTo(f.hipR.dx - 4, f.spineBottom - 2, f.hipR.dx - 4, f.hipR.dy - 1, f.hipR.dx, f.hipR.dy + 1)
    ..lineTo(f.cx, f.hipR.dy + 2)
    ..lineTo(f.hipL.dx, f.hipL.dy + 1)
    ..cubicTo(f.hipL.dx + 4, f.hipL.dy - 1, f.hipL.dx + 4, f.spineBottom - 2, f.hipL.dx + 1, f.spineBottom - 3)
    ..quadraticBezierTo(f.cx, f.spineBottom - 1, f.hipR.dx - 1, f.spineBottom - 3)
    ..close();
  canvas.drawPath(pelvis, bone);
  canvas.drawCircle(f.hipL, 1.1, bone);
  canvas.drawCircle(f.hipR, 1.1, bone);

  // arms
  canvas.drawLine(f.shoulderL, f.elbowL, bone);
  canvas.drawLine(f.shoulderR, f.elbowR, bone);
  canvas.drawCircle(f.elbowL, 1.1, bone);
  canvas.drawCircle(f.elbowR, 1.1, bone);
  canvas.drawLine(Offset(f.elbowL.dx - 0.6, f.elbowL.dy), Offset(f.wristL.dx - 0.6, f.wristL.dy), bone);
  canvas.drawLine(Offset(f.elbowL.dx + 0.6, f.elbowL.dy), Offset(f.wristL.dx + 0.6, f.wristL.dy), bone);
  canvas.drawLine(Offset(f.elbowR.dx - 0.6, f.elbowR.dy), Offset(f.wristR.dx - 0.6, f.wristR.dy), bone);
  canvas.drawLine(Offset(f.elbowR.dx + 0.6, f.elbowR.dy), Offset(f.wristR.dx + 0.6, f.wristR.dy), bone);

  // hands
  for (final entry in [(f.wristL, 1), (f.wristR, -1)]) {
    final w = entry.$1;
    final dir = entry.$2;
    for (var k = 0; k < 5; k++) {
      final dy = 5 - (k == 4 ? 2 : (k == 0 ? 1 : 0));
      canvas.drawLine(
        Offset(w.dx, w.dy + 0.5),
        Offset(w.dx + dir * (1.5 + k * 0.9), w.dy + dy),
        bone,
      );
    }
  }

  // legs
  canvas.drawLine(f.hipL, f.kneeL, bone);
  canvas.drawLine(f.hipR, f.kneeR, bone);
  canvas.drawCircle(f.kneeL, 1.3, bone);
  canvas.drawCircle(f.kneeR, 1.3, bone);
  canvas.drawLine(Offset(f.kneeL.dx - 0.7, f.kneeL.dy), Offset(f.ankleL.dx - 0.7, f.ankleL.dy), bone);
  canvas.drawLine(Offset(f.kneeL.dx + 0.7, f.kneeL.dy), Offset(f.ankleL.dx + 0.7, f.ankleL.dy), bone);
  canvas.drawLine(Offset(f.kneeR.dx - 0.7, f.kneeR.dy), Offset(f.ankleR.dx - 0.7, f.ankleR.dy), bone);
  canvas.drawLine(Offset(f.kneeR.dx + 0.7, f.kneeR.dy), Offset(f.ankleR.dx + 0.7, f.ankleR.dy), bone);

  // feet
  for (final an in [f.ankleL, f.ankleR]) {
    final foot = Path()
      ..moveTo(an.dx - 1.5, an.dy + 1)
      ..lineTo(an.dx, an.dy + 5.5)
      ..lineTo(an.dx + 1.5, an.dy + 1)
      ..close();
    canvas.drawPath(foot, bone);
  }
}
