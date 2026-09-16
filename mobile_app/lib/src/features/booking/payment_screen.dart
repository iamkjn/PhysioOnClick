import 'dart:async';
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../../core/app_colors.dart';
import '../../core/page_transitions.dart';
import 'checkout_repository.dart';
import 'booking_confirmation_screen.dart';

/// Extracts the Stripe `session_id` query param from the web app's
/// hardcoded success URL (`{site}/book/success?session_id=...`).
/// Returns null for any other URL (including Stripe's own checkout pages).
String? extractSessionId(Uri uri) {
  if (!uri.path.contains('/book/success')) return null;
  return uri.queryParameters['session_id'];
}

/// Whether [uri] is the web app's hardcoded Stripe-cancel redirect
/// (`{site}/book?cancelled=1`) rather than `/book/success` or any other page.
bool isCancelUrl(Uri uri) {
  if (uri.path.contains('/book/success')) return false;
  if (!uri.path.contains('/book')) return false;
  return uri.queryParameters['cancelled'] == '1';
}

class PaymentScreen extends StatefulWidget {
  final String checkoutUrl;
  const PaymentScreen({required this.checkoutUrl, super.key});

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  late final WebViewController _controller;
  bool _loading = true;
  bool _handledTerminal = false;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(NavigationDelegate(
        onPageStarted: (_) {
          if (mounted) setState(() => _loading = true);
        },
        onPageFinished: (_) {
          if (mounted) setState(() => _loading = false);
        },
        onNavigationRequest: (request) {
          final uri = Uri.parse(request.url);
          final sessionId = extractSessionId(uri);
          if (sessionId != null) {
            if (!_handledTerminal) {
              _handledTerminal = true;
              _startPolling(sessionId);
            }
            return NavigationDecision.prevent;
          }
          if (isCancelUrl(uri)) {
            if (!_handledTerminal) {
              _handledTerminal = true;
              if (mounted) Navigator.pop(context);
            }
            return NavigationDecision.prevent;
          }
          return NavigationDecision.navigate;
        },
      ))
      ..loadRequest(Uri.parse(widget.checkoutUrl));
  }

  Future<void> _startPolling(String sessionId) async {
    final repo = CheckoutRepository();
    for (var attempt = 0; attempt < 10; attempt++) {
      try {
        final status = await repo.pollCheckoutStatus(sessionId);
        if (status.status == 'paid' ||
            status.status == 'slot_unavailable' ||
            status.status == 'booking_failed') {
          if (!mounted) return;
          Navigator.pushReplacement(
            context,
            PhysioPageRoute(builder: (_) => BookingConfirmationScreen(status: status)),
          );
          return;
        }
      } catch (_) {
        // keep polling — a transient failure shouldn't abort the sequence
      }
      await Future.delayed(const Duration(milliseconds: 2000));
    }
    if (!mounted) return;
    Navigator.pushReplacement(
      context,
      PhysioPageRoute(
        builder: (_) => const BookingConfirmationScreen(
          status: CheckoutStatus(status: 'processing'),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(title: const Text('Payment')),
      body: Stack(
        children: [
          WebViewWidget(controller: _controller),
          if (_loading) const Center(child: CircularProgressIndicator()),
        ],
      ),
    );
  }
}
