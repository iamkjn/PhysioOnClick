import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';

import '../../../core/app_colors.dart';
import 'admin_invoice_model.dart';
import 'admin_invoices_repository.dart';

/// Admin invoices list — mirrors `app/admin/invoices` + `listInvoices`
/// (`app/admin/actions.ts`): every paid booking, with its generated PDF
/// invoice shareable from here.
class AdminInvoicesScreen extends StatefulWidget {
  const AdminInvoicesScreen({super.key});

  @override
  State<AdminInvoicesScreen> createState() => _AdminInvoicesScreenState();
}

class _AdminInvoicesScreenState extends State<AdminInvoicesScreen> {
  final _repo = AdminInvoicesRepository();
  late Future<List<AdminInvoiceRow>> _future;
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

  Future<void> _download(AdminInvoiceRow inv) async {
    setState(() => _downloading = inv.invoiceNumber);
    try {
      final bytes = await _repo.downloadPdf(inv.invoiceNumber);
      await Share.shareXFiles([
        XFile.fromData(bytes, mimeType: 'application/pdf', name: '${inv.invoiceNumber}.pdf'),
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
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(title: const Text('Invoices')),
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: FutureBuilder<List<AdminInvoiceRow>>(
          future: _future,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator());
            }
            if (snapshot.hasError) {
              return ListView(
                children: const [
                  SizedBox(height: 120),
                  Center(child: Text('Could not load invoices. Check admin access.')),
                ],
              );
            }
            final invoices = snapshot.data ?? const [];
            if (invoices.isEmpty) {
              return ListView(
                children: const [SizedBox(height: 120), Center(child: Text('No paid invoices yet.'))],
              );
            }
            return ListView.builder(
              padding: const EdgeInsets.all(12),
              itemCount: invoices.length,
              itemBuilder: (context, i) {
                final inv = invoices[i];
                return Card(
                  margin: const EdgeInsets.symmetric(vertical: 6),
                  child: ListTile(
                    title: Text(inv.invoiceNumber, style: const TextStyle(fontWeight: FontWeight.w700)),
                    subtitle: Text('${inv.email}\n${inv.service} · ${inv.paidAt}'),
                    isThreeLine: true,
                    trailing: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(inv.amountLabel, style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.teal)),
                        const SizedBox(height: 4),
                        if (inv.hasPdf)
                          _downloading == inv.invoiceNumber
                              ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                              : IconButton(
                                  icon: const Icon(Icons.share_rounded, size: 20),
                                  onPressed: () => _download(inv),
                                  tooltip: 'Share PDF',
                                )
                        else
                          const Text('No PDF', style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                      ],
                    ),
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }
}
