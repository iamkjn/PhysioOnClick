import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../core/app_colors.dart';
import '../widgets/admin_pager.dart';
import 'admin_enquiry_model.dart';

const _statusLabels = {
  'new': 'New',
  'in-progress': 'In progress',
  'resolved': 'Resolved',
};
const _statusColors = {
  'new': Colors.orange,
  'in-progress': AppColors.teal,
  'resolved': Colors.green,
};
const _pageSize = 10;

/// Admin enquiries triage — mirrors web's `AdminEnquiriesTable`
/// (`components/admin-enquiries-table.tsx`): latest contact-form
/// submissions with a status you can advance inline.
class AdminEnquiriesScreen extends StatefulWidget {
  const AdminEnquiriesScreen({super.key});

  @override
  State<AdminEnquiriesScreen> createState() => _AdminEnquiriesScreenState();
}

class _AdminEnquiriesScreenState extends State<AdminEnquiriesScreen> {
  int _page = 1;

  Future<void> _updateStatus(
    BuildContext context,
    AdminEnquiry e,
    String next,
  ) async {
    try {
      await FirebaseFirestore.instance.collection('enquiries').doc(e.id).update(
        {'status': next},
      );
    } catch (_) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text("Couldn't update the status. Please try again."),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(title: const Text('Enquiries')),
      body: StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
        stream:
            FirebaseFirestore.instance
                .collection('enquiries')
                .orderBy('createdAt', descending: true)
                .limit(200)
                .snapshots(),
        builder: (context, snapshot) {
          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator());
          }
          final enquiries =
              snapshot.data!.docs.map(AdminEnquiry.fromDoc).toList();
          if (enquiries.isEmpty) {
            return const Center(child: Text('No enquiries yet.'));
          }

          final pageCount = (enquiries.length / _pageSize).ceil();
          final currentPage = _page.clamp(1, pageCount);
          final paged =
              enquiries
                  .skip((currentPage - 1) * _pageSize)
                  .take(_pageSize)
                  .toList();

          return Column(
            children: [
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: paged.length,
                  itemBuilder: (context, i) {
                    final e = paged[i];
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
                                  child: Text(
                                    e.name.isNotEmpty ? e.name : 'Unnamed',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 4,
                                  ),
                                  decoration: BoxDecoration(
                                    color: (_statusColors[e.status] ??
                                            Colors.grey)
                                        .withValues(alpha: 0.15),
                                    borderRadius: BorderRadius.circular(999),
                                  ),
                                  child: Text(
                                    _statusLabels[e.status] ?? e.status,
                                    style: TextStyle(
                                      color:
                                          _statusColors[e.status] ??
                                          Colors.grey,
                                      fontWeight: FontWeight.w700,
                                      fontSize: 12,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text(
                              e.email,
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.textSecondary,
                              ),
                            ),
                            Text(
                              e.phone,
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.textSecondary,
                              ),
                            ),
                            if (e.service.isNotEmpty) ...[
                              const SizedBox(height: 6),
                              Text(
                                e.service,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                            if (e.message.isNotEmpty) ...[
                              const SizedBox(height: 6),
                              Text(e.message),
                            ],
                            if (e.createdAt != null) ...[
                              const SizedBox(height: 6),
                              Text(
                                DateFormat(
                                  'd MMM yyyy, HH:mm',
                                ).format(e.createdAt!),
                                style: const TextStyle(
                                  fontSize: 11,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                            ],
                            const SizedBox(height: 10),
                            Wrap(
                              spacing: 8,
                              children:
                                  _statusLabels.entries
                                      .where((s) => s.key != e.status)
                                      .map((s) {
                                        return OutlinedButton(
                                          onPressed:
                                              () => _updateStatus(
                                                context,
                                                e,
                                                s.key,
                                              ),
                                          style: OutlinedButton.styleFrom(
                                            minimumSize: Size.zero,
                                            padding: const EdgeInsets.symmetric(
                                              horizontal: 10,
                                              vertical: 6,
                                            ),
                                          ),
                                          child: Text(
                                            'Mark ${s.value.toLowerCase()}',
                                            style: const TextStyle(
                                              fontSize: 12,
                                            ),
                                          ),
                                        );
                                      })
                                      .toList(),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
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
