import 'dart:convert';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:intl/intl.dart';

import '../../core/api_client.dart';
import '../../core/app_colors.dart';
import '../../core/widgets/avatar_widget.dart';
import '../../core/widgets/empty_state.dart';
import '../booking/checkout_repository.dart';
import '../booking/service_select_screen.dart';
import 'appointment_detail_screen.dart';
import 'appointments_repository.dart';
import 'booking_model.dart';

class AppointmentsScreen extends StatefulWidget {
  const AppointmentsScreen({super.key});

  @override
  State<AppointmentsScreen> createState() => _AppointmentsScreenState();
}

class _AppointmentsScreenState extends State<AppointmentsScreen> {
  late Future<List<SessionPackage>> _packagesFuture;

  @override
  void initState() {
    super.initState();
    _packagesFuture = _fetchPackages();
    _syncCalBookings();
  }

  Future<List<SessionPackage>> _fetchPackages() async {
    final user = FirebaseAuth.instance.currentUser;
    final token = await user?.getIdToken();
    if (token == null) return const <SessionPackage>[];
    final res = await http
        .get(
          Uri.parse('$kApiBase/api/package-sessions'),
          headers: {'Authorization': 'Bearer $token'},
        )
        .timeout(const Duration(seconds: 20));
    if (res.statusCode != 200) {
      throw Exception('Could not load packages (${res.statusCode})');
    }
    final body = jsonDecode(res.body) as Map<String, dynamic>;
    final list = (body['packages'] as List<dynamic>? ?? const []);
    return list
        .whereType<Map<String, dynamic>>()
        .map(SessionPackage.fromJson)
        .toList();
  }

  void _reloadPackages() {
    setState(() {
      _packagesFuture = _fetchPackages();
    });
  }

  Future<void> _syncCalBookings() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null || user.email == null) return;
    try {
      await http
          .get(
            Uri.parse(
              '$kApiBase/api/appointments/sync'
              '?email=${Uri.encodeComponent(user.email!)}'
              '&userId=${user.uid}',
            ),
          )
          .timeout(const Duration(seconds: 15));
    } catch (_) {
      // Sync is best-effort; Firestore still shows any previously synced bookings
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      return const Scaffold(
        body: Center(child: Text('Sign in to view appointments')),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Appointments'),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF0C2A38),
        elevation: 0,
      ),
      backgroundColor: const Color(0xFFF0FDFA),
      body: StreamBuilder<List<BookingRecord>>(
        stream: AppointmentsRepository().watchBookings(user.uid),
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          final all = snap.data ?? [];
          final upcoming = all.where((b) => b.isUpcoming).toList();
          final past = all.where((b) => !b.isUpcoming).toList();

          return FutureBuilder<List<SessionPackage>>(
            future: _packagesFuture,
            builder: (context, packageSnap) {
              final packages = packageSnap.data ?? const <SessionPackage>[];

              if (all.isEmpty && packages.isEmpty) {
                return EmptyState(
                  title: 'No appointments yet',
                  body: 'Book your first session with a physio today.',
                  icon: Icons.calendar_today_outlined,
                  cta: FilledButton(
                    onPressed: () {
                      ServiceSelectScreen.go(context);
                    },
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.gold,
                      foregroundColor: Colors.white,
                      minimumSize: const Size(160, 48),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    child: const Text('Book Now'),
                  ),
                );
              }

              return ListView(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
                children: [
                  if (packageSnap.connectionState == ConnectionState.waiting)
                    const Padding(
                      padding: EdgeInsets.only(bottom: 14),
                      child: LinearProgressIndicator(),
                    ),
                  if (packageSnap.hasError)
                    const Padding(
                      padding: EdgeInsets.only(bottom: 14),
                      child: _InlineNotice(
                        text: 'Could not load package credits right now.',
                      ),
                    ),
                  if (packages.isNotEmpty) ...[
                    _SessionPackagesPanel(
                      packages: packages,
                      onBooked: () {
                        _reloadPackages();
                        _syncCalBookings();
                      },
                    ),
                    const SizedBox(height: 16),
                  ],
                  if (upcoming.isNotEmpty) ...[
                    const _SectionHeader('Upcoming'),
                    ...upcoming.map((b) => _AppointmentTile(booking: b)),
                    const SizedBox(height: 8),
                  ],
                  if (past.isNotEmpty) ...[
                    const _SectionHeader('Past'),
                    ...past.map((b) => _AppointmentTile(booking: b)),
                  ],
                ],
              );
            },
          );
        },
      ),
    );
  }
}

class SessionPackage {
  const SessionPackage({
    required this.id,
    required this.title,
    required this.patientName,
    required this.totalSessions,
    required this.usedSessions,
    required this.remainingSessions,
    required this.status,
  });

  final String id;
  final String title;
  final String patientName;
  final int totalSessions;
  final int usedSessions;
  final int remainingSessions;
  final String status;

  bool get canBook => status != 'complete' && remainingSessions > 0;

  factory SessionPackage.fromJson(Map<String, dynamic> json) => SessionPackage(
    id: '${json['id'] ?? ''}',
    title: '${json['title'] ?? 'Session package'}',
    patientName: '${json['patientName'] ?? 'Patient'}',
    totalSessions: (json['totalSessions'] as num?)?.toInt() ?? 0,
    usedSessions: (json['usedSessions'] as num?)?.toInt() ?? 0,
    remainingSessions: (json['remainingSessions'] as num?)?.toInt() ?? 0,
    status: '${json['status'] ?? 'active'}',
  );
}

class _InlineNotice extends StatelessWidget {
  const _InlineNotice({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF7ED),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFFED7AA)),
      ),
      child: Text(
        text,
        style: const TextStyle(
          color: Color(0xFF9A3412),
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class _SessionPackagesPanel extends StatelessWidget {
  const _SessionPackagesPanel({required this.packages, required this.onBooked});

  final List<SessionPackage> packages;
  final VoidCallback onBooked;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _SectionHeader('Session packages'),
        ...packages.map(
          (pack) => Container(
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: const Color(0xFFC8E8F0)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.04),
                  blurRadius: 12,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 42,
                      height: 42,
                      decoration: BoxDecoration(
                        color: const Color(0xFFD8F3F9),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: const Icon(
                        Icons.event_repeat_rounded,
                        color: Color(0xFF0891B2),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            pack.title,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF0C2A38),
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            pack.patientName,
                            style: const TextStyle(
                              color: Color(0xFF5E7A84),
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 5,
                      ),
                      decoration: BoxDecoration(
                        color: pack.canBook
                            ? const Color(0xFFE7F8EF)
                            : const Color(0xFFF3F4F6),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        pack.canBook
                            ? '${pack.remainingSessions} left'
                            : 'Complete',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w800,
                          color: pack.canBook
                              ? const Color(0xFF15803D)
                              : const Color(0xFF6B7280),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                ClipRRect(
                  borderRadius: BorderRadius.circular(999),
                  child: LinearProgressIndicator(
                    minHeight: 8,
                    value: pack.totalSessions <= 0
                        ? 0
                        : pack.usedSessions / pack.totalSessions,
                    backgroundColor: const Color(0xFFE0F2FE),
                    color: const Color(0xFF0891B2),
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  '${pack.usedSessions}/${pack.totalSessions} sessions used',
                  style: const TextStyle(
                    color: Color(0xFF5E7A84),
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 14),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    onPressed: pack.canBook
                        ? () => _PackageBookingSheet.show(
                            context,
                            package: pack,
                            onBooked: onBooked,
                          )
                        : null,
                    style: FilledButton.styleFrom(
                      backgroundColor: const Color(0xFF0891B2),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    icon: const Icon(Icons.calendar_month_rounded, size: 18),
                    label: const Text('Book package follow-up'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _PackageBookingSheet extends StatefulWidget {
  const _PackageBookingSheet({required this.package, required this.onBooked});

  final SessionPackage package;
  final VoidCallback onBooked;

  static Future<void> show(
    BuildContext context, {
    required SessionPackage package,
    required VoidCallback onBooked,
  }) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      backgroundColor: Colors.white,
      builder: (_) =>
          _PackageBookingSheet(package: package, onBooked: onBooked),
    );
  }

  @override
  State<_PackageBookingSheet> createState() => _PackageBookingSheetState();
}

class _PackageBookingSheetState extends State<_PackageBookingSheet> {
  final _checkoutRepo = CheckoutRepository();
  final _focusController = TextEditingController();
  final _changeController = TextEditingController();
  late Future<Map<String, List<String>>> _slotsFuture;
  String? _selectedIso;
  double _painScore = 5;
  String _progress = 'same';
  String _exercises = 'partly';
  bool _newSymptoms = false;
  bool _submitting = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _slotsFuture = _checkoutRepo.fetchSlots(
      service: 'follow-up',
      start: now,
      end: now.add(const Duration(days: 30)),
    );
  }

  @override
  void dispose() {
    _focusController.dispose();
    _changeController.dispose();
    super.dispose();
  }

  Future<void> _book() async {
    if (_selectedIso == null || _submitting) return;
    final user = FirebaseAuth.instance.currentUser;
    final token = await user?.getIdToken();
    if (token == null) return;
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      final res = await http
          .post(
            Uri.parse('$kApiBase/api/package-sessions'),
            headers: {
              'Authorization': 'Bearer $token',
              'Content-Type': 'application/json',
            },
            body: jsonEncode({
              'packageId': widget.package.id,
              'start': DateTime.parse(_selectedIso!).toUtc().toIso8601String(),
              'timeZone': 'Europe/London',
              'checkIn': {
                'painScore': _painScore.round(),
                'progress': _progress,
                'exercises': _exercises,
                'newSymptoms': _newSymptoms,
                'changeNote': _changeController.text.trim(),
                'focus': _focusController.text.trim(),
              },
            }),
          )
          .timeout(const Duration(seconds: 25));
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      if (res.statusCode != 200 || body['ok'] != true) {
        throw Exception(
          body['error'] ?? 'Could not book this package session.',
        );
      }
      if (!mounted) return;
      widget.onBooked();
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Package follow-up booked.')),
      );
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _error = error.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  String _dateLabel(String key) {
    final date = DateTime.parse(key);
    return DateFormat('EEE d MMM').format(date);
  }

  String _timeLabel(String iso) {
    return DateFormat('HH:mm').format(DateTime.parse(iso).toLocal());
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).viewInsets.bottom;
    return SafeArea(
      child: Padding(
        padding: EdgeInsets.fromLTRB(20, 0, 20, bottom + 20),
        child: FutureBuilder<Map<String, List<String>>>(
          future: _slotsFuture,
          builder: (context, snapshot) {
            final slots = snapshot.data ?? const <String, List<String>>{};
            final dates =
                slots.entries.where((entry) => entry.value.isNotEmpty).toList()
                  ..sort((a, b) => a.key.compareTo(b.key));

            return ListView(
              shrinkWrap: true,
              children: [
                Text(
                  'Book package follow-up',
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                const SizedBox(height: 4),
                Text(
                  '${widget.package.patientName} · ${widget.package.remainingSessions} sessions remaining',
                  style: const TextStyle(color: Color(0xFF5E7A84)),
                ),
                const SizedBox(height: 18),
                if (snapshot.connectionState == ConnectionState.waiting)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 18),
                    child: Center(child: CircularProgressIndicator()),
                  )
                else if (snapshot.hasError || dates.isEmpty)
                  const _InlineNotice(
                    text:
                        'No follow-up slots are available right now. Please try again later.',
                  )
                else ...[
                  const Text(
                    'Choose a follow-up time',
                    style: TextStyle(fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 10),
                  ...dates
                      .take(10)
                      .map(
                        (entry) => Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                _dateLabel(entry.key),
                                style: const TextStyle(
                                  fontWeight: FontWeight.w700,
                                  color: Color(0xFF0C2A38),
                                ),
                              ),
                              const SizedBox(height: 8),
                              Wrap(
                                spacing: 8,
                                runSpacing: 8,
                                children: entry.value.take(6).map((iso) {
                                  final selected = iso == _selectedIso;
                                  return ChoiceChip(
                                    label: Text(_timeLabel(iso)),
                                    selected: selected,
                                    onSelected: (_) =>
                                        setState(() => _selectedIso = iso),
                                  );
                                }).toList(),
                              ),
                            ],
                          ),
                        ),
                      ),
                ],
                const Divider(height: 32),
                Text(
                  'Quick check-in',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 12),
                Text('Pain today: ${_painScore.round()}/10'),
                Slider(
                  value: _painScore,
                  min: 0,
                  max: 10,
                  divisions: 10,
                  activeColor: const Color(0xFF0891B2),
                  onChanged: (v) => setState(() => _painScore = v),
                ),
                const SizedBox(height: 8),
                _SegmentedChoice(
                  label: 'Progress since last session',
                  value: _progress,
                  options: const {
                    'better': 'Better',
                    'same': 'Same',
                    'worse': 'Worse',
                  },
                  onChanged: (v) => setState(() => _progress = v),
                ),
                const SizedBox(height: 12),
                _SegmentedChoice(
                  label: 'Have you done the exercises?',
                  value: _exercises,
                  options: const {'yes': 'Yes', 'partly': 'Partly', 'no': 'No'},
                  onChanged: (v) => setState(() => _exercises = v),
                ),
                const SizedBox(height: 12),
                CheckboxListTile(
                  contentPadding: EdgeInsets.zero,
                  value: _newSymptoms,
                  onChanged: (v) => setState(() => _newSymptoms = v ?? false),
                  controlAffinity: ListTileControlAffinity.leading,
                  title: const Text('New or changed symptoms since last time'),
                ),
                TextField(
                  controller: _changeController,
                  maxLines: 2,
                  decoration: const InputDecoration(
                    labelText: 'What changed? (optional)',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _focusController,
                  maxLines: 2,
                  decoration: const InputDecoration(
                    labelText: 'What should we focus on? (optional)',
                    border: OutlineInputBorder(),
                  ),
                ),
                if (_error != null) ...[
                  const SizedBox(height: 12),
                  _InlineNotice(text: _error!),
                ],
                const SizedBox(height: 18),
                FilledButton(
                  onPressed: _selectedIso == null || _submitting ? null : _book,
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFF0891B2),
                    foregroundColor: Colors.white,
                    minimumSize: const Size.fromHeight(50),
                  ),
                  child: Text(
                    _submitting ? 'Booking...' : 'Book using package credit',
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _SegmentedChoice extends StatelessWidget {
  const _SegmentedChoice({
    required this.label,
    required this.value,
    required this.options,
    required this.onChanged,
  });

  final String label;
  final String value;
  final Map<String, String> options;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontWeight: FontWeight.w700)),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          children: options.entries.map((entry) {
            return ChoiceChip(
              label: Text(entry.value),
              selected: value == entry.key,
              onSelected: (_) => onChanged(entry.key),
            );
          }).toList(),
        ),
      ],
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10, left: 4),
      child: Text(
        text,
        style: const TextStyle(
          fontWeight: FontWeight.w800,
          fontSize: 16,
          color: Color(0xFF0C2A38),
        ),
      ),
    );
  }
}

class _AppointmentTile extends StatelessWidget {
  const _AppointmentTile({required this.booking});

  final BookingRecord booking;

  @override
  Widget build(BuildContext context) {
    final fmt = DateFormat('d MMM yyyy');
    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => AppointmentDetailScreen(bookingId: booking.id),
        ),
      ),
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
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
        child: Row(
          children: [
            AvatarWidget(
              name: booking.patientName,
              imageUrl: booking.patientAvatarUrl,
              size: 44,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    booking.patientName,
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 15,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    booking.service,
                    style: const TextStyle(
                      color: Color(0xFF5E7A84),
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    fmt.format(booking.sessionDate),
                    style: const TextStyle(
                      color: Color(0xFF9ADCEE),
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
            if (!booking.isUpcoming)
              booking.hasSummary
                  ? const Icon(
                      Icons.article_rounded,
                      color: Color(0xFF0891B2),
                      size: 22,
                    )
                  : const Icon(
                      Icons.hourglass_top_rounded,
                      color: Color(0xFF9ADCEE),
                      size: 22,
                    )
            else
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFFD8F3F9),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: const Text(
                  'Upcoming',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF0E7490),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
