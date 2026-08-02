import 'package:cloud_firestore/cloud_firestore.dart';

/// Mirrors `AssessmentFormType` in lib/assessment-forms.ts.
class AssessmentFormType {
  static const initial = 'initial';
  static const checkup = 'checkup';
}

/// Mirrors `ConsultationMode` in lib/assessment-forms.ts.
class AssessmentConsultationMode {
  static const online = 'online';
  static const inPerson = 'in_person';
}

/// Mirrors `AssessmentCompletionMethod` in lib/assessment-forms.ts.
class AssessmentCompletionMethod {
  static const onlineForm = 'online_form';
  static const offlineDraft = 'offline_draft';
  static const offlinePaper = 'offline_paper';
}

/// Mirrors `OnsetPattern` in lib/assessment-forms.ts.
class OnsetPattern {
  static const sudden = 'sudden';
  static const gradual = 'gradual';
  static const recurring = 'recurring';
  static const postSurgery = 'post_surgery';
  static const notSure = 'not_sure';
}

/// Mirrors `ClinicalArea` in lib/assessment-forms.ts.
class ClinicalArea {
  static const spine = 'spine';
  static const upperLimb = 'upper_limb';
  static const lowerLimb = 'lower_limb';
  static const balanceWalking = 'balance_walking';
  static const neuro = 'neuro';
  static const postOp = 'post_op';
  static const pelvicHealth = 'pelvic_health';
  static const paediatric = 'paediatric';
  static const general = 'general';
}

/// Mirrors `SubjectiveAssessmentProfile`.
class SubjectiveAssessmentProfile {
  final String clinicalArea;
  final String symptomBehaviour;
  final num irritability;
  final num severity;
  final String yellowFlags;

  const SubjectiveAssessmentProfile({
    this.clinicalArea = ClinicalArea.general,
    this.symptomBehaviour = '',
    this.irritability = 5,
    this.severity = 5,
    this.yellowFlags = '',
  });

  Map<String, dynamic> toMap() => {
        'clinicalArea': clinicalArea,
        'symptomBehaviour': symptomBehaviour,
        'irritability': irritability,
        'severity': severity,
        'yellowFlags': yellowFlags,
      };
}

/// Mirrors `OutcomeMeasureSet`.
class OutcomeMeasureSet {
  final String psfsActivity1;
  final num psfsScore1;
  final String psfsActivity2;
  final num psfsScore2;
  final String psfsActivity3;
  final num psfsScore3;
  final num painBest;
  final num painWorst;
  final num confidenceScore;
  final String conditionMeasureName;
  final num conditionMeasureScore;
  final num conditionMeasureMax;

  const OutcomeMeasureSet({
    this.psfsActivity1 = '',
    this.psfsScore1 = 5,
    this.psfsActivity2 = '',
    this.psfsScore2 = 5,
    this.psfsActivity3 = '',
    this.psfsScore3 = 5,
    this.painBest = 0,
    this.painWorst = 8,
    this.confidenceScore = 5,
    this.conditionMeasureName = '',
    this.conditionMeasureScore = 0,
    this.conditionMeasureMax = 100,
  });

  Map<String, dynamic> toMap() => {
        'psfsActivity1': psfsActivity1,
        'psfsScore1': psfsScore1,
        'psfsActivity2': psfsActivity2,
        'psfsScore2': psfsScore2,
        'psfsActivity3': psfsActivity3,
        'psfsScore3': psfsScore3,
        'painBest': painBest,
        'painWorst': painWorst,
        'confidenceScore': confidenceScore,
        'conditionMeasureName': conditionMeasureName,
        'conditionMeasureScore': conditionMeasureScore,
        'conditionMeasureMax': conditionMeasureMax,
      };
}

/// Mirrors `ObjectiveVideoAssessment`.
class ObjectiveVideoAssessment {
  final bool consent;
  final String taskId;
  final String taskLabel;
  final String metricName;
  final num metricValue;
  final String metricUnit;
  final num reps;
  final num durationSeconds;
  final String qualityNotes;
  final String videoUrl;
  final String storagePath;
  final String recordedAt;

  const ObjectiveVideoAssessment({
    this.consent = false,
    this.taskId = '',
    this.taskLabel = '',
    this.metricName = '',
    this.metricValue = 0,
    this.metricUnit = '',
    this.reps = 0,
    this.durationSeconds = 0,
    this.qualityNotes = '',
    this.videoUrl = '',
    this.storagePath = '',
    this.recordedAt = '',
  });

  Map<String, dynamic> toMap() => {
        'consent': consent,
        'taskId': taskId,
        'taskLabel': taskLabel,
        'metricName': metricName,
        'metricValue': metricValue,
        'metricUnit': metricUnit,
        'reps': reps,
        'durationSeconds': durationSeconds,
        'qualityNotes': qualityNotes,
        'videoUrl': videoUrl,
        'storagePath': storagePath,
        'recordedAt': recordedAt,
      };
}

/// Mirrors `GoalSetting`.
class GoalSetting {
  final String meaningfulGoal;
  final String baseline;
  final String target;
  final num timeframeWeeks;
  final num confidenceScore;
  final String barriers;
  final String supportPlan;
  final String reviewDate;

  const GoalSetting({
    this.meaningfulGoal = '',
    this.baseline = '',
    this.target = '',
    this.timeframeWeeks = 6,
    this.confidenceScore = 5,
    this.barriers = '',
    this.supportPlan = '',
    this.reviewDate = '',
  });

  Map<String, dynamic> toMap() => {
        'meaningfulGoal': meaningfulGoal,
        'baseline': baseline,
        'target': target,
        'timeframeWeeks': timeframeWeeks,
        'confidenceScore': confidenceScore,
        'barriers': barriers,
        'supportPlan': supportPlan,
        'reviewDate': reviewDate,
      };
}

/// Mirrors `AssessmentRedFlags`.
class AssessmentRedFlags {
  final bool majorTrauma;
  final bool chestPainBreathlessness;
  final bool bladderBowelSaddle;
  final bool progressiveWeakness;
  final bool unexplainedFeverWeightLoss;
  final bool nightPain;
  final bool none;

  const AssessmentRedFlags({
    this.majorTrauma = false,
    this.chestPainBreathlessness = false,
    this.bladderBowelSaddle = false,
    this.progressiveWeakness = false,
    this.unexplainedFeverWeightLoss = false,
    this.nightPain = false,
    this.none = false,
  });

  Map<String, dynamic> toMap() => {
        'majorTrauma': majorTrauma,
        'chestPainBreathlessness': chestPainBreathlessness,
        'bladderBowelSaddle': bladderBowelSaddle,
        'progressiveWeakness': progressiveWeakness,
        'unexplainedFeverWeightLoss': unexplainedFeverWeightLoss,
        'nightPain': nightPain,
        'none': none,
      };
}

/// Mirrors `OnlineReadiness`.
class OnlineReadiness {
  final bool privateSpace;
  final bool safeSpace;
  final bool cameraAvailable;
  final bool emergencyContactAvailable;

  const OnlineReadiness({
    this.privateSpace = false,
    this.safeSpace = false,
    this.cameraAvailable = false,
    this.emergencyContactAvailable = false,
  });

  Map<String, dynamic> toMap() => {
        'privateSpace': privateSpace,
        'safeSpace': safeSpace,
        'cameraAvailable': cameraAvailable,
        'emergencyContactAvailable': emergencyContactAvailable,
      };
}

/// Mirrors `AssessmentConsent`.
class AssessmentConsent {
  final bool careConsent;
  final bool dataConsent;
  final bool privacyConsent;
  final bool safetySharing;
  final bool videoConsent;

  const AssessmentConsent({
    this.careConsent = false,
    this.dataConsent = false,
    this.privacyConsent = false,
    this.safetySharing = false,
    this.videoConsent = false,
  });

  Map<String, dynamic> toMap() => {
        'careConsent': careConsent,
        'dataConsent': dataConsent,
        'privacyConsent': privacyConsent,
        'safetySharing': safetySharing,
        'videoConsent': videoConsent,
      };
}

/// Mirrors `PatientAssessmentFormInput` in lib/assessment-forms.ts. All field
/// names below MUST match the web type exactly so the admin review UI reads
/// the mobile-submitted document unchanged.
///
/// Note: `version`, `reviewedBy`, `reviewedAt`, `clinicianNotes`, `riskPlan`,
/// and `nextCheckupDate` are intentionally omitted from this input model —
/// on web they are stamped by `submitPatientAssessmentForm` itself (version)
/// or belong to the clinician review flow (`AssessmentReviewInput`), not the
/// patient-submitted input. `toFirestore()` below stamps `version` the same
/// way the web submit function does.
class AssessmentInput {
  final String formType;
  final String consultationMode;
  final String completedVia;
  final String patientName;
  final String completedBy;
  final String relationshipToPatient;
  final String presentingComplaint;
  final String bodyArea;
  final String symptomStartDate;
  final String onsetPattern;
  final num painScore;
  final SubjectiveAssessmentProfile subjective;
  final OutcomeMeasureSet outcomes;
  final ObjectiveVideoAssessment objectiveVideo;
  final GoalSetting goalsPlan;
  final String symptoms;
  final String aggravatingFactors;
  final String easingFactors;
  final String functionalImpact;
  final String goals;
  final String medicalHistory;
  final String medications;
  final String allergies;
  final String previousTreatment;
  final String communicationNeeds;
  final String emergencyContactName;
  final String emergencyContactPhone;
  final AssessmentRedFlags redFlags;
  final OnlineReadiness onlineReadiness;
  final AssessmentConsent consent;
  final String signature;
  final String completedAt;
  final String submittedByUid;
  final String? bookingId;

  const AssessmentInput({
    required this.formType,
    required this.consultationMode,
    required this.completedVia,
    required this.patientName,
    required this.completedBy,
    required this.relationshipToPatient,
    required this.presentingComplaint,
    required this.bodyArea,
    required this.symptomStartDate,
    required this.onsetPattern,
    required this.painScore,
    required this.subjective,
    required this.outcomes,
    required this.objectiveVideo,
    required this.goalsPlan,
    required this.symptoms,
    required this.aggravatingFactors,
    required this.easingFactors,
    required this.functionalImpact,
    required this.goals,
    required this.medicalHistory,
    required this.medications,
    required this.allergies,
    required this.previousTreatment,
    required this.communicationNeeds,
    required this.emergencyContactName,
    required this.emergencyContactPhone,
    required this.redFlags,
    required this.onlineReadiness,
    required this.consent,
    required this.signature,
    required this.completedAt,
    required this.submittedByUid,
    this.bookingId,
  });

  /// Firestore write payload for `submitPatientAssessmentForm` in
  /// lib/assessment-forms.ts — identical field names/shape, plus the
  /// review-workflow defaults and server timestamps the web function stamps
  /// on create.
  Map<String, dynamic> toFirestore({required String bookingId}) => {
        'formType': formType,
        'consultationMode': consultationMode,
        'completedVia': completedVia,
        'patientName': patientName,
        'completedBy': completedBy,
        'relationshipToPatient': relationshipToPatient,
        'presentingComplaint': presentingComplaint,
        'bodyArea': bodyArea,
        'symptomStartDate': symptomStartDate,
        'onsetPattern': onsetPattern,
        'painScore': painScore,
        'subjective': subjective.toMap(),
        'outcomes': outcomes.toMap(),
        'objectiveVideo': objectiveVideo.toMap(),
        'goalsPlan': goalsPlan.toMap(),
        'symptoms': symptoms,
        'aggravatingFactors': aggravatingFactors,
        'easingFactors': easingFactors,
        'functionalImpact': functionalImpact,
        'goals': goals,
        'medicalHistory': medicalHistory,
        'medications': medications,
        'allergies': allergies,
        'previousTreatment': previousTreatment,
        'communicationNeeds': communicationNeeds,
        'emergencyContactName': emergencyContactName,
        'emergencyContactPhone': emergencyContactPhone,
        'redFlags': redFlags.toMap(),
        'onlineReadiness': onlineReadiness.toMap(),
        'consent': consent.toMap(),
        'signature': signature,
        'completedAt': completedAt,
        'submittedByUid': submittedByUid,
        'bookingId': bookingId,
        // Matches ASSESSMENT_FORM_VERSION in lib/assessment-forms.ts.
        'version': '2026-07-csp-hcpc-v2',
        'reviewStatus': 'awaiting_review',
        'reviewedBy': '',
        'reviewedAt': '',
        'clinicianNotes': '',
        'riskPlan': '',
        'nextCheckupDate': '',
        'createdAt': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
      };
}
