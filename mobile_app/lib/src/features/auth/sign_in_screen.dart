import 'dart:convert';
import 'dart:math';

import 'package:crypto/crypto.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';

import '../../core/firebase/patient_account_service.dart';
import '../../core/page_transitions.dart';
import '../root/root_shell.dart';
import 'forgot_password_screen.dart';
import 'sign_up_screen.dart';

const _googleWebClientId =
    '119591358761-4ojpfo2n6gpjkuoh0ljis9d52ob35o3d.apps.googleusercontent.com';

class SignInScreen extends StatefulWidget {
  const SignInScreen({super.key});

  @override
  State<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends State<SignInScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();

  bool _passwordVisible = false;
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  void _setError(String msg) {
    if (mounted) setState(() { _error = msg; _loading = false; });
  }

  void _clearError() {
    if (_error != null && mounted) setState(() => _error = null);
  }

  String _friendlyFirebaseError(FirebaseAuthException e) {
    switch (e.code) {
      case 'invalid-credential':
      case 'wrong-password':
      case 'user-not-found':
        return 'Email or password is incorrect.';
      case 'invalid-email':
        return 'Please enter a valid email address.';
      case 'user-disabled':
        return 'This account has been disabled.';
      case 'too-many-requests':
        return 'Too many attempts. Please try again later.';
      case 'network-request-failed':
        return 'No internet connection. Please check and try again.';
      default:
        return e.message ?? 'Sign in failed. Please try again.';
    }
  }

  Future<void> _goHome() async {
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      PhysioFadeRoute(builder: (_) => const RootShell()),
      (_) => false,
    );
  }

  Future<void> _signInWithEmail() async {
    if (!_formKey.currentState!.validate()) return;
    FocusScope.of(context).unfocus();
    setState(() { _loading = true; _error = null; });

    try {
      final cred = await FirebaseAuth.instance.signInWithEmailAndPassword(
        email: _emailCtrl.text.trim(),
        password: _passwordCtrl.text,
      );
      if (cred.user != null) {
        await PatientAccountService.ensurePatientRecord(cred.user!, authProvider: 'password');
      }
      await _goHome();
    } on FirebaseAuthException catch (e) {
      _setError(_friendlyFirebaseError(e));
    } catch (_) {
      _setError('Sign in failed. Please try again.');
    }
  }

  Future<void> _signInWithGoogle() async {
    setState(() { _loading = true; _error = null; });
    try {
      final googleUser = await GoogleSignIn(serverClientId: _googleWebClientId).signIn();
      if (googleUser == null) {
        setState(() => _loading = false);
        return;
      }
      final googleAuth = await googleUser.authentication;
      final credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );
      final result = await FirebaseAuth.instance.signInWithCredential(credential);
      if (result.user != null) {
        await PatientAccountService.ensurePatientRecord(result.user!, authProvider: 'google.com');
      }
      await _goHome();
    } on FirebaseAuthException catch (e) {
      _setError(_friendlyFirebaseError(e));
    } catch (e) {
      final msg = e.toString();
      if (msg.contains('ApiException: 10') || msg.contains('DEVELOPER_ERROR')) {
        _setError('Google sign-in configuration issue. Please use email instead.');
      } else {
        _setError('Google sign-in failed. Please try again.');
      }
    }
  }

  String _nonce([int len = 32]) {
    const cs = '0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._';
    final r = Random.secure();
    return List.generate(len, (_) => cs[r.nextInt(cs.length)]).join();
  }

  Future<void> _signInWithApple() async {
    setState(() { _loading = true; _error = null; });
    try {
      final raw = _nonce();
      final hashed = sha256.convert(utf8.encode(raw)).toString();
      final apple = await SignInWithApple.getAppleIDCredential(
        scopes: [AppleIDAuthorizationScopes.email, AppleIDAuthorizationScopes.fullName],
        nonce: hashed,
      );
      final cred = OAuthProvider('apple.com').credential(
        idToken: apple.identityToken,
        rawNonce: raw,
      );
      final result = await FirebaseAuth.instance.signInWithCredential(cred);
      final display = '${apple.givenName ?? ''} ${apple.familyName ?? ''}'.trim();
      if (display.isNotEmpty) await result.user?.updateDisplayName(display);
      if (result.user != null) {
        await PatientAccountService.ensurePatientRecord(result.user!,
            preferredName: display.isNotEmpty ? display : null,
            authProvider: 'apple.com');
      }
      await _goHome();
    } on FirebaseAuthException catch (e) {
      _setError(_friendlyFirebaseError(e));
    } catch (_) {
      _setError('Apple sign-in failed. Please try again.');
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
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Welcome back',
                  style: theme.textTheme.headlineMedium,
                ),
                const SizedBox(height: 6),
                Text(
                  'Sign in to manage your appointments and rehab programme.',
                  style: theme.textTheme.bodyLarge,
                ),
                const SizedBox(height: 32),

                // Social auth
                _SocialButton(
                  onPressed: _loading ? null : _signInWithGoogle,
                  icon: Icons.login_rounded,
                  label: 'Continue with Google',
                  loading: _loading,
                ),
                const SizedBox(height: 12),
                _SocialButton(
                  onPressed: _loading ? null : _signInWithApple,
                  icon: Icons.apple_rounded,
                  label: 'Continue with Apple',
                  outlined: true,
                  loading: _loading,
                ),

                const SizedBox(height: 28),
                const _Divider(label: 'or sign in with email'),
                const SizedBox(height: 28),

                // Email/password form
                Form(
                  key: _formKey,
                  child: Column(
                    children: [
                      TextFormField(
                        controller: _emailCtrl,
                        keyboardType: TextInputType.emailAddress,
                        textInputAction: TextInputAction.next,
                        autocorrect: false,
                        onChanged: (_) => _clearError(),
                        decoration: const InputDecoration(
                          labelText: 'Email address',
                          prefixIcon: Icon(Icons.email_outlined, size: 20),
                        ),
                        validator: (v) {
                          final e = (v ?? '').trim();
                          if (!e.contains('@') || !e.contains('.')) {
                            return 'Enter a valid email address.';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: _passwordCtrl,
                        obscureText: !_passwordVisible,
                        textInputAction: TextInputAction.done,
                        onChanged: (_) => _clearError(),
                        onFieldSubmitted: (_) => _signInWithEmail(),
                        decoration: InputDecoration(
                          labelText: 'Password',
                          prefixIcon: const Icon(Icons.lock_outline_rounded, size: 20),
                          suffixIcon: IconButton(
                            icon: Icon(
                              _passwordVisible
                                  ? Icons.visibility_off_outlined
                                  : Icons.visibility_outlined,
                              size: 20,
                            ),
                            onPressed: () =>
                                setState(() => _passwordVisible = !_passwordVisible),
                            tooltip: _passwordVisible ? 'Hide password' : 'Show password',
                          ),
                        ),
                        validator: (v) {
                          if ((v ?? '').length < 6) return 'Password must be at least 6 characters.';
                          return null;
                        },
                      ),
                    ],
                  ),
                ),

                // Forgot password
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: _loading
                        ? null
                        : () => Navigator.of(context).push(
                              PhysioPageRoute(
                                builder: (_) => ForgotPasswordScreen(
                                  initialEmail: _emailCtrl.text.trim(),
                                ),
                              ),
                            ),
                    style: TextButton.styleFrom(
                      foregroundColor: const Color(0xFF0891B2),
                      textStyle: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    child: const Text('Forgot password?'),
                  ),
                ),

                // Error banner
                if (_error != null) ...[
                  _ErrorBanner(message: _error!),
                  const SizedBox(height: 12),
                ],

                const SizedBox(height: 8),

                // Submit
                ElevatedButton(
                  onPressed: _loading ? null : _signInWithEmail,
                  child: _loading
                      ? const SizedBox(
                          height: 22,
                          width: 22,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.5,
                            color: Colors.white,
                          ),
                        )
                      : const Text('Sign in'),
                ),

                const SizedBox(height: 28),

                // Switch to sign up
                Center(
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        "New here? ",
                        style: theme.textTheme.bodyMedium,
                      ),
                      GestureDetector(
                        onTap: _loading
                            ? null
                            : () {
                                Navigator.of(context).pushReplacement(
                                  PhysioPageRoute(
                                    builder: (_) => const SignUpScreen(),
                                  ),
                                );
                              },
                        child: const Text(
                          'Create an account',
                          style: TextStyle(
                            color: Color(0xFF0891B2),
                            fontWeight: FontWeight.w700,
                            fontSize: 14,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ─── Shared widgets (private to auth screens) ───────────────────────────────

class _SocialButton extends StatelessWidget {
  const _SocialButton({
    required this.onPressed,
    required this.icon,
    required this.label,
    this.outlined = false,
    this.loading = false,
  });

  final VoidCallback? onPressed;
  final IconData icon;
  final String label;
  final bool outlined;
  final bool loading;

  @override
  Widget build(BuildContext context) {
    if (outlined) {
      return OutlinedButton.icon(
        onPressed: onPressed,
        icon: Icon(icon, size: 20),
        label: Text(label),
        style: OutlinedButton.styleFrom(
          minimumSize: const Size.fromHeight(52),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          side: const BorderSide(color: Color(0xFFC8E8F0)),
          foregroundColor: const Color(0xFF0F2D3A),
        ),
      );
    }
    return ElevatedButton.icon(
      onPressed: onPressed,
      icon: Icon(icon, size: 20),
      label: Text(label),
      style: ElevatedButton.styleFrom(
        minimumSize: const Size.fromHeight(52),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        backgroundColor: const Color(0xFF0F2D3A),
        foregroundColor: Colors.white,
      ),
    );
  }
}

class _Divider extends StatelessWidget {
  const _Divider({required this.label});
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Expanded(child: Divider(color: Color(0xFFC8E8F0))),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14),
          child: Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: Color(0xFF5E7A84),
            ),
          ),
        ),
        const Expanded(child: Divider(color: Color(0xFFC8E8F0))),
      ],
    );
  }
}

class _ErrorBanner extends StatelessWidget {
  const _ErrorBanner({required this.message});
  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
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
              message,
              style: const TextStyle(
                color: Color(0xFF991B1B),
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
