import 'package:flutter/material.dart';

import '../../../core/app_colors.dart';
import '../widgets/admin_pager.dart';
import 'admin_booking_model.dart';
import 'admin_bookings_repository.dart';

const _filterOptions = ['all', 'pending', 'upcoming', 'completed', 'cancelled'];

const _statusColors = {
  'pending': Colors.orange,
  'upcoming': AppColors.teal,
  'completed': Colors.green,
  'cancelled': Colors.redAccent,
};

/// Admin bookings management — mirrors web's `AdminBookingsTable`
/// (`components/admin-bookings-table.tsx`): filter by status, search, cancel
/// an upcoming/pending booking (via Cal.com), and expand a submitted
/// pre-session assessment inline.
class AdminBookingsScreen extends StatefulWidget {
  const AdminBookingsScreen({super.key});

  @override
  State<AdminBookingsScreen> createState() => _AdminBookingsScreenState();
}

class _AdminBookingsScreenState extends State<AdminBookingsScreen> {
  final _repo = AdminBookingsRepository();
  String _filter = 'all';
  String _search = '';
  String? _expandedId;
  final Map<String, Map<String, dynamic>?> _assessmentCache = {};
  String? _cancellingId;
  int _page = 1;
  static const _pageSize = 10;

  Future<void> _toggleAssessment(AdminBooking b) async {
    if (_expandedId == b.id) {
      setState(() => _expandedId = null);
      return;
    }
    setState(() => _expandedId = b.id);
    if (b.assessmentFormId != null && !_assessmentCache.containsKey(b.id)) {
      final data = await _repo.fetchAssessment(
        uid: b.bookedBy,
        personId: b.patientId,
        formId: b.assessmentFormId!,
      );
      if (mounted) setState(() => _assessmentCache[b.id] = data);
    }
  }

  Future<void> _confirmCancel(AdminBooking b) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cancel this booking?'),
        content: Text("This cancels ${b.fullName.isNotEmpty ? b.fullName : b.patientName}'s appointment via Cal.com. This can't be undone from here."),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Keep booking')),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Cancel booking'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;

    setState(() => _cancellingId = b.id);
    try {
      await _repo.cancelBooking(b.calBookingUid);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Booking cancelled.')));
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not cancel this booking. Try again.')),
        );
      }
    } finally {
      if (mounted) setState(() => _cancellingId = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(title: const Text('Bookings')),
      body: StreamBuilder<List<AdminBooking>>(
        stream: _repo.watchBookings(),
        builder: (context, snapshot) {
          if (snapshot.hasError) {
            return const Center(child: Text('Could not load bookings. Check admin access.'));
          }
          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator());
          }
          final all = snapshot.data!;
          final counts = {
            for (final f in _filterOptions)
              f: f == 'all' ? all.length : all.where((b) => b.displayStatus == f).length,
          };
          var filtered = _filter == 'all' ? all : all.where((b) => b.displayStatus == _filter).toList();
          final term = _search.trim().toLowerCase();
          if (term.isNotEmpty) {
            filtered = filtered
                .where((b) => [b.fullName, b.patientName, b.email, b.service]
                    .any((f) => f.toLowerCase().contains(term)))
                .toList();
          }

          final pageCount = filtered.isEmpty ? 1 : (filtered.length / _pageSize).ceil();
          final currentPage = _page.clamp(1, pageCount);
          final paged = filtered.skip((currentPage - 1) * _pageSize).take(_pageSize).toList();

          return Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                child: TextField(
                  decoration: const InputDecoration(
                    hintText: 'Search patient, email or service…',
                    prefixIcon: Icon(Icons.search),
                    border: OutlineInputBorder(),
                    isDense: true,
                  ),
                  onChanged: (v) => setState(() {
                    _search = v;
                    _page = 1;
                  }),
                ),
              ),
              SizedBox(
                height: 44,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  children: _filterOptions.map((f) {
                    final selected = _filter == f;
                    return Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      child: ChoiceChip(
                        label: Text('${f[0].toUpperCase()}${f.substring(1)} (${counts[f]})'),
                        selected: selected,
                        selectedColor: AppColors.teal,
                        showCheckmark: false,
                        labelStyle: TextStyle(
                          color: selected ? Colors.white : AppColors.textPrimary,
                          fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                        ),
                        onSelected: (_) => setState(() {
                          _filter = f;
                          _page = 1;
                        }),
                      ),
                    );
                  }).toList(),
                ),
              ),
              const SizedBox(height: 8),
              Expanded(
                child: filtered.isEmpty
                    ? const Center(child: Text('No bookings match this filter.'))
                    : ListView.builder(
                        padding: const EdgeInsets.fromLTRB(12, 0, 12, 20),
                        itemCount: paged.length,
                        itemBuilder: (context, i) => _BookingCard(
                          booking: paged[i],
                          expanded: _expandedId == paged[i].id,
                          assessment: _assessmentCache[paged[i].id],
                          cancelling: _cancellingId == paged[i].id,
                          onToggleAssessment: () => _toggleAssessment(paged[i]),
                          onCancel: () => _confirmCancel(paged[i]),
                        ),
                      ),
              ),
              if (pageCount > 1)
                AdminPager(
                  page: currentPage,
                  pageCount: pageCount,
                  onPrev: () => setState(() => _page = currentPage - 1),
                  onNext: () => setState(() => _page = currentPage + 1),
                ),
            ],
          );
        },
      ),
    );
  }
}

class _BookingCard extends StatelessWidget {
  const _BookingCard({
    required this.booking,
    required this.expanded,
    required this.assessment,
    required this.cancelling,
    required this.onToggleAssessment,
    required this.onCancel,
  });

  final AdminBooking booking;
  final bool expanded;
  final Map<String, dynamic>? assessment;
  final bool cancelling;
  final VoidCallback onToggleAssessment;
  final VoidCallback onCancel;

  bool get _hasUrgentRedFlags {
    final flags = assessment?['redFlags'] as Map<String, dynamic>?;
    if (flags == null) return false;
    return [
      'majorTrauma',
      'chestPainBreathlessness',
      'bladderBowelSaddle',
      'progressiveWeakness',
      'unexplainedFeverWeightLoss',
      'nightPain',
    ].any((k) => flags[k] == true);
  }

  @override
  Widget build(BuildContext context) {
    final status = booking.displayStatus;
    final canAct = booking.calBookingUid.isNotEmpty && (status == 'pending' || status == 'upcoming');
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 6),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        booking.fullName.isNotEmpty ? booking.fullName : booking.patientName,
                        style: const TextStyle(fontWeight: FontWeight.w700),
                      ),
                      if (booking.email.isNotEmpty)
                        Text(booking.email, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: (_statusColors[status] ?? Colors.grey).withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    status,
                    style: TextStyle(color: _statusColors[status] ?? Colors.grey, fontWeight: FontWeight.w700, fontSize: 12),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(booking.service, style: const TextStyle(fontWeight: FontWeight.w600)),
            Text(
              booking.appointmentLabel,
              style: TextStyle(
                color: booking.appointmentLabel == 'TBC' ? AppColors.textSecondary : AppColors.textPrimary,
                fontStyle: booking.appointmentLabel == 'TBC' ? FontStyle.italic : FontStyle.normal,
              ),
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                if (canAct)
                  OutlinedButton(
                    onPressed: cancelling ? null : onCancel,
                    style: OutlinedButton.styleFrom(
                      minimumSize: Size.zero,
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      foregroundColor: Colors.red,
                      side: const BorderSide(color: Colors.red),
                    ),
                    child: Text(cancelling ? 'Cancelling…' : 'Cancel'),
                  ),
                if (booking.summaryId != null)
                  const Chip(label: Text('✓ Summary published', style: TextStyle(fontSize: 12))),
                if (booking.assessmentFormId != null)
                  OutlinedButton(
                    onPressed: onToggleAssessment,
                    style: OutlinedButton.styleFrom(
                      minimumSize: Size.zero,
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      foregroundColor: Colors.green,
                      side: const BorderSide(color: Colors.green),
                    ),
                    child: Text(expanded ? 'Hide assessment' : '✓ View assessment'),
                  )
                else
                  const Text('No assessment submitted', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
              ],
            ),
            if (expanded && booking.assessmentFormId != null) ...[
              const Divider(height: 24),
              if (assessment == null)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 8),
                  child: Center(child: CircularProgressIndicator()),
                )
              else ...[
                _AssessmentField('Problem area', assessment!['bodyArea'] as String?),
                _AssessmentField('Their story', assessment!['presentingComplaint'] as String?),
                _AssessmentField('Pain right now', '${assessment!['painScore'] ?? '—'}/10'),
                _AssessmentField('Getting in the way of', assessment!['functionalImpact'] as String?),
                _AssessmentField('Anything we should know', assessment!['medicalHistory'] as String?),
                _AssessmentField(
                  'Emergency contact',
                  '${assessment!['emergencyContactName'] ?? '—'}'
                      '${(assessment!['emergencyContactPhone'] as String?)?.isNotEmpty == true ? ' · ${assessment!['emergencyContactPhone']}' : ''}',
                ),
                if (_hasUrgentRedFlags)
                  const Padding(
                    padding: EdgeInsets.only(top: 6),
                    child: Text(
                      '⚠ Safety flag selected — review before the session.',
                      style: TextStyle(color: Colors.red, fontWeight: FontWeight.w700),
                    ),
                  ),
              ],
            ],
          ],
        ),
      ),
    );
  }
}

class _AssessmentField extends StatelessWidget {
  const _AssessmentField(this.label, this.value);

  final String label;
  final String? value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: RichText(
        text: TextSpan(
          style: DefaultTextStyle.of(context).style,
          children: [
            TextSpan(text: '$label: ', style: const TextStyle(fontWeight: FontWeight.w700)),
            TextSpan(text: (value == null || value!.isEmpty) ? '—' : value),
          ],
        ),
      ),
    );
  }
}
