import 'assessment_model.dart';

/// Region taxonomy + pure derivations, mirroring `lib/body-chart.ts` and its
/// `BODY_REGIONS` list. Web renders these as tappable zones on an anatomical
/// SVG (using the licensed `body-muscles` package's muscle path data); mobile
/// renders the same region list as a grouped, multi-select chip picker
/// instead of porting that SVG artwork — same taxonomy, same selection
/// behaviour and derivations, simpler visual presentation.
class BodyRegion {
  final String key;
  final String label;
  final String clinicalArea;

  const BodyRegion({required this.key, required this.label, required this.clinicalArea});
}

const somewhereElse = 'somewhere-else';

const List<BodyRegion> bodyRegions = [
  BodyRegion(key: 'head-jaw', label: 'Head, face or jaw', clinicalArea: ClinicalArea.general),
  BodyRegion(key: 'neck', label: 'Neck', clinicalArea: ClinicalArea.spine),
  BodyRegion(key: 'upper-back', label: 'Upper back & shoulder blades', clinicalArea: ClinicalArea.spine),
  BodyRegion(key: 'mid-back', label: 'Mid back', clinicalArea: ClinicalArea.spine),
  BodyRegion(key: 'lower-back', label: 'Lower back', clinicalArea: ClinicalArea.spine),
  BodyRegion(key: 'chest', label: 'Chest', clinicalArea: ClinicalArea.general),
  BodyRegion(key: 'abdomen', label: 'Stomach', clinicalArea: ClinicalArea.general),
  BodyRegion(key: 'side-left', label: 'Left side of the trunk', clinicalArea: ClinicalArea.general),
  BodyRegion(key: 'side-right', label: 'Right side of the trunk', clinicalArea: ClinicalArea.general),
  BodyRegion(key: 'shoulder-left', label: 'Left shoulder', clinicalArea: ClinicalArea.upperLimb),
  BodyRegion(key: 'shoulder-right', label: 'Right shoulder', clinicalArea: ClinicalArea.upperLimb),
  BodyRegion(key: 'upper-arm-left', label: 'Left upper arm', clinicalArea: ClinicalArea.upperLimb),
  BodyRegion(key: 'upper-arm-right', label: 'Right upper arm', clinicalArea: ClinicalArea.upperLimb),
  BodyRegion(key: 'elbow-left', label: 'Left elbow', clinicalArea: ClinicalArea.upperLimb),
  BodyRegion(key: 'elbow-right', label: 'Right elbow', clinicalArea: ClinicalArea.upperLimb),
  BodyRegion(key: 'forearm-left', label: 'Left forearm', clinicalArea: ClinicalArea.upperLimb),
  BodyRegion(key: 'forearm-right', label: 'Right forearm', clinicalArea: ClinicalArea.upperLimb),
  BodyRegion(key: 'hand-left', label: 'Left wrist or hand', clinicalArea: ClinicalArea.upperLimb),
  BodyRegion(key: 'hand-right', label: 'Right wrist or hand', clinicalArea: ClinicalArea.upperLimb),
  BodyRegion(key: 'hip-left', label: 'Left hip or groin', clinicalArea: ClinicalArea.lowerLimb),
  BodyRegion(key: 'hip-right', label: 'Right hip or groin', clinicalArea: ClinicalArea.lowerLimb),
  BodyRegion(key: 'buttock-left', label: 'Left buttock', clinicalArea: ClinicalArea.lowerLimb),
  BodyRegion(key: 'buttock-right', label: 'Right buttock', clinicalArea: ClinicalArea.lowerLimb),
  BodyRegion(key: 'thigh-left', label: 'Left thigh', clinicalArea: ClinicalArea.lowerLimb),
  BodyRegion(key: 'thigh-right', label: 'Right thigh', clinicalArea: ClinicalArea.lowerLimb),
  BodyRegion(key: 'knee-left', label: 'Left knee', clinicalArea: ClinicalArea.lowerLimb),
  BodyRegion(key: 'knee-right', label: 'Right knee', clinicalArea: ClinicalArea.lowerLimb),
  BodyRegion(key: 'lower-leg-left', label: 'Left shin or calf', clinicalArea: ClinicalArea.lowerLimb),
  BodyRegion(key: 'lower-leg-right', label: 'Right shin or calf', clinicalArea: ClinicalArea.lowerLimb),
  BodyRegion(key: 'foot-left', label: 'Left ankle or foot', clinicalArea: ClinicalArea.lowerLimb),
  BodyRegion(key: 'foot-right', label: 'Right ankle or foot', clinicalArea: ClinicalArea.lowerLimb),
];

final _regionByKey = {for (final r in bodyRegions) r.key: r};
const _spineKeys = {'neck', 'upper-back', 'mid-back', 'lower-back'};

String regionLabel(String key) {
  if (key == somewhereElse) return 'Somewhere else / not sure';
  return _regionByKey[key]?.label ?? key;
}

/// Mirrors web's `deriveClinicalArea` (`lib/body-chart.ts`).
String deriveClinicalArea(List<String> keys) {
  final real = keys.where(_regionByKey.containsKey).toList();
  if (real.isEmpty) return ClinicalArea.general;
  if (real.any(_spineKeys.contains)) return ClinicalArea.spine;
  final areas = real.map((k) => _regionByKey[k]!.clinicalArea).toSet()..remove(ClinicalArea.general);
  if (areas.length == 1) return areas.first;
  return ClinicalArea.general;
}

/// Mirrors web's `describeRegions` (`lib/body-chart.ts`).
String describeRegions(List<String> keys) {
  if (keys.isEmpty) return '';
  if (keys.length == 1 && keys.first == somewhereElse) return 'Somewhere else / not sure';
  final labels = keys.where((k) => k != somewhereElse).map(regionLabel).toList();
  if (keys.contains(somewhereElse)) labels.add('somewhere else');
  final joined = labels.join(', ');
  return joined.length > 120 ? '${joined.substring(0, 117)}…' : joined;
}

/// `days` | `weeks` | `months` | `since-op` | `not-sure` — mirrors web's `HowLong`.
class HowLong {
  static const days = 'days';
  static const weeks = 'weeks';
  static const months = 'months';
  static const sinceOp = 'since-op';
  static const notSure = 'not-sure';
}

String _isoDaysAgo(int days) {
  final d = DateTime.now().subtract(Duration(days: days));
  return '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
}

/// Mirrors web's `deriveSymptomStartDate` (`lib/body-chart.ts`).
String deriveSymptomStartDate(String howLong) {
  switch (howLong) {
    case HowLong.days:
      return _isoDaysAgo(7);
    case HowLong.weeks:
      return _isoDaysAgo(21);
    case HowLong.months:
      return _isoDaysAgo(90);
    default:
      return '';
  }
}

/// Mirrors web's `deriveOnsetPattern` (`lib/body-chart.ts`).
String deriveOnsetPattern(String howLong) {
  switch (howLong) {
    case HowLong.days:
      return OnsetPattern.sudden;
    case HowLong.weeks:
    case HowLong.months:
      return OnsetPattern.gradual;
    case HowLong.sinceOp:
      return OnsetPattern.postSurgery;
    default:
      return OnsetPattern.notSure;
  }
}

/// UK phone validation, mirrors `validateUKPhone` (`lib/validation.ts`).
/// Empty is valid at the validator level (optional field); the wizard's own
/// step-advance check additionally requires it non-empty for `context`.
final _ukPhoneRe = RegExp(r'^(?:\+44\s?|0)(?:\d\s?){9,10}$');

bool isValidUKPhone(String value) {
  final v = value.trim();
  if (v.isEmpty) return true;
  return v.length <= 20 && _ukPhoneRe.hasMatch(v);
}
