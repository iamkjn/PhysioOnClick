import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '../../core/app_colors.dart';
import '../../core/page_transitions.dart';
import '../people/people_repository.dart';
import 'assessment_step_screen.dart';
import 'checkout_repository.dart';
import 'models/book_service.dart';

/// How long a `pendingSelections/{uid}` doc is trusted as "the dependent the
/// patient just picked on WhoIsThisForScreen" before we treat it as stale
/// (e.g. left over from a booking days ago) and default back to self.
const _pendingSelectionFreshness = Duration(minutes: 30);

/// Loads the raw `pendingSelections/{uid}` doc fields, or null if there is
/// none. Injectable so tests can supply a dependent selection without a real
/// Firestore backend.
typedef PendingSelectionLoader = Future<Map<String, dynamic>?> Function(String uid);

Future<Map<String, dynamic>?> _defaultPendingSelectionLoader(String uid) async {
  final snap = await FirebaseFirestore.instance.doc('pendingSelections/$uid').get();
  return snap.exists ? snap.data() : null;
}

/// Pure resolution logic for a `pendingSelections/{uid}` doc: returns the
/// dependent's (patientId, patientName) to thread through the booking flow,
/// or null when the doc is missing/for self/stale/malformed. Exposed for
/// testing without a Firestore backend.
(String, String?)? resolvePendingDependentSelection(
  Map<String, dynamic>? data, {
  DateTime? now,
}) {
  if (data == null) return null;
  if (data['patientType'] != 'dependent') return null;
  final selectedAt = data['selectedAt'];
  if (selectedAt is Timestamp) {
    final age = (now ?? DateTime.now()).difference(selectedAt.toDate());
    if (age > _pendingSelectionFreshness) return null;
  }
  final patientId = data['patientId'] as String?;
  if (patientId == null || patientId.isEmpty) return null;
  return (patientId, data['patientName'] as String?);
}

/// Step 2 of the native booking flow (service -> time/details -> assessment
/// -> payment -> confirmation). Lets the patient pick an available slot,
/// confirm their name/email, and (if booking for a dependent) select who the
/// appointment is for, before continuing to [AssessmentStepScreen].
class TimeDetailsScreen extends StatefulWidget {
  final ResolvedService service;
  final PendingSelectionLoader pendingSelectionLoader;
  const TimeDetailsScreen({
    required this.service,
    PendingSelectionLoader? pendingSelectionLoader,
    super.key,
  }) : pendingSelectionLoader = pendingSelectionLoader ?? _defaultPendingSelectionLoader;

  @override
  State<TimeDetailsScreen> createState() => _TimeDetailsScreenState();
}

class _TimeDetailsScreenState extends State<TimeDetailsScreen> {
  final _repo = CheckoutRepository();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  Map<String, List<String>> _slots = {};
  String? _selectedSlotIso;
  bool _loadingSlots = true;
  String? _slotsError;
  String? _selectedPersonId; // null = booking for self
  String? _selectedPersonName;

  @override
  void initState() {
    super.initState();
    final user = FirebaseAuth.instance.currentUser;
    if (user != null) {
      _nameController.text = user.displayName ?? '';
      _emailController.text = user.email ?? '';
      _selectedPersonName = user.displayName;
    }
    _loadPendingSelection();
    _loadSlots();
  }

  /// Reads the `pendingSelections/{uid}` doc written by
  /// [WhoIsThisForScreen] (via `PeopleRepository.writePendingSelection`) so
  /// a dependent chosen there is threaded through to the assessment step
  /// instead of silently defaulting to the signed-in parent. Ignored for
  /// `patientType: 'self'` (nothing to override) and for stale docs.
  Future<void> _loadPendingSelection() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;
    try {
      final data = await widget.pendingSelectionLoader(user.uid);
      if (!mounted) return;
      final resolved = resolvePendingDependentSelection(data);
      if (resolved == null) return;
      final (patientId, patientName) = resolved;
      setState(() {
        _selectedPersonId = patientId;
        _selectedPersonName = patientName?.isNotEmpty == true ? patientName : _selectedPersonName;
      });
    } catch (_) {
      // Non-critical: fall back to booking for self.
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _loadSlots() async {
    final now = DateTime.now();
    final end = now.add(const Duration(days: 21));
    try {
      final slots = await _repo.fetchSlots(
        service: widget.service.apiId,
        start: now,
        end: end,
      );
      if (mounted) {
        setState(() {
          _slots = slots;
          _loadingSlots = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _loadingSlots = false;
          _slotsError = 'Could not load available times. Please try again.';
        });
      }
    }
  }

  /// Reuses the exact `pendingSelections/{uid}` write shape used by
  /// `who_is_this_for_screen.dart` (now shared via
  /// `PeopleRepository.writePendingSelection`), so the Cal.com webhook
  /// stamps the resulting booking with the right patient.
  Future<void> _writePendingSelectionIfNeeded() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null || _selectedPersonId == null) return;
    await PeopleRepository().writePendingSelection(
      uid: user.uid,
      patientType: 'dependent',
      patientId: _selectedPersonId!,
      patientName: _selectedPersonName ?? '',
    );
  }

  Future<void> _onContinue() async {
    if (_selectedSlotIso == null) return;
    await _writePendingSelectionIfNeeded();
    if (!mounted) return;
    Navigator.push(
      context,
      PhysioPageRoute(
        builder: (_) => AssessmentStepScreen(
          service: widget.service,
          start: DateTime.parse(_selectedSlotIso!),
          name: _nameController.text.trim(),
          email: _emailController.text.trim(),
          personId: _selectedPersonId,
          personName: _selectedPersonName ?? _nameController.text.trim(),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: Text(widget.service.title),
        backgroundColor: AppColors.surface,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
      ),
      body: _loadingSlots
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Text('Choose a time', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 12),
                if (_slotsError != null)
                  Text(_slotsError!, style: const TextStyle(color: AppColors.error))
                else if (_slots.isEmpty)
                  const Text('No available times in the next 3 weeks.')
                else
                  ..._slots.entries.map((entry) => _DaySlots(
                        date: entry.key,
                        isos: entry.value,
                        selected: _selectedSlotIso,
                        onSelect: (iso) => setState(() => _selectedSlotIso = iso),
                      )),
                const SizedBox(height: 24),
                TextField(
                  controller: _nameController,
                  decoration: const InputDecoration(labelText: 'Full name'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _emailController,
                  decoration: const InputDecoration(labelText: 'Email'),
                  keyboardType: TextInputType.emailAddress,
                ),
                const SizedBox(height: 24),
                FilledButton(
                  onPressed: _selectedSlotIso == null ? null : _onContinue,
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.teal,
                    minimumSize: const Size.fromHeight(50),
                  ),
                  child: const Text('Continue'),
                ),
              ],
            ),
    );
  }
}

class _DaySlots extends StatelessWidget {
  final String date;
  final List<String> isos;
  final String? selected;
  final ValueChanged<String> onSelect;
  const _DaySlots({
    required this.date,
    required this.isos,
    required this.selected,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(date, style: Theme.of(context).textTheme.labelLarge),
          const SizedBox(height: 6),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: isos.map((iso) {
              final time = DateTime.parse(iso).toLocal();
              final label =
                  '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
              return ChoiceChip(
                label: Text(label),
                selected: selected == iso,
                onSelected: (_) => onSelect(iso),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}
