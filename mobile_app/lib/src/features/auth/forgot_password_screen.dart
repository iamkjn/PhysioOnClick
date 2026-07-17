import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '../../core/validators.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key, this.initialEmail = ''});

  final String initialEmail;

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen>
    with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _emailCtrl;

  bool _loading = false;
  bool _sent = false;
  String? _error;

  late final AnimationController _successCtrl;
  late final Animation<double> _successScale;
  late final Animation<double> _successFade;

  @override
  void initState() {
    super.initState();
    _emailCtrl = TextEditingController(text: widget.initialEmail);
    _successCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );
    _successScale = Tween(begin: 0.6, end: 1.0).animate(
      CurvedAnimation(parent: _successCtrl, curve: Curves.elasticOut),
    );
    _successFade = CurvedAnimation(parent: _successCtrl, curve: Curves.easeOut);
  }

  @override
  void dispose() {
    _emailCtrl.dispose();
    _successCtrl.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    if (!_formKey.currentState!.validate()) return;
    FocusScope.of(context).unfocus();
    setState(() { _loading = true; _error = null; });

    try {
      await FirebaseAuth.instance.sendPasswordResetEmail(
        email: _emailCtrl.text.trim(),
      );
      if (mounted) {
        setState(() { _loading = false; _sent = true; });
        _successCtrl.forward();
      }
    } on FirebaseAuthException catch (e) {
      String msg;
      switch (e.code) {
        case 'user-not-found':
        case 'invalid-email':
          msg = 'No account found with that email address.';
          break;
        case 'network-request-failed':
          msg = 'No internet connection. Please check and try again.';
          break;
        default:
          msg = e.message ?? 'Failed to send reset email. Please try again.';
      }
      if (mounted) setState(() { _loading = false; _error = msg; });
    } catch (_) {
      if (mounted) setState(() { _loading = false; _error = 'Something went wrong. Please try again.'; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
          onPressed: () => Navigator.of(context).pop(),
          tooltip: 'Back',
        ),
      ),
      body: SafeArea(
        child: GestureDetector(
          onTap: () => FocusScope.of(context).unfocus(),
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(28, 8, 28, 40),
            child: _sent ? _SuccessView(email: _emailCtrl.text.trim(), scale: _successScale, fade: _successFade) : _FormView(
              theme: theme,
              formKey: _formKey,
              emailCtrl: _emailCtrl,
              loading: _loading,
              error: _error,
              onSend: _send,
              onErrorClear: () {
                if (_error != null && mounted) setState(() => _error = null);
              },
            ),
          ),
        ),
      ),
    );
  }
}

class _FormView extends StatelessWidget {
  const _FormView({
    required this.theme,
    required this.formKey,
    required this.emailCtrl,
    required this.loading,
    required this.error,
    required this.onSend,
    required this.onErrorClear,
  });

  final ThemeData theme;
  final GlobalKey<FormState> formKey;
  final TextEditingController emailCtrl;
  final bool loading;
  final String? error;
  final VoidCallback onSend;
  final VoidCallback onErrorClear;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Icon header
        Container(
          width: 64,
          height: 64,
          decoration: BoxDecoration(
            color: const Color(0xFFD8F3F9),
            borderRadius: BorderRadius.circular(20),
          ),
          child: const Icon(
            Icons.lock_reset_rounded,
            color: Color(0xFF0891B2),
            size: 32,
          ),
        ),
        const SizedBox(height: 24),

        Text('Reset password', style: theme.textTheme.headlineMedium),
        const SizedBox(height: 8),
        Text(
          "Enter the email you signed up with and we'll send you a link to reset your password.",
          style: theme.textTheme.bodyLarge,
        ),
        const SizedBox(height: 32),

        Form(
          key: formKey,
          child: TextFormField(
            controller: emailCtrl,
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.done,
            autocorrect: false,
            maxLength: 254,
            buildCounter: (
              _, {
              required int currentLength,
              required int? maxLength,
              required bool isFocused,
            }) => null,
            onChanged: (_) => onErrorClear(),
            onFieldSubmitted: (_) => onSend(),
            decoration: const InputDecoration(
              labelText: 'Email address',
              prefixIcon: Icon(Icons.email_outlined, size: 20),
            ),
            validator: Validators.email,
          ),
        ),

        if (error != null) ...[
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: const Color(0xFFFEF2F2),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFFCA5A5)),
            ),
            child: Row(
              children: [
                const Icon(Icons.error_outline_rounded, color: Color(0xFFDC2626), size: 18),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    error!,
                    style: const TextStyle(
                      color: Color(0xFF991B1B),
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],

        const SizedBox(height: 24),

        ElevatedButton(
          onPressed: loading ? null : onSend,
          child: loading
              ? const SizedBox(
                  height: 22,
                  width: 22,
                  child: CircularProgressIndicator(
                    strokeWidth: 2.5,
                    color: Colors.white,
                  ),
                )
              : const Text('Send reset link'),
        ),
      ],
    );
  }
}

class _SuccessView extends StatelessWidget {
  const _SuccessView({
    required this.email,
    required this.scale,
    required this.fade,
  });

  final String email;
  final Animation<double> scale;
  final Animation<double> fade;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return FadeTransition(
      opacity: fade,
      child: ScaleTransition(
        scale: scale,
        child: Column(
          children: [
            const SizedBox(height: 48),
            Container(
              width: 88,
              height: 88,
              decoration: BoxDecoration(
                color: const Color(0xFFDCFCE7),
                borderRadius: BorderRadius.circular(999),
              ),
              child: const Icon(
                Icons.mark_email_read_rounded,
                color: Color(0xFF16A34A),
                size: 44,
              ),
            ),
            const SizedBox(height: 28),
            Text(
              'Check your inbox',
              style: theme.textTheme.headlineMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Text(
              "We've sent a password reset link to",
              textAlign: TextAlign.center,
              style: theme.textTheme.bodyLarge,
            ),
            const SizedBox(height: 4),
            Text(
              email,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Color(0xFF0891B2),
                fontWeight: FontWeight.w700,
                fontSize: 15,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              "Didn't get it? Check your spam folder or go back to try again.",
              textAlign: TextAlign.center,
              style: theme.textTheme.bodyMedium,
            ),
            const SizedBox(height: 40),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text('Back to sign in'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
