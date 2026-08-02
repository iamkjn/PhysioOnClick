import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:share_plus/share_plus.dart';

import '../../core/widgets/avatar_widget.dart';
import '../../core/widgets/empty_state.dart';
import 'invoice_model.dart';
import 'invoices_repository.dart';

class InvoicesScreen extends StatefulWidget {
  const InvoicesScreen({super.key});

  @override
  State<InvoicesScreen> createState() => _InvoicesScreenState();
}

class _InvoicesScreenState extends State<InvoicesScreen> {
  final _repo = InvoicesRepository();
  late Future<List<Invoice>> _future;
  String? _downloading;

  @override
  void initState() {
    super.initState();
    _future = _repo.fetchInvoices();
  }

  Future<void> _refresh() async {
    setState(() => _future = _repo.fetchInvoices());
    await _future;
  }

  Future<void> _download(Invoice inv) async {
    setState(() => _downloading = inv.invoiceNumber);
    try {
      final bytes = await _repo.downloadPdf(inv.invoiceNumber);
      await Share.shareXFiles([
        XFile.fromData(
          bytes,
          mimeType: 'application/pdf',
          name: '${inv.invoiceNumber}.pdf',
        ),
      ], subject: 'Invoice ${inv.invoiceNumber}');
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not open this invoice. Try again.')),
        );
      }
    } finally {
      if (mounted) setState(() => _downloading = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      return const Scaffold(body: Center(child: Text('Sign in to view invoices')));
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Invoices & Payments'),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF0C2A38),
        elevation: 0,
      ),
      backgroundColor: const Color(0xFFF0FDFA),
      body: FutureBuilder<List<Invoice>>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snap.hasError) {
            return EmptyState(
              title: 'Could not load invoices',
              body: 'Please check your connection and try again.',
              icon: Icons.error_outline,
              cta: FilledButton(
                onPressed: _refresh,
                child: const Text('Retry'),
              ),
            );
          }

          final invoices = snap.data ?? [];
          if (invoices.isEmpty) {
            return const EmptyState(
              title: 'No invoices yet',
              body: 'Receipts for your paid sessions — and those of everyone you '
                  'manage — will appear here.',
              icon: Icons.receipt_long_outlined,
            );
          }

          // Group by the member the session was for.
          final groups = <String, List<Invoice>>{};
          for (final inv in invoices) {
            groups.putIfAbsent(inv.patientName, () => []).add(inv);
          }
          final names = groups.keys.toList();

          return RefreshIndicator(
            onRefresh: _refresh,
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
              children: [
                for (final name in names) ...[
                  _MemberHeader(name: name, count: groups[name]!.length),
                  ...groups[name]!.map(
                    (inv) => _InvoiceTile(
                      invoice: inv,
                      downloading: _downloading == inv.invoiceNumber,
                      onDownload: () => _download(inv),
                    ),
                  ),
                  const SizedBox(height: 14),
                ],
              ],
            ),
          );
        },
      ),
    );
  }
}

class _MemberHeader extends StatelessWidget {
  const _MemberHeader({required this.name, required this.count});

  final String name;
  final int count;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10, top: 4),
      child: Row(
        children: [
          AvatarWidget(name: name, size: 32),
          const SizedBox(width: 10),
          Text(
            name,
            style: const TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 16,
              color: Color(0xFF0C2A38),
            ),
          ),
          const SizedBox(width: 8),
          Text(
            '$count ${count == 1 ? 'invoice' : 'invoices'}',
            style: const TextStyle(fontSize: 13, color: Colors.black54),
          ),
        ],
      ),
    );
  }
}

class _InvoiceTile extends StatelessWidget {
  const _InvoiceTile({
    required this.invoice,
    required this.downloading,
    required this.onDownload,
  });

  final Invoice invoice;
  final bool downloading;
  final VoidCallback onDownload;

  String _formatDate(String? iso) {
    if (iso == null || iso.isEmpty) return '';
    final d = DateTime.tryParse(iso);
    if (d == null) return '';
    return DateFormat('d MMM yyyy').format(d.toLocal());
  }

  @override
  Widget build(BuildContext context) {
    final dateStr = _formatDate(
      invoice.sessionDate?.isNotEmpty == true ? invoice.sessionDate : invoice.paidAt,
    );
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  invoice.serviceLabel.isNotEmpty
                      ? invoice.serviceLabel
                      : (invoice.service.isNotEmpty ? invoice.service : 'Session'),
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 15,
                    color: Color(0xFF0C2A38),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  [
                    if (dateStr.isNotEmpty) dateStr,
                    invoice.invoiceNumber,
                  ].join(' · '),
                  style: const TextStyle(fontSize: 12.5, color: Colors.black54),
                ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          Text(
            invoice.amountLabel,
            style: const TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 15,
              color: Color(0xFF0C2A38),
            ),
          ),
          if (invoice.hasPdf) ...[
            const SizedBox(width: 8),
            downloading
                ? const SizedBox(
                    width: 24,
                    height: 24,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : IconButton(
                    icon: const Icon(Icons.download_rounded),
                    color: const Color(0xFF0891B2),
                    tooltip: 'Download invoice',
                    onPressed: onDownload,
                  ),
          ],
        ],
      ),
    );
  }
}
