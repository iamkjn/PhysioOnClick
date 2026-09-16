import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/src/features/booking/payment_screen.dart';
import 'package:webview_flutter_platform_interface/webview_flutter_platform_interface.dart';

/// Minimal no-op WebView platform implementation so widget tests can pump a
/// [PaymentScreen] without a real Android/iOS WebView plugin registered.
class _FakeWebViewPlatform extends WebViewPlatform {
  @override
  PlatformWebViewController createPlatformWebViewController(
    PlatformWebViewControllerCreationParams params,
  ) =>
      _FakeWebViewController(params);

  @override
  PlatformWebViewWidget createPlatformWebViewWidget(
    PlatformWebViewWidgetCreationParams params,
  ) =>
      _FakeWebViewWidget(params);

  @override
  PlatformNavigationDelegate createPlatformNavigationDelegate(
    PlatformNavigationDelegateCreationParams params,
  ) =>
      _FakeNavigationDelegate(params);
}

class _FakeWebViewController extends PlatformWebViewController {
  _FakeWebViewController(super.params) : super.implementation();

  @override
  Future<void> loadRequest(LoadRequestParams params) async {}

  @override
  Future<void> setJavaScriptMode(JavaScriptMode javaScriptMode) async {}

  @override
  Future<void> setPlatformNavigationDelegate(
    PlatformNavigationDelegate handler,
  ) async {}
}

class _FakeNavigationDelegate extends PlatformNavigationDelegate {
  _FakeNavigationDelegate(super.params) : super.implementation();

  @override
  Future<void> setOnPageStarted(PageEventCallback onPageStarted) async {}

  @override
  Future<void> setOnPageFinished(PageEventCallback onPageFinished) async {}

  @override
  Future<void> setOnNavigationRequest(
    NavigationRequestCallback onNavigationRequest,
  ) async {}
}

class _FakeWebViewWidget extends PlatformWebViewWidget {
  _FakeWebViewWidget(super.params) : super.implementation();

  @override
  Widget build(BuildContext context) => const SizedBox.shrink();
}

void main() {
  setUpAll(() {
    WebViewPlatform.instance = _FakeWebViewPlatform();
  });

  testWidgets('shows a loading indicator while the checkout page loads', (tester) async {
    await tester.pumpWidget(const MaterialApp(
      home: PaymentScreen(checkoutUrl: 'https://checkout.stripe.com/test'),
    ));
    await tester.pump();
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
  });

  testWidgets('extracts session_id from a success URL', (tester) async {
    final sessionId = extractSessionId(
      Uri.parse('https://physioonclick.com/book/success?session_id=sess_abc123'),
    );
    expect(sessionId, 'sess_abc123');
  });

  testWidgets('extractSessionId returns null for non-success URLs', (tester) async {
    final sessionId = extractSessionId(Uri.parse('https://checkout.stripe.com/pay/cs_test'));
    expect(sessionId, isNull);
  });

  testWidgets('isCancelUrl recognizes the web app\'s cancel redirect', (tester) async {
    expect(
      isCancelUrl(Uri.parse('https://physioonclick.com/book?cancelled=1')),
      isTrue,
    );
  });

  testWidgets('isCancelUrl returns false for the success URL', (tester) async {
    expect(
      isCancelUrl(Uri.parse('https://physioonclick.com/book/success?session_id=sess_abc123')),
      isFalse,
    );
  });

  testWidgets('isCancelUrl returns false for unrelated URLs', (tester) async {
    expect(isCancelUrl(Uri.parse('https://checkout.stripe.com/pay/cs_test')), isFalse);
    expect(isCancelUrl(Uri.parse('https://physioonclick.com/book')), isFalse);
  });
}
