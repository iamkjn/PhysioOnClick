import 'dart:convert';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

import '../../../core/api_client.dart';
import '../../../core/app_colors.dart';

class AdminAssistantScreen extends StatefulWidget {
  const AdminAssistantScreen({super.key});

  @override
  State<AdminAssistantScreen> createState() => _AdminAssistantScreenState();
}

class _AdminAssistantScreenState extends State<AdminAssistantScreen> {
  final _requestController = TextEditingController();
  final _patientController = TextEditingController();
  bool _loading = false;
  String? _error;
  Map<String, dynamic>? _plan;

  @override
  void dispose() {
    _requestController.dispose();
    _patientController.dispose();
    super.dispose();
  }

  Future<void> _draftPlan() async {
    final request = _requestController.text.trim();
    if (request.isEmpty || _loading) return;
    final token = await FirebaseAuth.instance.currentUser?.getIdToken();
    if (token == null) return;
    setState(() {
      _loading = true;
      _error = null;
      _plan = null;
    });
    try {
      final res = await http
          .post(
            Uri.parse('$kApiBase/api/admin/assistant/plan'),
            headers: {
              'Authorization': 'Bearer $token',
              'Content-Type': 'application/json',
            },
            body: jsonEncode({
              'request': request,
              'patientName': _patientController.text.trim(),
              'selectedExerciseIds': const <String>[],
            }),
          )
          .timeout(const Duration(seconds: 25));
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      if (res.statusCode != 200) {
        throw Exception(body['error'] ?? 'Could not draft a plan.');
      }
      if (mounted) setState(() => _plan = body);
    } catch (error) {
      if (mounted) {
        setState(
          () => _error = error.toString().replaceFirst('Exception: ', ''),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final exercises = (_plan?['exercises'] as List<dynamic>? ?? const [])
        .whereType<Map<String, dynamic>>()
        .toList();
    final safety = (_plan?['safetyNotes'] as List<dynamic>? ?? const [])
        .map((item) => '$item')
        .toList();

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(title: const Text('AI assistant')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'Draft exercise ideas from the PhysioOnClick library. Review before assigning or emailing.',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _patientController,
            decoration: const InputDecoration(
              labelText: 'Patient name (optional)',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _requestController,
            maxLines: 5,
            decoration: const InputDecoration(
              labelText: 'What does the patient need?',
              hintText:
                  'Example: early low back pain, pain 5/10, needs gentle mobility and confidence',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 12),
          FilledButton.icon(
            onPressed: _loading ? null : _draftPlan,
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.teal,
              minimumSize: const Size.fromHeight(50),
            ),
            icon: const Icon(Icons.auto_awesome_rounded),
            label: Text(_loading ? 'Drafting...' : 'Draft exercise plan'),
          ),
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(_error!, style: const TextStyle(color: AppColors.error)),
          ],
          if (_plan != null) ...[
            const SizedBox(height: 20),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Summary',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text('${_plan!['summary'] ?? ''}'),
                  ],
                ),
              ),
            ),
            if (safety.isNotEmpty)
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Safety notes',
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(height: 8),
                      ...safety.map((note) => Text('• $note')),
                    ],
                  ),
                ),
              ),
            Text(
              'Suggested exercises',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 10),
            ...exercises.map(
              (exercise) => Card(
                child: ListTile(
                  title: Text(
                    '${exercise['title'] ?? exercise['id'] ?? 'Exercise'}',
                    style: const TextStyle(fontWeight: FontWeight.w800),
                  ),
                  subtitle: Text(
                    [
                      exercise['bodyPart'],
                      exercise['condition'],
                      exercise['dosageLabel'],
                      exercise['reason'],
                    ].where((value) => '${value ?? ''}'.isNotEmpty).join('\n'),
                  ),
                  isThreeLine: true,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
