import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:intl/intl.dart';

import '../../core/api_client.dart';
import '../../core/app_colors.dart';
import '../../core/widgets/avatar_widget.dart';
import '../../core/widgets/empty_state.dart';
import '../booking/who_is_this_for_screen.dart';
import 'appointment_detail_screen.dart';
import 'appointments_repository.dart';
import 'booking_model.dart';

class AppointmentsScreen extends StatefulWidget {
  const AppointmentsScreen({super.key});

  @override
  State<AppointmentsScreen> createState() => _AppointmentsScreenState();
}

class _AppointmentsScreenState extends State<AppointmentsScreen> {
  @override
  void initState() {
    super.initState();
    _syncCalBookings();
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
      return const Scaffold(body: Center(child: Text('Sign in to view appointments')));
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

          if (all.isEmpty) {
            return EmptyState(
              title: 'No appointments yet',
              body: 'Book your first session with a physio today.',
              icon: Icons.calendar_today_outlined,
              cta: FilledButton(
                onPressed: () {
                  WhoIsThisForScreen.go(context);
                },
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.gold,
                  foregroundColor: Colors.white,
                  minimumSize: const Size(160, 48),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                child: const Text('Book Now'),
              ),
            );
          }

          return ListView(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
            children: [
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
      ),
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
                    style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    booking.service,
                    style: const TextStyle(color: Color(0xFF5E7A84), fontSize: 13),
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
                  ? const Icon(Icons.article_rounded, color: Color(0xFF0891B2), size: 22)
                  : const Icon(
                      Icons.hourglass_top_rounded,
                      color: Color(0xFF9ADCEE),
                      size: 22,
                    )
            else
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
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
