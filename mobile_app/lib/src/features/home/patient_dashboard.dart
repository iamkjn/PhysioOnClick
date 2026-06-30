import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '../admin/recovery/recovery_service.dart';
import '../appointments/appointments_screen.dart';
import '../booking/who_is_this_for_screen.dart';
import '../people/add_person_sheet.dart';
import '../people/dependent_model.dart';
import '../people/people_repository.dart';
import '../people/people_screen.dart';

class PatientDashboard extends StatefulWidget {
  const PatientDashboard({super.key, required this.user});

  final User user;

  @override
  State<PatientDashboard> createState() => _PatientDashboardState();
}

class _PatientDashboardState extends State<PatientDashboard> {
  final _peopleRepo = PeopleRepository();
  String _personId = '';
  String _personName = '';

  String get _meName =>
      widget.user.displayName?.isNotEmpty == true ? widget.user.displayName! : 'Me';

  @override
  void initState() {
    super.initState();
    // widget.user is not available during field initialization, only from
    // initState() onward — see State lifecycle.
    _personId = widget.user.uid;
    _personName = _meName;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFC8E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Your recovery', style: theme.textTheme.titleLarge),
          const SizedBox(height: 4),
          Text(
            'Viewing recovery for $_personName',
            style: theme.textTheme.bodySmall?.copyWith(color: const Color(0xFF5E7A84)),
          ),
          const SizedBox(height: 12),
          StreamBuilder<List<Dependent>>(
            stream: _peopleRepo.watchDependents(widget.user.uid),
            builder: (context, snapshot) {
              final dependents = snapshot.data ?? const <Dependent>[];
              return _PersonDropdown(
                meName: _meName,
                meId: widget.user.uid,
                dependents: dependents,
                selectedId: _personId,
                onSelect: (id, name) => setState(() {
                  _personId = id;
                  _personName = name;
                }),
                onAddPerson: () => AddPersonSheet.show(context),
              );
            },
          ),
          const SizedBox(height: 16),
          _RecoveryPercentTile(uid: widget.user.uid, personId: _personId),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: ElevatedButton(
                  onPressed: () => WhoIsThisForScreen.go(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0891B2),
                    foregroundColor: Colors.white,
                    minimumSize: const Size.fromHeight(44),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: const Text('Book session'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: OutlinedButton(
                  onPressed: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const PeopleScreen()),
                  ),
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size.fromHeight(44),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: const Text('My People'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const AppointmentsScreen()),
              ),
              style: OutlinedButton.styleFrom(
                minimumSize: const Size.fromHeight(44),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: const Text('My Appointments'),
            ),
          ),
        ],
      ),
    );
  }
}

class _PersonDropdown extends StatelessWidget {
  const _PersonDropdown({
    required this.meName,
    required this.meId,
    required this.dependents,
    required this.selectedId,
    required this.onSelect,
    required this.onAddPerson,
  });

  final String meName;
  final String meId;
  final List<Dependent> dependents;
  final String selectedId;
  final void Function(String id, String name) onSelect;
  final VoidCallback onAddPerson;

  static const _addPersonValue = '__add_person__';

  @override
  Widget build(BuildContext context) {
    return DropdownButtonFormField<String>(
      initialValue: selectedId,
      decoration: const InputDecoration(
        labelText: 'Viewing recovery for',
        border: OutlineInputBorder(),
        isDense: true,
      ),
      items: [
        DropdownMenuItem(value: meId, child: Text('$meName (Me)')),
        ...dependents.map(
          (d) => DropdownMenuItem(value: d.id, child: Text('${d.name} (${d.relationship})')),
        ),
        const DropdownMenuItem(value: _addPersonValue, child: Text('+ Add a person')),
      ],
      onChanged: (value) {
        if (value == null) return;
        if (value == _addPersonValue) {
          onAddPerson();
          return;
        }
        final name = value == meId ? meName : dependents.firstWhere((d) => d.id == value).name;
        onSelect(value, name);
      },
    );
  }
}

class _RecoveryPercentTile extends StatelessWidget {
  const _RecoveryPercentTile({required this.uid, required this.personId});

  final String uid;
  final String personId;

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
      stream: RecoveryService.watchEarliestPainLog(uid, personId),
      builder: (context, baselineSnap) {
        final baselineDocs = baselineSnap.data?.docs ?? const [];
        if (baselineDocs.isEmpty) {
          return _tile(const Text('Log your first check-in to see your recovery score.'));
        }

        final baselineScore = (baselineDocs.first.data()['score'] as num?)?.toInt();

        return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
          stream: RecoveryService.watchPainLogs(uid, personId, 3),
          builder: (context, recentSnap) {
            final recentScores = (recentSnap.data?.docs ?? const [])
                .map((d) => (d.data()['score'] as num?)?.toInt() ?? 0)
                .toList();
            final percent = RecoveryService.computeRecoveryPercent(
              baselineScore: baselineScore,
              recentScores: recentScores,
            );

            return _tile(
              Row(
                children: [
                  Text(
                    percent == null ? '—' : '$percent%',
                    style: const TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF0891B2),
                    ),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Text(
                      'Improvement since your first pain check-in',
                      style: TextStyle(fontSize: 13),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _tile(Widget child) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFECFEFF),
        borderRadius: BorderRadius.circular(16),
      ),
      child: child,
    );
  }
}
