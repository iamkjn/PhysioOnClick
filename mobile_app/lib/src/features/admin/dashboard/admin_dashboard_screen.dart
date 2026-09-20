import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';

import '../../../core/app_colors.dart';
import '../bookings/admin_booking_model.dart';
import '../bookings/admin_bookings_screen.dart';
import '../enquiries/admin_enquiries_screen.dart';
import '../invoices/admin_invoices_screen.dart';
import '../recovery/admin_patient_list_screen.dart';

/// Admin's mobile home — mirrors web's `AdminLiveStats`
/// (`components/admin-live-stats.tsx`): live booking/enquiry counts, plus
/// quick links into the sections that don't have their own bottom-nav tab
/// (Invoices) so the whole admin toolkit is one tap away.
class AdminDashboardScreen extends StatelessWidget {
  const AdminDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(title: const Text('Admin dashboard'), automaticallyImplyLeading: false),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
            stream: FirebaseFirestore.instance.collection('bookings').snapshots(),
            builder: (context, bookingsSnap) {
              final bookings = bookingsSnap.data?.docs.map(AdminBooking.fromDoc).toList() ?? const [];
              final completed = bookings.where((b) => b.displayStatus == 'completed').length;
              final upcoming = bookings.where((b) => b.displayStatus == 'upcoming').length;

              return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
                stream: FirebaseFirestore.instance.collection('enquiries').snapshots(),
                builder: (context, enquiriesSnap) {
                  final enquiries = enquiriesSnap.data?.docs ?? const [];
                  final newEnquiries = enquiries.where((d) => (d.data()['status'] as String?) == 'new').length;

                  return Column(
                    children: [
                      _StatCard(
                        eyebrow: 'Bookings',
                        value: '${bookings.length}',
                        primary: true,
                        pills: [
                          if (completed > 0) '$completed completed',
                          if (upcoming > 0) '$upcoming upcoming',
                        ],
                        onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AdminBookingsScreen())),
                      ),
                      const SizedBox(height: 12),
                      _StatCard(
                        eyebrow: 'Enquiries',
                        value: '${enquiries.length}',
                        pills: [if (newEnquiries > 0) '$newEnquiries new'],
                        onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AdminEnquiriesScreen())),
                      ),
                    ],
                  );
                },
              );
            },
          ),
          const SizedBox(height: 24),
          Text('More', style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 12),
          Card(
            child: ListTile(
              leading: const Icon(Icons.receipt_long_rounded, color: AppColors.teal),
              title: const Text('Invoices'),
              subtitle: const Text('Paid bookings and PDF receipts'),
              trailing: const Icon(Icons.chevron_right_rounded),
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AdminInvoicesScreen())),
            ),
          ),
          Card(
            child: ListTile(
              leading: const Icon(Icons.people_alt_rounded, color: AppColors.teal),
              title: const Text('Patients'),
              subtitle: const Text('Recovery, exercises and clinical notes'),
              trailing: const Icon(Icons.chevron_right_rounded),
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AdminPatientListScreen())),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.eyebrow,
    required this.value,
    required this.pills,
    required this.onTap,
    this.primary = false,
  });

  final String eyebrow;
  final String value;
  final List<String> pills;
  final VoidCallback onTap;
  final bool primary;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(20),
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: primary ? const LinearGradient(colors: [AppColors.teal, AppColors.tealDark]) : null,
          color: primary ? null : AppColors.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: primary ? AppColors.tealDark : AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              eyebrow,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.5,
                color: primary ? Colors.white70 : AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              value,
              style: TextStyle(fontSize: 40, fontWeight: FontWeight.w800, color: primary ? Colors.white : AppColors.navy),
            ),
            if (pills.isNotEmpty) ...[
              const SizedBox(height: 8),
              Wrap(
                spacing: 6,
                children: pills.map((p) {
                  return Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: primary ? Colors.white.withValues(alpha: 0.18) : AppColors.tealLight,
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      p,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: primary ? Colors.white : AppColors.teal,
                      ),
                    ),
                  );
                }).toList(),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
