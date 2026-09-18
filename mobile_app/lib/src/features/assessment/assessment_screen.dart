import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '../../core/app_colors.dart';
import 'assessment_model.dart';
import 'assessment_repository.dart';
import 'body_regions.dart';

typedef _StepId = String;

const _kIntro = 'intro';
const _kBody = 'body';
const _kStory = 'story';
const _kImpact = 'impact';
const _kContext = 'context';
const _kSafety = 'safety';
const _kConsent = 'consent';
const List<_StepId> _steps = [_kIntro, _kBody, _kStory, _kImpact, _kContext, _kSafety, _kConsent];

const _howLongOptions = [
  (value: HowLong.days, label: 'A few days'),
  (value: HowLong.weeks, label: 'A few weeks'),
  (value: HowLong.months, label: 'A few months or more'),
  (value: HowLong.sinceOp, label: 'Since an operation'),
  (value: HowLong.notSure, label: 'Not sure'),
];

const _redFlagOptions = [
  (key: 'majorTrauma', label: 'A recent serious injury, fall or suspected broken bone'),
  (key: 'chestPainBreathlessness', label: 'Chest pain, breathlessness, blackouts or dizziness'),
  (key: 'bladderBowelSaddle', label: "New problems with your bladder, bowel or numbness around the saddle area"),
  (key: 'progressiveWeakness', label: "Weakness or clumsiness that's quickly getting worse"),
  (key: 'unexplainedFeverWeightLoss', label: 'Unexplained fever, night sweats or weight loss'),
  (key: 'nightPain', label: "Constant pain that's there all night"),
];

/// Native patient assessment — a short, full-screen step wizard mirroring
/// web's `AssessmentWizard` (`components/assessment-wizard.tsx`) one
/// question per screen: intro → body area → story → impact → context →
/// safety → consent. The body-area step uses a grouped chip picker instead
/// of porting web's anatomical SVG chart (see `body_regions.dart`), but the
/// region taxonomy, step order, validation, and submitted field shape all
/// match web exactly.
class AssessmentScreen extends StatefulWidget {
  const AssessmentScreen({
    required this.bookingId,
    required this.personId,
    required this.personName,
    this.onSubmitted,
    super.key,
  });

  final String bookingId;
  final String personId;
  final String personName;

  /// When set, called with the newly created assessment form's Firestore
  /// document id instead of the standalone "assessment submitted" snackbar +
  /// pop. Used by the booking flow's assessment step to move on to payment.
  final ValueChanged<String>? onSubmitted;

  @override
  State<AssessmentScreen> createState() => _AssessmentScreenState();
}

class _AssessmentScreenState extends State<AssessmentScreen> {
  int _stepIdx = 0;
  bool _submitting = false;

  final List<String> _regions = [];
  final _storyController = TextEditingController();
  String _howLong = '';
  double _pain = 3;
  final _impactController = TextEditingController();
  final _contextController = TextEditingController();
  final _ecNameController = TextEditingController();
  final _ecPhoneController = TextEditingController();

  bool _majorTrauma = false;
  bool _chestPainBreathlessness = false;
  bool _bladderBowelSaddle = false;
  bool _progressiveWeakness = false;
  bool _unexplainedFeverWeightLoss = false;
  bool _nightPain = false;
  bool _redFlagsNone = false;

  bool _careConsent = false;
  bool _dataConsent = false;
  bool _privacyConsent = false;
  bool _safetyConsent = false;
  final _signatureController = TextEditingController();

  @override
  void dispose() {
    _storyController.dispose();
    _impactController.dispose();
    _contextController.dispose();
    _ecNameController.dispose();
    _ecPhoneController.dispose();
    _signatureController.dispose();
    super.dispose();
  }

  bool get _hasAnyRedFlag =>
      _majorTrauma ||
      _chestPainBreathlessness ||
      _bladderBowelSaddle ||
      _progressiveWeakness ||
      _unexplainedFeverWeightLoss ||
      _nightPain;

  bool _redFlagValue(String key) => switch (key) {
        'majorTrauma' => _majorTrauma,
        'chestPainBreathlessness' => _chestPainBreathlessness,
        'bladderBowelSaddle' => _bladderBowelSaddle,
        'progressiveWeakness' => _progressiveWeakness,
        'unexplainedFeverWeightLoss' => _unexplainedFeverWeightLoss,
        'nightPain' => _nightPain,
        _ => false,
      };

  void _toggleRedFlag(String key) {
    setState(() {
      _redFlagsNone = false;
      switch (key) {
        case 'majorTrauma':
          _majorTrauma = !_majorTrauma;
        case 'chestPainBreathlessness':
          _chestPainBreathlessness = !_chestPainBreathlessness;
        case 'bladderBowelSaddle':
          _bladderBowelSaddle = !_bladderBowelSaddle;
        case 'progressiveWeakness':
          _progressiveWeakness = !_progressiveWeakness;
        case 'unexplainedFeverWeightLoss':
          _unexplainedFeverWeightLoss = !_unexplainedFeverWeightLoss;
        case 'nightPain':
          _nightPain = !_nightPain;
      }
    });
  }

  void _toggleNoneOfThese() {
    setState(() {
      _redFlagsNone = !_redFlagsNone;
      if (_redFlagsNone) {
        _majorTrauma = false;
        _chestPainBreathlessness = false;
        _bladderBowelSaddle = false;
        _progressiveWeakness = false;
        _unexplainedFeverWeightLoss = false;
        _nightPain = false;
      }
    });
  }

  /// Mirrors web's `canAdvance` (`components/assessment-wizard.tsx`).
  bool _canAdvance(_StepId step) {
    switch (step) {
      case _kBody:
        return _regions.isNotEmpty;
      case _kStory:
        return _storyController.text.trim().length >= 10 && _howLong.isNotEmpty;
      case _kImpact:
        return _impactController.text.trim().length >= 5;
      case _kContext:
        return _ecNameController.text.trim().isNotEmpty &&
            _ecPhoneController.text.trim().isNotEmpty &&
            isValidUKPhone(_ecPhoneController.text);
      case _kSafety:
        return _redFlagsNone || _hasAnyRedFlag;
      case _kConsent:
        return _careConsent &&
            _dataConsent &&
            _privacyConsent &&
            _safetyConsent &&
            _signatureController.text.trim().length >= 2;
      default:
        return true;
    }
  }

  void _back() => setState(() => _stepIdx = (_stepIdx - 1).clamp(0, _steps.length - 1));
  void _forward() => setState(() => _stepIdx = (_stepIdx + 1).clamp(0, _steps.length - 1));

  Future<void> _submit() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null || !_canAdvance(_kConsent) || _submitting) return;

    setState(() => _submitting = true);

    final howLong = _howLong.isEmpty ? HowLong.notSure : _howLong;
    final now = DateTime.now();
    final input = AssessmentInput(
      formType: AssessmentFormType.initial,
      consultationMode: AssessmentConsultationMode.online,
      completedVia: AssessmentCompletionMethod.onlineForm,
      patientName: widget.personName,
      completedBy: widget.personName,
      relationshipToPatient: 'self',
      presentingComplaint: _storyController.text.trim(),
      bodyArea: describeRegions(_regions),
      bodyRegions: _regions,
      symptomStartDate: deriveSymptomStartDate(howLong),
      onsetPattern: deriveOnsetPattern(howLong),
      painScore: _pain.round(),
      subjective: SubjectiveAssessmentProfile(clinicalArea: deriveClinicalArea(_regions)),
      outcomes: const OutcomeMeasureSet(),
      objectiveVideo: const ObjectiveVideoAssessment(),
      goalsPlan: GoalSetting(meaningfulGoal: _impactController.text.trim()),
      symptoms: _storyController.text.trim(),
      aggravatingFactors: '',
      easingFactors: '',
      functionalImpact: _impactController.text.trim(),
      goals: _impactController.text.trim(),
      medicalHistory: _contextController.text.trim(),
      medications: '',
      allergies: '',
      previousTreatment: '',
      communicationNeeds: '',
      emergencyContactName: _ecNameController.text.trim(),
      emergencyContactPhone: _ecPhoneController.text.trim(),
      redFlags: AssessmentRedFlags(
        majorTrauma: _majorTrauma,
        chestPainBreathlessness: _chestPainBreathlessness,
        bladderBowelSaddle: _bladderBowelSaddle,
        progressiveWeakness: _progressiveWeakness,
        unexplainedFeverWeightLoss: _unexplainedFeverWeightLoss,
        nightPain: _nightPain,
        none: _redFlagsNone,
      ),
      onlineReadiness: const OnlineReadiness(),
      consent: AssessmentConsent(
        careConsent: _careConsent,
        dataConsent: _dataConsent,
        privacyConsent: _privacyConsent,
        safetySharing: _safetyConsent,
        videoConsent: false,
      ),
      signature: _signatureController.text.trim(),
      completedAt: '${now.year.toString().padLeft(4, '0')}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}',
      submittedByUid: user.uid,
      bookingId: widget.bookingId,
    );

    try {
      final formId = await AssessmentRepository().submit(
        uid: user.uid,
        personId: widget.personId,
        bookingId: widget.bookingId,
        input: input,
      );
      if (!mounted) return;
      if (widget.onSubmitted != null) {
        widget.onSubmitted!(formId);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Thank you — that's everything.")),
        );
        Navigator.pop(context, true);
      }
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("We couldn't submit your form. Please try again.")),
      );
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  /// Mirrors web's `hasUrgentRedFlags` (`lib/assessment-forms.ts`) exactly —
  /// identical to [_hasAnyRedFlag].
  bool get _urgent => _hasAnyRedFlag;

  @override
  Widget build(BuildContext context) {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      return const Scaffold(body: Center(child: Text('Sign in to complete your assessment')));
    }

    final step = _steps[_stepIdx];
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(title: const Text('Pre-Session Assessment')),
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(999),
                    child: LinearProgressIndicator(
                      value: (_stepIdx + 1) / _steps.length,
                      minHeight: 6,
                      backgroundColor: AppColors.border,
                      valueColor: const AlwaysStoppedAnimation<Color>(AppColors.teal),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Step ${_stepIdx + 1} of ${_steps.length}',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: AppColors.textSecondary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
                children: [_buildStep(step, theme)],
              ),
            ),
            SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
                child: Row(
                  children: [
                    if (_stepIdx > 0)
                      OutlinedButton(onPressed: _back, child: const Text('Back'))
                    else
                      const SizedBox.shrink(),
                    const Spacer(),
                    if (step == _kConsent)
                      FilledButton(
                        onPressed: (_canAdvance(_kConsent) && !_submitting) ? _submit : null,
                        style: FilledButton.styleFrom(backgroundColor: AppColors.teal),
                        child: _submitting
                            ? const SizedBox(
                                height: 18,
                                width: 18,
                                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                              )
                            : const Text('Submit'),
                      )
                    else
                      FilledButton(
                        onPressed: _canAdvance(step) ? _forward : null,
                        style: FilledButton.styleFrom(backgroundColor: AppColors.teal),
                        child: const Text('Continue'),
                      ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStep(_StepId step, ThemeData theme) {
    switch (step) {
      case _kIntro:
        return _StepShell(
          title: "Let's get you ready for your appointment.",
          children: [
            const Text(
              'A few quick questions — about 3 minutes. Your physiotherapist reads this before you meet, '
              'so the session starts where it matters.',
            ),
            const SizedBox(height: 16),
            Text('Completing this for ${widget.personName}.', style: theme.textTheme.bodyMedium),
          ],
        );

      case _kBody:
        return _StepShell(
          title: 'Where is the problem?',
          hint: "Tap every area that's involved. You can pick more than one.",
          children: [
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                ...bodyRegions.map((r) => ChoiceChip(
                      label: Text(r.label),
                      selected: _regions.contains(r.key),
                      onSelected: (_) => setState(() {
                        _regions.remove(somewhereElse);
                        if (_regions.contains(r.key)) {
                          _regions.remove(r.key);
                        } else {
                          _regions.add(r.key);
                        }
                      }),
                    )),
              ],
            ),
            const SizedBox(height: 16),
            OutlinedButton(
              onPressed: () => setState(() {
                if (_regions.contains(somewhereElse)) {
                  _regions.clear();
                } else {
                  _regions
                    ..clear()
                    ..add(somewhereElse);
                }
              }),
              child: const Text('Somewhere else / not sure'),
            ),
          ],
        );

      case _kStory:
        return _StepShell(
          title: "Tell us what's going on.",
          hint: 'In your own words — what it feels like, when it started, what makes it better or worse.',
          children: [
            TextField(
              controller: _storyController,
              maxLines: 5,
              maxLength: 2000,
              onChanged: (_) => setState(() {}),
              decoration: const InputDecoration(
                hintText: 'e.g. A sharp pain in my right shoulder when I lift my arm overhead, started '
                    'about three weeks ago after decorating…',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            Text('How long have you had it?', style: theme.textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _howLongOptions
                  .map((h) => ChoiceChip(
                        label: Text(h.label),
                        selected: _howLong == h.value,
                        onSelected: (_) => setState(() => _howLong = h.value),
                      ))
                  .toList(),
            ),
            const SizedBox(height: 16),
            Text('Pain right now: ${_pain.round()}/10', style: theme.textTheme.bodyMedium),
            Slider(
              value: _pain,
              min: 0,
              max: 10,
              divisions: 10,
              activeColor: AppColors.teal,
              onChanged: (v) => setState(() => _pain = v),
            ),
          ],
        );

      case _kImpact:
        return _StepShell(
          title: 'What has this been getting in the way of?',
          hint: 'No rush — just the everyday things that matter most to you, like work, sleep, sport, or '
              'lifting the kids.',
          children: [
            TextField(
              controller: _impactController,
              maxLines: 4,
              maxLength: 1500,
              onChanged: (_) => setState(() {}),
              decoration: const InputDecoration(
                hintText: "e.g. I can't sleep on that side and I've stopped going to the gym.",
                border: OutlineInputBorder(),
              ),
            ),
          ],
        );

      case _kContext:
        return _StepShell(
          title: 'Anything we should know?',
          hint: 'Optional — medicines you take, past injuries or operations, or health conditions.',
          children: [
            TextField(
              controller: _contextController,
              maxLines: 4,
              maxLength: 2000,
              decoration: const InputDecoration(
                hintText: 'e.g. I take blood pressure tablets. Broke the same wrist 10 years ago.',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 20),
            Text('Emergency contact (required)', style: theme.textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            TextField(
              controller: _ecNameController,
              maxLength: 80,
              onChanged: (_) => setState(() {}),
              decoration: const InputDecoration(labelText: 'Name', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _ecPhoneController,
              maxLength: 20,
              keyboardType: TextInputType.phone,
              onChanged: (_) => setState(() {}),
              decoration: InputDecoration(
                labelText: 'Phone',
                border: const OutlineInputBorder(),
                errorText: _ecPhoneController.text.trim().isNotEmpty && !isValidUKPhone(_ecPhoneController.text)
                    ? 'Enter a valid UK phone number.'
                    : null,
              ),
            ),
          ],
        );

      case _kSafety:
        return _StepShell(
          title: 'A quick safety check.',
          hint: 'Physiotherapists screen for a few things that need a doctor first. Do any of these apply '
              'right now?',
          children: [
            ..._redFlagOptions.map((f) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: _FlagButton(
                    label: f.label,
                    selected: _redFlagValue(f.key),
                    onTap: () => _toggleRedFlag(f.key),
                  ),
                )),
            _FlagButton(
              label: 'None of these',
              selected: _redFlagsNone,
              onTap: _toggleNoneOfThese,
            ),
            if (_urgent) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEE2E2),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFFCA5A5)),
                ),
                child: const Text(
                  "Some of what you've described may need urgent medical attention. Please contact your "
                  'GP, call NHS 111, or call 999 if it\'s an emergency. You can still submit this form so '
                  'your physiotherapist has the detail.',
                  style: TextStyle(color: Color(0xFF991B1B)),
                ),
              ),
            ],
          ],
        );

      case _kConsent:
        return _StepShell(
          title: 'Last step — your consent.',
          children: [
            CheckboxListTile(
              contentPadding: EdgeInsets.zero,
              controlAffinity: ListTileControlAffinity.leading,
              value: _careConsent,
              onChanged: (v) => setState(() => _careConsent = v ?? false),
              title: const Text("I'm happy to have an online physiotherapy assessment and treatment."),
            ),
            CheckboxListTile(
              contentPadding: EdgeInsets.zero,
              controlAffinity: ListTileControlAffinity.leading,
              value: _dataConsent,
              onChanged: (v) => setState(() => _dataConsent = v ?? false),
              title: const Text('I agree to PhysioOnClick storing this information to provide my care.'),
            ),
            CheckboxListTile(
              contentPadding: EdgeInsets.zero,
              controlAffinity: ListTileControlAffinity.leading,
              value: _privacyConsent,
              onChanged: (v) => setState(() => _privacyConsent = v ?? false),
              title: const Text("I've read how my information is used (privacy policy)."),
            ),
            CheckboxListTile(
              contentPadding: EdgeInsets.zero,
              controlAffinity: ListTileControlAffinity.leading,
              value: _safetyConsent,
              onChanged: (v) => setState(() => _safetyConsent = v ?? false),
              title: const Text(
                'I understand my physiotherapist may contact my GP or emergency services if there\'s a '
                'safety concern.',
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _signatureController,
              onChanged: (_) => setState(() {}),
              decoration: const InputDecoration(
                labelText: 'Type your name to confirm',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        );

      default:
        return const SizedBox.shrink();
    }
  }
}

class _StepShell extends StatelessWidget {
  const _StepShell({required this.title, required this.children, this.hint});

  final String title;
  final String? hint;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: theme.textTheme.headlineSmall),
        if (hint != null) ...[
          const SizedBox(height: 6),
          Text(hint!, style: theme.textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary)),
        ],
        const SizedBox(height: 16),
        ...children,
      ],
    );
  }
}

class _FlagButton extends StatelessWidget {
  const _FlagButton({required this.label, required this.selected, required this.onTap});

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: selected ? AppColors.tealLight : AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: selected ? AppColors.teal : AppColors.border, width: selected ? 2 : 1),
        ),
        child: Row(
          children: [
            Icon(
              selected ? Icons.check_circle_rounded : Icons.circle_outlined,
              size: 20,
              color: selected ? AppColors.teal : AppColors.border,
            ),
            const SizedBox(width: 10),
            Expanded(child: Text(label)),
          ],
        ),
      ),
    );
  }
}
