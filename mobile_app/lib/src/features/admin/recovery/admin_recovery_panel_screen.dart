import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'recovery_service.dart';

class AdminRecoveryPanelScreen extends StatefulWidget {
  const AdminRecoveryPanelScreen({
    super.key,
    required this.patientUid,
    required this.patientName,
    required this.personId,
    required this.personName,
  });

  final String patientUid;
  final String patientName;
  final String personId;
  final String personName;

  @override
  State<AdminRecoveryPanelScreen> createState() =>
      _AdminRecoveryPanelScreenState();
}

class _AdminRecoveryPanelScreenState extends State<AdminRecoveryPanelScreen> {
  final _notesCtrl = TextEditingController();
  int _painScore = 5;
  int _mobilityScore = 5;
  final String _date = DateTime.now().toIso8601String().substring(0, 10);
  bool _saving = false;
  bool _saved = false;

  Future<void> _saveClinical() async {
    setState(() {
      _saving = true;
      _saved = false;
    });
    await RecoveryService.addClinicalAssessment(
      widget.patientUid,
      widget.personId,
      date: _date,
      painScore: _painScore,
      mobilityScore: _mobilityScore,
      physioNotes: _notesCtrl.text.trim(),
    );
    setState(() {
      _saving = false;
      _saved = true;
      _notesCtrl.clear();
    });
  }

  Future<void> _remove(String exerciseId) async {
    await RecoveryService.removeExercise(
        widget.patientUid, widget.personId, exerciseId);
  }

  @override
  void dispose() {
    _notesCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.personName),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(20),
          child: Padding(
            padding: const EdgeInsets.only(left: 16, bottom: 8),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text(
                widget.patientName,
                style:
                    const TextStyle(fontSize: 12, color: Colors.grey),
              ),
            ),
          ),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Pain trend (last 14 days)
          const Text('Pain trend (last 14 days)',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 8),
          StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
            stream: RecoveryService.watchPainLogs(
                widget.patientUid, widget.personId, 14),
            builder: (_, snap) {
              if (!snap.hasData) return const LinearProgressIndicator();
              final docs = snap.data!.docs.reversed.toList();
              if (docs.isEmpty) {
                return const Text('No pain logs yet.',
                    style: TextStyle(color: Colors.grey));
              }
              return Column(
                children: docs.map((d) {
                  final score = d.data()['score'] as int? ?? 0;
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 3),
                    child: Row(children: [
                      SizedBox(
                          width: 80,
                          child: Text(d.id,
                              style: const TextStyle(
                                  fontSize: 12, color: Colors.grey))),
                      Expanded(
                          child: LinearProgressIndicator(
                              value: score / 10,
                              color: const Color(0xFF0891B2),
                              backgroundColor: const Color(0xFFE0F2FE))),
                      const SizedBox(width: 8),
                      Text('$score/10',
                          style: const TextStyle(fontWeight: FontWeight.bold)),
                    ]),
                  );
                }).toList(),
              );
            },
          ),
          const Divider(height: 32),

          // Clinical assessment form
          const Text('Add clinical assessment',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 12),
          if (_saved)
            const Text('Saved!',
                style: TextStyle(color: Color(0xFF16a34a))),
          Text('Pain score: $_painScore/10'),
          Slider(
              value: _painScore.toDouble(),
              min: 0,
              max: 10,
              divisions: 10,
              label: '$_painScore',
              onChanged: (v) => setState(() => _painScore = v.round()),
              activeColor: const Color(0xFF0891B2)),
          Text('Mobility score: $_mobilityScore/10'),
          Slider(
              value: _mobilityScore.toDouble(),
              min: 0,
              max: 10,
              divisions: 10,
              label: '$_mobilityScore',
              onChanged: (v) => setState(() => _mobilityScore = v.round()),
              activeColor: const Color(0xFF0891B2)),
          TextField(
            controller: _notesCtrl,
            maxLines: 3,
            decoration: const InputDecoration(
              hintText: 'Clinical notes…',
              border: OutlineInputBorder(
                  borderRadius: BorderRadius.all(Radius.circular(10))),
            ),
          ),
          const SizedBox(height: 8),
          ElevatedButton(
            onPressed: _saving ? null : () => _saveClinical(),
            style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF0C2A38),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12))),
            child: Text(_saving ? 'Saving…' : 'Save assessment'),
          ),
          const Divider(height: 32),

          // Assigned exercises
          const Text('Assigned exercises',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
            stream: RecoveryService.watchAssignedExercises(
                widget.patientUid, widget.personId),
            builder: (_, snap) {
              if (!snap.hasData) return const LinearProgressIndicator();
              final assigned = snap.data!.docs;
              if (assigned.isEmpty) {
                return const Padding(
                    padding: EdgeInsets.symmetric(vertical: 8),
                    child: Text('None assigned.',
                        style: TextStyle(color: Colors.grey)));
              }
              return Column(
                children: assigned
                    .map((d) => ListTile(
                          contentPadding: EdgeInsets.zero,
                          title: Text(d.id),
                          trailing: TextButton(
                            onPressed: () => _remove(d.id),
                            child: const Text('Remove',
                                style: TextStyle(color: Colors.red)),
                          ),
                        ))
                    .toList(),
              );
            },
          ),
        ],
      ),
    );
  }
}
