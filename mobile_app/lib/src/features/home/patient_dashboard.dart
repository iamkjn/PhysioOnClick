import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../admin/recovery/recovery_service.dart';
import '../appointments/appointments_repository.dart';
import '../appointments/appointments_screen.dart';
import '../appointments/booking_model.dart';
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

  String get _meName => widget.user.displayName?.isNotEmpty == true
      ? widget.user.displayName!
      : 'Me';

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
            style: theme.textTheme.bodySmall?.copyWith(
              color: const Color(0xFF5E7A84),
            ),
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
          _UpcomingAppointmentCard(uid: widget.user.uid),
          const SizedBox(height: 16),
          _GettingStartedGate(
            uid: widget.user.uid,
            personId: _personId,
            personName: _personName,
            onboarded: (context) => [
              _RecoveryPercentTile(uid: widget.user.uid, personId: _personId),
              _PainCheckinCard(uid: widget.user.uid, personId: _personId),
            ],
          ),
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
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
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
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
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
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
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
      value: selectedId,
      decoration: const InputDecoration(
        labelText: 'Viewing recovery for',
        border: OutlineInputBorder(),
        isDense: true,
      ),
      items: [
        DropdownMenuItem(value: meId, child: Text('$meName (Me)')),
        ...dependents.map(
          (d) => DropdownMenuItem(
            value: d.id,
            child: Text('${d.name} (${d.relationship})'),
          ),
        ),
        const DropdownMenuItem(
          value: _addPersonValue,
          child: Text('+ Add a person'),
        ),
      ],
      onChanged: (value) {
        if (value == null) return;
        if (value == _addPersonValue) {
          onAddPerson();
          return;
        }
        final name = value == meId
            ? meName
            : dependents.firstWhere((d) => d.id == value).name;
        onSelect(value, name);
      },
    );
  }
}

class _UpcomingAppointmentCard extends StatelessWidget {
  const _UpcomingAppointmentCard({required this.uid});

  final String uid;

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<List<BookingRecord>>(
      stream: AppointmentsRepository().watchBookings(uid),
      builder: (context, snapshot) {
        final bookings = snapshot.data ?? const <BookingRecord>[];
        final now = DateTime.now();
        final upcoming = bookings
            .where((b) => b.isUpcoming && b.sessionDate.isAfter(now))
            .toList()
          ..sort((a, b) => a.sessionDate.compareTo(b.sessionDate));
        if (upcoming.isEmpty) return const SizedBox.shrink();

        final next = upcoming.first;
        final theme = Theme.of(context);
        return Padding(
          padding: const EdgeInsets.only(bottom: 4),
          child: GestureDetector(
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const AppointmentsScreen()),
            ),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFECFEFF),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFC8E8F0)),
              ),
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: const Color(0xFF0891B2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.event_available_rounded, color: Colors.white, size: 22),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Next appointment',
                          style: theme.textTheme.bodySmall?.copyWith(color: const Color(0xFF5E7A84)),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '${next.service} · ${DateFormat('EEE d MMM, HH:mm').format(next.sessionDate)}',
                          style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
                        ),
                      ],
                    ),
                  ),
                  const Icon(Icons.chevron_right_rounded, color: Color(0xFF5E7A84)),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

/// What a patient has completed so far for [personId] — drives whether the
/// getting-started checklist or the normal recovery view renders.
class _OnboardingStatus {
  const _OnboardingStatus({
    required this.hasBooked,
    required this.hasAssessment,
    required this.hasExercises,
  });

  final bool hasBooked;
  final bool hasAssessment;
  final bool hasExercises;

  bool get isFullyOnboarded => hasBooked && hasAssessment && hasExercises;
}

Future<_OnboardingStatus> _loadOnboardingStatus(String uid, String personId) async {
  final db = FirebaseFirestore.instance;
  final personBase = db.collection('patients').doc(uid).collection('people').doc(personId);

  final results = await Future.wait([
    AppointmentsRepository().hasBookingFor(uid, personId),
    personBase.collection('assessmentForms').limit(1).get().then((s) => s.docs.isNotEmpty),
    personBase
        .collection('assignedExercises')
        .where('active', isEqualTo: true)
        .limit(1)
        .get()
        .then((s) => s.docs.isNotEmpty),
  ]);

  return _OnboardingStatus(
    hasBooked: results[0],
    hasAssessment: results[1],
    hasExercises: results[2],
  );
}

/// Renders the getting-started checklist while [personId] hasn't finished
/// onboarding, or [onboarded]'s widgets once they have. This is a one-way
/// transition per person, not a toggle — once fully onboarded the checklist
/// never reappears for that person even if, say, their rehab plan is later
/// cleared.
class _GettingStartedGate extends StatelessWidget {
  const _GettingStartedGate({
    required this.uid,
    required this.personId,
    required this.personName,
    required this.onboarded,
  });

  final String uid;
  final String personId;
  final String personName;
  final List<Widget> Function(BuildContext context) onboarded;

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<_OnboardingStatus>(
      // Re-fetches whenever this widget is rebuilt with a different
      // personId (PatientDashboard's setState on person-switch rebuilds
      // this whole subtree), which is what we want — the lookup is a single
      // cheap Future.wait over three limit(1) reads, not a hot path.
      future: _loadOnboardingStatus(uid, personId),
      builder: (context, snapshot) {
        final status = snapshot.data;
        // While loading, or if the lookup fails, fall back to the normal
        // (already-onboarded) view rather than flashing the checklist and
        // then swapping it out a moment later.
        if (status == null || status.isFullyOnboarded) {
          return Column(children: onboarded(context));
        }
        return _GettingStartedChecklist(personName: personName, status: status);
      },
    );
  }
}

class _GettingStartedChecklist extends StatelessWidget {
  const _GettingStartedChecklist({required this.personName, required this.status});

  final String personName;
  final _OnboardingStatus status;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFECFEFF),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Getting started', style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 2),
          Text(
            "Here's what's next for $personName.",
            style: theme.textTheme.bodySmall?.copyWith(color: const Color(0xFF5E7A84)),
          ),
          const SizedBox(height: 12),
          _ChecklistRow(
            label: 'Book your first session',
            done: status.hasBooked,
            cta: status.hasBooked
                ? null
                : ('Book session', () => WhoIsThisForScreen.go(context)),
          ),
          _ChecklistRow(label: 'Complete your assessment', done: status.hasAssessment),
          _ChecklistRow(label: 'Start your rehab plan', done: status.hasExercises),
        ],
      ),
    );
  }
}

class _ChecklistRow extends StatelessWidget {
  const _ChecklistRow({required this.label, required this.done, this.cta});

  final String label;
  final bool done;
  final (String, VoidCallback)? cta;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Icon(
            done ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded,
            size: 20,
            color: done ? const Color(0xFF16A34A) : const Color(0xFF9DB7BF),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              label,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: done ? const Color(0xFF5E7A84) : const Color(0xFF0F2D3A),
                decoration: done ? TextDecoration.lineThrough : null,
              ),
            ),
          ),
          if (cta != null)
            TextButton(
              onPressed: cta!.$2,
              child: Text(cta!.$1),
            ),
        ],
      ),
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
          return _tile(
            const Text('Log your first check-in to see your recovery score.'),
          );
        }

        final baselineScore = (baselineDocs.first.data()['score'] as num?)
            ?.toInt();

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

class _PainCheckinCard extends StatefulWidget {
  const _PainCheckinCard({required this.uid, required this.personId});

  final String uid;
  final String personId;

  @override
  State<_PainCheckinCard> createState() => _PainCheckinCardState();
}

class _PainCheckinCardState extends State<_PainCheckinCard> {
  int _score = 5;
  bool _saving = false;
  bool _loggedJustNow = false;

  late final Future<int?> _intervalFuture =
      RecoveryService.getPainCheckinInterval(widget.uid, widget.personId);
  late final Stream<List<Map<String, dynamic>>> _checkinsStream =
      RecoveryService.watchPainCheckins(widget.uid, widget.personId);
  late final Future<int> _runFuture =
      RecoveryService.getCurrentRun(widget.uid, widget.personId);

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<int?>(
      future: _intervalFuture,
      builder: (context, intervalSnap) {
        if (intervalSnap.data == null) return const SizedBox.shrink();
        return StreamBuilder<List<Map<String, dynamic>>>(
          stream: _checkinsStream,
          builder: (context, checkinsSnap) {
            final checkins = checkinsSnap.data ?? const [];
            return FutureBuilder<int>(
              future: _runFuture,
              builder: (context, runSnap) {
                if (!runSnap.hasData) return const SizedBox.shrink();
                final currentRun = runSnap.data!;
                final due = checkins.firstWhere(
                  (c) => c['runNumber'] == currentRun && c['status'] == 'pending',
                  orElse: () => const {},
                );
                if (due.isEmpty) return const SizedBox.shrink();

                if (_loggedJustNow) {
                  return const Card(
                    child: Padding(
                      padding: EdgeInsets.all(16),
                      child: Text('Thanks — logged. Your physio will see this ahead of your follow-up.'),
                    ),
                  );
                }

                return Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Day ${due['streakDay']} check-in',
                            style: Theme.of(context).textTheme.titleMedium),
                        const SizedBox(height: 4),
                        const Text(
                            'Optional: your physio likes a check-in every few days. How\'s your pain right now?'),
                        Slider(
                          value: _score.toDouble(),
                          min: 0,
                          max: 10,
                          divisions: 10,
                          label: '$_score',
                          onChanged: (v) => setState(() => _score = v.round()),
                        ),
                        Align(
                          alignment: Alignment.centerRight,
                          child: FilledButton(
                            onPressed: _saving
                                ? null
                                : () async {
                                    setState(() => _saving = true);
                                    try {
                                      await RecoveryService.logPainCheckinScore(
                                        widget.uid,
                                        widget.personId,
                                        due['id'] as String,
                                        _score,
                                      );
                                      if (mounted) setState(() => _loggedJustNow = true);
                                    } finally {
                                      if (mounted) setState(() => _saving = false);
                                    }
                                  },
                            child: Text(_saving ? 'Saving…' : 'Log check-in'),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            );
          },
        );
      },
    );
  }
}
