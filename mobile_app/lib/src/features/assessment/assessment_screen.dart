import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '../../core/app_colors.dart';
import 'assessment_model.dart';
import 'assessment_repository.dart';

/// Native patient assessment form. Mirrors the web assessment form's
/// sections (red flags, consultation mode, key subjective history, goals,
/// consent) without every micro-field — see field-by-field notes in
/// `.git/sdd/task-15-report.md`.
class AssessmentScreen extends StatefulWidget {
  const AssessmentScreen({
    required this.bookingId,
    required this.personId,
    required this.personName,
    super.key,
  });

  final String bookingId;
  final String personId;
  final String personName;

  @override
  State<AssessmentScreen> createState() => _AssessmentScreenState();
}

class _AssessmentScreenState extends State<AssessmentScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _submitting = false;

  // Red flags.
  bool _majorTrauma = false;
  bool _chestPainBreathlessness = false;
  bool _bladderBowelSaddle = false;
  bool _progressiveWeakness = false;
  bool _unexplainedFeverWeightLoss = false;
  bool _nightPain = false;
  bool _noRedFlags = false;

  // Consultation mode.
  String _consultationMode = AssessmentConsultationMode.inPerson;

  // Subjective history.
  String _clinicalArea = ClinicalArea.general;
  final _presentingComplaintController = TextEditingController();
  double _painScore = 3;
  final _symptomBehaviourController = TextEditingController();
  double _irritability = 5;
  double _severity = 5;

  // Goals.
  final _goalController = TextEditingController();
  final _baselineController = TextEditingController();
  final _targetController = TextEditingController();

  // Consent.
  bool _careConsent = false;
  bool _dataConsent = false;
  bool _privacyConsent = false;

  @override
  void dispose() {
    _presentingComplaintController.dispose();
    _symptomBehaviourController.dispose();
    _goalController.dispose();
    _baselineController.dispose();
    _targetController.dispose();
    super.dispose();
  }

  bool get _hasAnyRedFlag =>
      _majorTrauma ||
      _chestPainBreathlessness ||
      _bladderBowelSaddle ||
      _progressiveWeakness ||
      _unexplainedFeverWeightLoss ||
      _nightPain;

  bool get _consentGiven => _careConsent && _dataConsent && _privacyConsent;

  Future<void> _submit() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;

    if (!(_formKey.currentState?.validate() ?? false)) return;

    if (!_noRedFlags && !_hasAnyRedFlag) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please answer the safety questions, or confirm none apply.'),
        ),
      );
      return;
    }

    if (!_consentGiven) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please agree to all consent statements to continue.')),
      );
      return;
    }

    setState(() => _submitting = true);

    final now = DateTime.now().toUtc().toIso8601String();
    final input = AssessmentInput(
      formType: AssessmentFormType.initial,
      consultationMode: _consultationMode,
      completedVia: AssessmentCompletionMethod.onlineForm,
      patientName: widget.personName,
      completedBy: widget.personName,
      relationshipToPatient: 'self',
      presentingComplaint: _presentingComplaintController.text.trim(),
      bodyArea: '',
      symptomStartDate: '',
      onsetPattern: OnsetPattern.notSure,
      painScore: _painScore.round(),
      subjective: SubjectiveAssessmentProfile(
        clinicalArea: _clinicalArea,
        symptomBehaviour: _symptomBehaviourController.text.trim(),
        irritability: _irritability.round(),
        severity: _severity.round(),
      ),
      outcomes: const OutcomeMeasureSet(),
      objectiveVideo: const ObjectiveVideoAssessment(),
      goalsPlan: GoalSetting(
        meaningfulGoal: _goalController.text.trim(),
        baseline: _baselineController.text.trim(),
        target: _targetController.text.trim(),
      ),
      symptoms: '',
      aggravatingFactors: '',
      easingFactors: '',
      functionalImpact: '',
      goals: _goalController.text.trim(),
      medicalHistory: '',
      medications: '',
      allergies: '',
      previousTreatment: '',
      communicationNeeds: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      redFlags: AssessmentRedFlags(
        majorTrauma: _majorTrauma,
        chestPainBreathlessness: _chestPainBreathlessness,
        bladderBowelSaddle: _bladderBowelSaddle,
        progressiveWeakness: _progressiveWeakness,
        unexplainedFeverWeightLoss: _unexplainedFeverWeightLoss,
        nightPain: _nightPain,
        none: _noRedFlags,
      ),
      onlineReadiness: OnlineReadiness(
        privateSpace: _consultationMode == AssessmentConsultationMode.online,
        safeSpace: _consultationMode == AssessmentConsultationMode.online,
        cameraAvailable: _consultationMode == AssessmentConsultationMode.online,
        emergencyContactAvailable: false,
      ),
      consent: AssessmentConsent(
        careConsent: _careConsent,
        dataConsent: _dataConsent,
        privacyConsent: _privacyConsent,
        safetySharing: true,
        videoConsent: false,
      ),
      signature: widget.personName,
      completedAt: now,
      submittedByUid: user.uid,
      bookingId: widget.bookingId,
    );

    try {
      await AssessmentRepository().submit(
        uid: user.uid,
        personId: widget.personId,
        bookingId: widget.bookingId,
        input: input,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Assessment submitted. Thank you.')),
      );
      Navigator.pop(context, true);
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not submit your assessment. Please try again.')),
      );
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      return const Scaffold(body: Center(child: Text('Sign in to complete your assessment')));
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Pre-Session Assessment'),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF0C2A38),
        elevation: 0,
      ),
      backgroundColor: const Color(0xFFF0FDFA),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
          children: [
            _SectionCard(
              title: 'Safety check',
              subtitle: 'Please tell us if any of these apply to you right now.',
              child: Column(
                children: [
                  _RedFlagCheckbox(
                    label: 'Recent major trauma or injury',
                    value: _majorTrauma,
                    onChanged: (v) => setState(() {
                      _majorTrauma = v;
                      if (v) _noRedFlags = false;
                    }),
                  ),
                  _RedFlagCheckbox(
                    label: 'Chest pain or breathlessness',
                    value: _chestPainBreathlessness,
                    onChanged: (v) => setState(() {
                      _chestPainBreathlessness = v;
                      if (v) _noRedFlags = false;
                    }),
                  ),
                  _RedFlagCheckbox(
                    label: 'Loss of bladder/bowel control or saddle numbness',
                    value: _bladderBowelSaddle,
                    onChanged: (v) => setState(() {
                      _bladderBowelSaddle = v;
                      if (v) _noRedFlags = false;
                    }),
                  ),
                  _RedFlagCheckbox(
                    label: 'Progressive weakness or numbness',
                    value: _progressiveWeakness,
                    onChanged: (v) => setState(() {
                      _progressiveWeakness = v;
                      if (v) _noRedFlags = false;
                    }),
                  ),
                  _RedFlagCheckbox(
                    label: 'Unexplained fever or weight loss',
                    value: _unexplainedFeverWeightLoss,
                    onChanged: (v) => setState(() {
                      _unexplainedFeverWeightLoss = v;
                      if (v) _noRedFlags = false;
                    }),
                  ),
                  _RedFlagCheckbox(
                    label: 'Pain that wakes you at night',
                    value: _nightPain,
                    onChanged: (v) => setState(() {
                      _nightPain = v;
                      if (v) _noRedFlags = false;
                    }),
                  ),
                  const Divider(height: 24),
                  _RedFlagCheckbox(
                    label: 'None of the above apply to me',
                    value: _noRedFlags,
                    onChanged: (v) => setState(() {
                      _noRedFlags = v;
                      if (v) {
                        _majorTrauma = false;
                        _chestPainBreathlessness = false;
                        _bladderBowelSaddle = false;
                        _progressiveWeakness = false;
                        _unexplainedFeverWeightLoss = false;
                        _nightPain = false;
                      }
                    }),
                  ),
                ],
              ),
            ),
            _SectionCard(
              title: 'Consultation mode',
              child: SegmentedButton<String>(
                segments: const [
                  ButtonSegment(
                    value: AssessmentConsultationMode.inPerson,
                    label: Text('In person'),
                  ),
                  ButtonSegment(
                    value: AssessmentConsultationMode.online,
                    label: Text('Online'),
                  ),
                ],
                selected: {_consultationMode},
                onSelectionChanged: (s) => setState(() => _consultationMode = s.first),
              ),
            ),
            _SectionCard(
              title: 'Your symptoms',
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  DropdownButtonFormField<String>(
                    initialValue: _clinicalArea,
                    decoration: const InputDecoration(labelText: 'Clinical area'),
                    items: const [
                      DropdownMenuItem(value: ClinicalArea.spine, child: Text('Spine')),
                      DropdownMenuItem(value: ClinicalArea.upperLimb, child: Text('Upper limb')),
                      DropdownMenuItem(value: ClinicalArea.lowerLimb, child: Text('Lower limb')),
                      DropdownMenuItem(
                        value: ClinicalArea.balanceWalking,
                        child: Text('Balance / walking'),
                      ),
                      DropdownMenuItem(value: ClinicalArea.neuro, child: Text('Neuro')),
                      DropdownMenuItem(value: ClinicalArea.postOp, child: Text('Post-op')),
                      DropdownMenuItem(
                        value: ClinicalArea.pelvicHealth,
                        child: Text('Pelvic health'),
                      ),
                      DropdownMenuItem(
                        value: ClinicalArea.paediatric,
                        child: Text('Paediatric'),
                      ),
                      DropdownMenuItem(value: ClinicalArea.general, child: Text('General')),
                    ],
                    onChanged: (v) => setState(() => _clinicalArea = v ?? ClinicalArea.general),
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _presentingComplaintController,
                    maxLines: 3,
                    decoration: const InputDecoration(
                      labelText: 'What brings you in today?',
                    ),
                    validator: (v) =>
                        (v == null || v.trim().isEmpty) ? 'Please describe your symptoms' : null,
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _symptomBehaviourController,
                    maxLines: 2,
                    decoration: const InputDecoration(
                      labelText: 'What makes it better or worse?',
                    ),
                  ),
                  const SizedBox(height: 8),
                  _LabeledSlider(
                    label: 'Current pain (0 = none, 10 = worst)',
                    value: _painScore,
                    onChanged: (v) => setState(() => _painScore = v),
                  ),
                  _LabeledSlider(
                    label: 'Irritability (how easily symptoms are triggered)',
                    value: _irritability,
                    onChanged: (v) => setState(() => _irritability = v),
                  ),
                  _LabeledSlider(
                    label: 'Severity',
                    value: _severity,
                    onChanged: (v) => setState(() => _severity = v),
                  ),
                ],
              ),
            ),
            _SectionCard(
              title: 'Your goal',
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  TextFormField(
                    controller: _goalController,
                    decoration: const InputDecoration(
                      labelText: 'What would you like to achieve?',
                    ),
                    validator: (v) =>
                        (v == null || v.trim().isEmpty) ? 'Please tell us your goal' : null,
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _baselineController,
                    decoration: const InputDecoration(labelText: 'What can you do now?'),
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _targetController,
                    decoration: const InputDecoration(labelText: 'What is your target?'),
                  ),
                ],
              ),
            ),
            _SectionCard(
              title: 'Consent',
              child: Column(
                children: [
                  _RedFlagCheckbox(
                    label: 'I consent to receiving physiotherapy care',
                    value: _careConsent,
                    onChanged: (v) => setState(() => _careConsent = v),
                  ),
                  _RedFlagCheckbox(
                    label: 'I consent to my data being stored and used for my care',
                    value: _dataConsent,
                    onChanged: (v) => setState(() => _dataConsent = v),
                  ),
                  _RedFlagCheckbox(
                    label: 'I have read and accept the privacy policy',
                    value: _privacyConsent,
                    onChanged: (v) => setState(() => _privacyConsent = v),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            FilledButton(
              onPressed: _submitting ? null : _submit,
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.gold,
                foregroundColor: Colors.white,
                minimumSize: const Size.fromHeight(50),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: _submitting
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Text('Submit assessment'),
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.title, required this.child, this.subtitle});

  final String title;
  final String? subtitle;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontWeight: FontWeight.w800,
              fontSize: 16,
              color: Color(0xFF0C2A38),
            ),
          ),
          if (subtitle != null) ...[
            const SizedBox(height: 4),
            Text(
              subtitle!,
              style: const TextStyle(color: Color(0xFF5E7A84), fontSize: 13),
            ),
          ],
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}

class _RedFlagCheckbox extends StatelessWidget {
  const _RedFlagCheckbox({
    required this.label,
    required this.value,
    required this.onChanged,
  });

  final String label;
  final bool value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return CheckboxListTile(
      value: value,
      onChanged: (v) => onChanged(v ?? false),
      title: Text(label, style: const TextStyle(fontSize: 14)),
      controlAffinity: ListTileControlAffinity.leading,
      contentPadding: EdgeInsets.zero,
      dense: true,
    );
  }
}

class _LabeledSlider extends StatelessWidget {
  const _LabeledSlider({required this.label, required this.value, required this.onChanged});

  final String label;
  final double value;
  final ValueChanged<double> onChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('$label: ${value.round()}/10', style: const TextStyle(fontSize: 13)),
        Slider(
          value: value,
          min: 0,
          max: 10,
          divisions: 10,
          activeColor: AppColors.teal,
          onChanged: onChanged,
        ),
      ],
    );
  }
}
