import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../core/widgets/avatar_widget.dart';
import 'appointments_repository.dart';
import 'booking_model.dart';

class AppointmentDetailScreen extends StatefulWidget {
  const AppointmentDetailScreen({super.key, required this.bookingId});

  final String bookingId;

  @override
  State<AppointmentDetailScreen> createState() => _AppointmentDetailScreenState();
}

class _AppointmentDetailScreenState extends State<AppointmentDetailScreen> {
  final _repo = AppointmentsRepository();
  late Future<(BookingRecord?, SessionSummary?)> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<(BookingRecord?, SessionSummary?)> _load() async {
    final booking = await _repo.getBooking(widget.bookingId);
    final summary = await _repo.getSummary(widget.bookingId);
    return (booking, summary);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Appointment'),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF0C2A38),
        elevation: 0,
      ),
      backgroundColor: const Color(0xFFF0FDFA),
      body: FutureBuilder<(BookingRecord?, SessionSummary?)>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          final (booking, summary) = snap.data ?? (null, null);
          if (booking == null) {
            return const Center(child: Text('Appointment not found'));
          }

          return ListView(
            padding: const EdgeInsets.all(20),
            children: [
              _BookingHeader(booking: booking),
              const SizedBox(height: 20),
              if (summary != null) ...[
                const Text(
                  'Session summary',
                  style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18),
                ),
                const SizedBox(height: 12),
                _SummaryBlock(
                  'What we worked on',
                  summary.workedOn,
                  Icons.medical_services_rounded,
                ),
                const SizedBox(height: 10),
                _SummaryBlock(
                  'Exercises assigned',
                  summary.exercises,
                  Icons.fitness_center_rounded,
                ),
                const SizedBox(height: 10),
                _SummaryBlock(
                  'Next steps & advice',
                  summary.nextSteps,
                  Icons.tips_and_updates_rounded,
                ),
                if (summary.followUpWeeks > 0) ...[
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFFD8F3F9),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.calendar_month_rounded, color: Color(0xFF0891B2)),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            'Follow-up recommended in ${summary.followUpWeeks} week${summary.followUpWeeks > 1 ? "s" : ""}',
                            style: const TextStyle(
                              color: Color(0xFF0E7490),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ] else
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Column(
                    children: [
                      Icon(Icons.hourglass_top_rounded, color: Color(0xFF9ADCEE), size: 36),
                      SizedBox(height: 10),
                      Text(
                        'Summary coming soon',
                        style: TextStyle(fontWeight: FontWeight.w700),
                      ),
                      SizedBox(height: 4),
                      Text(
                        'Your physio will add a summary after your session.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Color(0xFF5E7A84)),
                      ),
                    ],
                  ),
                ),
            ],
          );
        },
      ),
    );
  }
}

class _BookingHeader extends StatelessWidget {
  const _BookingHeader({required this.booking});

  final BookingRecord booking;

  @override
  Widget build(BuildContext context) {
    final fmt = DateFormat('EEEE d MMMM yyyy');
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 12,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          AvatarWidget(
            name: booking.patientName,
            imageUrl: booking.patientAvatarUrl,
            size: 56,
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  booking.patientName,
                  style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18),
                ),
                const SizedBox(height: 4),
                Text(booking.service, style: const TextStyle(color: Color(0xFF5E7A84))),
                Text(
                  fmt.format(booking.sessionDate),
                  style: const TextStyle(
                    color: Color(0xFF0891B2),
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SummaryBlock extends StatelessWidget {
  const _SummaryBlock(this.title, this.body, this.icon);

  final String title;
  final String body;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: const Color(0xFF0891B2)),
              const SizedBox(width: 6),
              Text(
                title,
                style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF0C2A38),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(body, style: const TextStyle(height: 1.55, color: Color(0xFF374151))),
        ],
      ),
    );
  }
}
