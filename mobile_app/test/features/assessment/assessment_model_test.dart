import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/src/features/assessment/assessment_model.dart';

AssessmentInput _buildInput({List<String> bodyRegions = const []}) {
  return AssessmentInput(
    formType: AssessmentFormType.initial,
    consultationMode: AssessmentConsultationMode.online,
    completedVia: AssessmentCompletionMethod.onlineForm,
    patientName: 'Test Patient',
    completedBy: 'Test Patient',
    relationshipToPatient: 'self',
    presentingComplaint: 'Lower back pain',
    bodyArea: 'lower-back',
    symptomStartDate: '2026-01-01',
    onsetPattern: OnsetPattern.gradual,
    painScore: 5,
    subjective: const SubjectiveAssessmentProfile(),
    outcomes: const OutcomeMeasureSet(),
    objectiveVideo: const ObjectiveVideoAssessment(),
    goalsPlan: const GoalSetting(),
    symptoms: 'Aching pain',
    aggravatingFactors: 'Sitting',
    easingFactors: 'Walking',
    functionalImpact: 'Difficulty sitting',
    goals: 'Return to running',
    medicalHistory: 'None',
    medications: 'None',
    allergies: 'None',
    previousTreatment: 'None',
    communicationNeeds: 'None',
    emergencyContactName: 'Jane Doe',
    emergencyContactPhone: '07000000000',
    redFlags: const AssessmentRedFlags(),
    onlineReadiness: const OnlineReadiness(),
    consent: const AssessmentConsent(),
    signature: 'Test Patient',
    completedAt: '2026-01-01T00:00:00.000Z',
    submittedByUid: 'u1',
    bodyRegions: bodyRegions,
  );
}

void main() {
  test('toFirestore stamps version 2.0 to match web ASSESSMENT_FORM_VERSION',
      () {
    final input = _buildInput();
    final data = input.toFirestore(bookingId: 'b1');
    expect(data['version'], '2.0');
  });

  test('toFirestore includes bodyRegions', () {
    final input = _buildInput(bodyRegions: ['lower-back', 'left-shoulder']);
    final data = input.toFirestore(bookingId: 'b1');
    expect(data['bodyRegions'], ['lower-back', 'left-shoulder']);
  });

  test('bodyRegions defaults to an empty list', () {
    final input = _buildInput();
    expect(input.bodyRegions, isEmpty);
  });
}
