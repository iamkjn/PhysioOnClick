import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '../../core/app_colors.dart';
import '../../core/page_transitions.dart';
import '../people/dependent_model.dart';
import '../people/people_repository.dart';
import 'assessment_step_screen.dart';
import 'booking_step_header.dart';
import 'checkout_repository.dart';
import 'models/book_service.dart';

const _weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/// `YYYY-MM-DD` local date key, matching the shape `CheckoutRepository`'s
/// `fetchSlots` keys its response by.
String _dateKey(DateTime d) =>
    '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

/// Monday-first leading blank count for a calendar grid starting on
/// [firstOfMonth]. Mirrors web's `leadingBlanks` (`booking-step-time.tsx`).
int _leadingBlanks(DateTime firstOfMonth) => (firstOfMonth.weekday - 1) % 7;

/// Step 2 of the native booking flow (service -> time/details -> assessment
/// -> payment -> confirmation). Mirrors web's `BookingStepTime`
/// (`components/booking-step-time.tsx`): one panel combining a real month
/// calendar, that day's time slots, a "Booking for" picker (self or a
/// dependent — asked exactly once, here, not upstream), account details, and
/// a required consent checkbox — a single "Continue" submits all of it at
/// once, the same shape as web's one `<form>`.
class TimeDetailsScreen extends StatefulWidget {
  final ResolvedService service;
  final List<String> focusAreas;

  /// When set (non-self), pre-selects this dependent in the "Booking for"
  /// picker instead of defaulting to "myself" — see [ServiceSelectScreen].
  final String? initialPersonId;
  final String? initialPersonName;

  const TimeDetailsScreen({
    required this.service,
    this.focusAreas = const [],
    this.initialPersonId,
    this.initialPersonName,
    super.key,
  });

  @override
  State<TimeDetailsScreen> createState() => _TimeDetailsScreenState();
}

class _TimeDetailsScreenState extends State<TimeDetailsScreen> {
  final _repo = CheckoutRepository();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();

  late DateTime _viewMonth;
  Map<String, List<String>> _slots = {};
  DateTime? _selectedDate;
  String? _selectedSlotIso;
  bool _loadingSlots = true;
  String? _slotsError;

  /// null = booking for self (the signed-in account holder).
  String? _selectedPersonId;
  String? _selectedPersonName;
  bool _consent = false;

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _viewMonth = DateTime(now.year, now.month, 1);
    final user = FirebaseAuth.instance.currentUser;
    if (user != null) {
      _nameController.text = user.displayName ?? '';
      _emailController.text = user.email ?? '';
    }
    _selectedPersonId = widget.initialPersonId;
    _selectedPersonName = widget.initialPersonName;
    _loadSlots();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _loadSlots() async {
    final now = DateTime.now();
    final firstOfMonth = DateTime(_viewMonth.year, _viewMonth.month, 1);
    final lastOfMonth = DateTime(_viewMonth.year, _viewMonth.month + 1, 0);
    final start = firstOfMonth.isBefore(now) ? now : firstOfMonth;

    setState(() {
      _loadingSlots = true;
      _slotsError = null;
    });

    try {
      final slots = await _repo.fetchSlots(
        service: widget.service.apiId,
        start: start,
        end: lastOfMonth,
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
          _slotsError = 'We couldn\'t load available times. Please try again.';
        });
      }
    }
  }

  void _changeMonth(int delta) {
    setState(() {
      _viewMonth = DateTime(_viewMonth.year, _viewMonth.month + delta, 1);
      _selectedDate = null;
      _selectedSlotIso = null;
    });
    _loadSlots();
  }

  Future<void> _onContinue() async {
    if (_selectedSlotIso == null || !_consent) return;
    final user = FirebaseAuth.instance.currentUser;
    if (user != null && _selectedPersonId != null) {
      // Reuses the same pendingSelections/{uid} write the Cal.com webhook
      // reads to stamp the resulting booking with the right patient.
      await PeopleRepository().writePendingSelection(
        uid: user.uid,
        patientType: 'dependent',
        patientId: _selectedPersonId!,
        patientName: _selectedPersonName ?? '',
      );
    }
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
          focusAreas: widget.focusAreas,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final user = FirebaseAuth.instance.currentUser;
    final daysInMonth = DateTime(_viewMonth.year, _viewMonth.month + 1, 0).day;
    final firstOfMonth = DateTime(_viewMonth.year, _viewMonth.month, 1);
    final now = DateTime.now();
    final canGoBack = firstOfMonth.isAfter(DateTime(now.year, now.month, 1));

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(title: Text(widget.service.title)),
      body: SafeArea(
        child: Column(
          children: [
            BookingStepHeader(step: 2, totalSteps: 3, title: 'Time & your details'),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
                children: [
                  if (_slotsError != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Text(_slotsError!, style: const TextStyle(color: AppColors.error)),
                    ),
                  _CalendarMonth(
                    viewMonth: _viewMonth,
                    daysInMonth: daysInMonth,
                    leadingBlanks: _leadingBlanks(firstOfMonth),
                    canGoBack: canGoBack,
                    loading: _loadingSlots,
                    slots: _slots,
                    selectedDate: _selectedDate,
                    onPrevMonth: () => _changeMonth(-1),
                    onNextMonth: () => _changeMonth(1),
                    onSelectDay: (d) => setState(() {
                      _selectedDate = d;
                      _selectedSlotIso = null;
                    }),
                  ),
                  const SizedBox(height: 16),
                  _TimeSlotList(
                    loading: _loadingSlots,
                    selectedDate: _selectedDate,
                    isos: _selectedDate == null ? const [] : (_slots[_dateKey(_selectedDate!)] ?? const []),
                    selectedIso: _selectedSlotIso,
                    onSelect: (iso) => setState(() => _selectedSlotIso = iso),
                  ),
                  const Divider(height: 40, color: AppColors.border),
                  if (user != null)
                    StreamBuilder<List<Dependent>>(
                      stream: PeopleRepository().watchDependents(user.uid),
                      builder: (context, snapshot) {
                        final dependents = snapshot.data ?? const <Dependent>[];
                        if (dependents.isEmpty) return const SizedBox.shrink();
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 16),
                          child: DropdownButtonFormField<String>(
                            initialValue: _selectedPersonId ?? user.uid,
                            decoration: const InputDecoration(
                              labelText: 'Booking for',
                              border: OutlineInputBorder(),
                            ),
                            items: [
                              DropdownMenuItem(
                                value: user.uid,
                                child: Text('${user.displayName?.isNotEmpty == true ? user.displayName : 'Myself'} (my appointment)'),
                              ),
                              ...dependents.map(
                                (d) => DropdownMenuItem(
                                  value: d.id,
                                  child: Text('${d.name} (${d.relationship})'),
                                ),
                              ),
                            ],
                            onChanged: (value) {
                              if (value == null) return;
                              setState(() {
                                if (value == user.uid) {
                                  _selectedPersonId = null;
                                  _selectedPersonName = null;
                                } else {
                                  _selectedPersonId = value;
                                  _selectedPersonName =
                                      dependents.firstWhere((d) => d.id == value).name;
                                }
                              });
                            },
                          ),
                        );
                      },
                    ),
                  Text(
                    'Booking as',
                    style: theme.textTheme.bodySmall?.copyWith(color: AppColors.textSecondary),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _nameController,
                    decoration: const InputDecoration(labelText: 'Full name', border: OutlineInputBorder()),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _emailController,
                    decoration: const InputDecoration(labelText: 'Email', border: OutlineInputBorder()),
                    keyboardType: TextInputType.emailAddress,
                  ),
                  const SizedBox(height: 20),
                  CheckboxListTile(
                    contentPadding: EdgeInsets.zero,
                    controlAffinity: ListTileControlAffinity.leading,
                    value: _consent,
                    onChanged: (v) => setState(() => _consent = v ?? false),
                    title: const Text(
                      'I consent to online consultation and the storage of my personal and clinical data, and I accept the Terms and Privacy Policy.',
                      style: TextStyle(fontSize: 13),
                    ),
                  ),
                ],
              ),
            ),
            SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
                child: SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: (_selectedSlotIso == null || !_consent) ? null : _onContinue,
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.teal,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    child: Text('Continue to payment · £${widget.service.price.toStringAsFixed(0)}'),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CalendarMonth extends StatelessWidget {
  const _CalendarMonth({
    required this.viewMonth,
    required this.daysInMonth,
    required this.leadingBlanks,
    required this.canGoBack,
    required this.loading,
    required this.slots,
    required this.selectedDate,
    required this.onPrevMonth,
    required this.onNextMonth,
    required this.onSelectDay,
  });

  final DateTime viewMonth;
  final int daysInMonth;
  final int leadingBlanks;
  final bool canGoBack;
  final bool loading;
  final Map<String, List<String>> slots;
  final DateTime? selectedDate;
  final VoidCallback onPrevMonth;
  final VoidCallback onNextMonth;
  final ValueChanged<DateTime> onSelectDay;

  static const _monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            IconButton(
              onPressed: canGoBack ? onPrevMonth : null,
              icon: const Icon(Icons.chevron_left_rounded),
            ),
            Text(
              '${_monthNames[viewMonth.month - 1]} ${viewMonth.year}',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
            ),
            IconButton(
              onPressed: onNextMonth,
              icon: const Icon(Icons.chevron_right_rounded),
            ),
          ],
        ),
        Row(
          children: _weekdayLabels
              .map((d) => Expanded(
                    child: Center(
                      child: Text(
                        d,
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ),
                  ))
              .toList(),
        ),
        const SizedBox(height: 4),
        GridView.count(
          crossAxisCount: 7,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          children: [
            for (var i = 0; i < leadingBlanks; i++) const SizedBox.shrink(),
            for (var day = 1; day <= daysInMonth; day++) _dayCell(context, day),
          ],
        ),
      ],
    );
  }

  Widget _dayCell(BuildContext context, int day) {
    final date = DateTime(viewMonth.year, viewMonth.month, day);
    final key = _dateKey(date);
    final hasSlots = (slots[key]?.isNotEmpty ?? false);
    final selected = selectedDate != null && _dateKey(selectedDate!) == key;

    return Padding(
      padding: const EdgeInsets.all(2),
      child: Material(
        color: selected
            ? AppColors.teal
            : hasSlots
                ? AppColors.tealLight
                : Colors.transparent,
        borderRadius: BorderRadius.circular(10),
        child: InkWell(
          borderRadius: BorderRadius.circular(10),
          onTap: (hasSlots && !loading) ? () => onSelectDay(date) : null,
          child: Center(
            child: Text(
              '$day',
              style: TextStyle(
                fontWeight: FontWeight.w600,
                color: selected
                    ? Colors.white
                    : hasSlots
                        ? AppColors.textPrimary
                        : AppColors.border,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _TimeSlotList extends StatelessWidget {
  const _TimeSlotList({
    required this.loading,
    required this.selectedDate,
    required this.isos,
    required this.selectedIso,
    required this.onSelect,
  });

  final bool loading;
  final DateTime? selectedDate;
  final List<String> isos;
  final String? selectedIso;
  final ValueChanged<String> onSelect;

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 16),
        child: Center(child: CircularProgressIndicator()),
      );
    }
    if (selectedDate == null) {
      return const Text('Pick a date to see available times.');
    }
    if (isos.isEmpty) {
      return const Text('No times available on this day.');
    }
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: isos.map((iso) {
        final time = DateTime.parse(iso).toLocal();
        final label = '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
        return ChoiceChip(
          label: Text(label),
          selected: selectedIso == iso,
          onSelected: (_) => onSelect(iso),
        );
      }).toList(),
    );
  }
}
