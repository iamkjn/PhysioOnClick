import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '../../core/firebase/patient_account_service.dart';

const _areas = [
  'Neck',
  'Shoulder',
  'Upper Back',
  'Lower Back',
  'Hip',
  'Knee',
  'Ankle/Foot',
  'Wrist/Hand',
];

const _durations = [
  'Less than 1 week',
  '1-4 weeks',
  '1-3 months',
  '3-6 months',
  'More than 6 months',
];

const _severities = [
  'Mild - slight discomfort',
  'Moderate - affects daily activities',
  'Severe - significantly limits movement',
  'Very severe - constant, debilitating pain',
];

const _symptoms = [
  'Pain during movement',
  'Pain at rest',
  'Stiffness',
  'Swelling',
  'Weakness',
  'Numbness/tingling',
  'Difficulty sleeping',
  'Instability',
];

class SymptomCheckerScreen extends StatefulWidget {
  const SymptomCheckerScreen({super.key});

  @override
  State<SymptomCheckerScreen> createState() => _SymptomCheckerScreenState();
}

class _SymptomCheckerScreenState extends State<SymptomCheckerScreen> {
  String? selectedArea;
  String? selectedDuration;
  String? selectedSeverity;
  final Set<String> selectedSymptoms = <String>{};
  String? result;
  String? recommendation;
  bool isSaving = false;

  String _recommendCondition() {
    if (selectedArea == 'Shoulder') {
      return 'Possible rotator cuff or shoulder overload issue';
    }
    if (selectedArea == 'Knee') {
      return 'Possible knee joint or soft tissue irritation';
    }
    if (selectedArea == 'Lower Back') {
      return 'Possible mechanical back pain presentation';
    }
    return 'Possible musculoskeletal presentation requiring assessment';
  }

  String _recommendService() {
    if ((selectedSeverity ?? '').contains('Severe') || selectedSymptoms.contains('Instability')) {
      return 'Initial Assessment recommended';
    }
    if (selectedArea == 'Shoulder' || selectedArea == 'Knee') {
      return 'Follow-Up or Initial Assessment recommended';
    }
    return 'Online consultation or Initial Assessment recommended';
  }

  Future<void> _submit() async {
    if (selectedArea == null || selectedDuration == null || selectedSeverity == null || selectedSymptoms.isEmpty) {
      setState(() {
        result = null;
        recommendation = 'Please complete all symptom steps first.';
      });
      return;
    }

    final condition = _recommendCondition();
    final serviceRecommendation = _recommendService();

    setState(() {
      isSaving = true;
      result = condition;
      recommendation = serviceRecommendation;
    });

    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user != null) {
        await PatientAccountService.ensurePatientRecord(user);
      }

      await FirebaseFirestore.instance.collection('symptomChecks').add({
        'area': selectedArea,
        'duration': selectedDuration,
        'severity': selectedSeverity,
        'symptoms': selectedSymptoms.toList(),
        'potentialCondition': condition,
        'recommendation': serviceRecommendation,
        'userId': user?.uid ?? '',
        'email': user?.email ?? '',
        'patientRef': user != null ? 'patients/${user.uid}' : '',
        'createdAt': FieldValue.serverTimestamp(),
      });
    } catch (_) {
      // Keep the result visible even if persistence fails.
    } finally {
      if (mounted) {
        setState(() => isSaving = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Symptom checker')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
        children: [
          Text(
            'Use this for guidance only. It does not replace professional medical assessment.',
            style: theme.textTheme.bodyMedium?.copyWith(color: const Color(0xFF9C3F27)),
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<String>(
            value: selectedArea,
            decoration: const InputDecoration(labelText: 'Area of discomfort'),
            items: _areas.map((item) => DropdownMenuItem(value: item, child: Text(item))).toList(),
            onChanged: (value) => setState(() => selectedArea = value),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            value: selectedDuration,
            decoration: const InputDecoration(labelText: 'Duration'),
            items: _durations.map((item) => DropdownMenuItem(value: item, child: Text(item))).toList(),
            onChanged: (value) => setState(() => selectedDuration = value),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            value: selectedSeverity,
            decoration: const InputDecoration(labelText: 'Severity'),
            items: _severities.map((item) => DropdownMenuItem(value: item, child: Text(item))).toList(),
            onChanged: (value) => setState(() => selectedSeverity = value),
          ),
          const SizedBox(height: 16),
          Text('Symptoms', style: theme.textTheme.titleMedium),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _symptoms.map((item) {
              final selected = selectedSymptoms.contains(item);
              return FilterChip(
                label: Text(item),
                selected: selected,
                onSelected: (value) {
                  setState(() {
                    if (value) {
                      selectedSymptoms.add(item);
                    } else {
                      selectedSymptoms.remove(item);
                    }
                  });
                },
              );
            }).toList(),
          ),
          const SizedBox(height: 18),
          ElevatedButton(
            onPressed: isSaving ? null : _submit,
            child: Text(isSaving ? 'Checking...' : 'Get symptom guidance'),
          ),
          if (result != null || recommendation != null) ...[
            const SizedBox(height: 18),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Possible consideration', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
                    const SizedBox(height: 8),
                    Text(result ?? 'Complete the questions first.', style: theme.textTheme.bodyLarge),
                    const SizedBox(height: 14),
                    Text('Recommended next step', style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700)),
                    const SizedBox(height: 8),
                    Text(recommendation ?? '', style: theme.textTheme.bodyLarge),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
