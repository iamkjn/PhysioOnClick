import 'dart:convert';
import 'dart:math';

import 'package:crypto/crypto.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';

import '../../core/firebase/patient_account_service.dart';
import '../../core/validators.dart';

const _googleWebClientId = '119591358761-4ojpfo2n6gpjkuoh0ljis9d52ob35o3d.apps.googleusercontent.com';

class AuthSheet extends StatefulWidget {
  const AuthSheet({super.key});

  @override
  State<AuthSheet> createState() => _AuthSheetState();
}

class _AuthSheetState extends State<AuthSheet> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  bool isRegisterMode = false;
  bool isSubmitting = false;
  String? message;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  String _authMessage(FirebaseAuthException error) {
    switch (error.code) {
      case 'invalid-credential':
      case 'wrong-password':
      case 'user-not-found':
        return 'The email or password looks incorrect.';
      case 'email-already-in-use':
        return 'That email is already linked to an account.';
      case 'invalid-email':
        return 'Please enter a valid email address.';
      case 'weak-password':
        return 'Use a stronger password with at least 6 characters.';
      case 'network-request-failed':
        return 'Network connection failed. Please check your internet and try again.';
      case 'operation-not-allowed':
        return isRegisterMode
            ? 'Email/password sign-up is not enabled in Firebase yet.'
            : 'This sign-in method is not enabled in Firebase yet.';
      default:
        return error.message ?? 'Authentication failed. Please try again.';
    }
  }

  String _generalAuthMessage(Object error) {
    final text = error.toString();

    if (text.contains('ApiException: 10') || text.contains('DEVELOPER_ERROR')) {
      return 'Google sign-in is not fully configured yet. Add the Android SHA fingerprints in Firebase and download a fresh google-services.json.';
    }

    if (text.contains('sign_in_failed')) {
      return 'Google sign-in failed. Please make sure Google sign-in is enabled in Firebase Authentication.';
    }

    if (text.contains('network')) {
      return 'Network connection failed. Please check your internet and try again.';
    }

    return 'We could not complete sign-in right now.';
  }

  Future<void> _runAuthAction(Future<void> Function() action) async {
    FocusScope.of(context).unfocus();

    setState(() {
      isSubmitting = true;
      message = null;
    });

    try {
      await action();
      if (mounted) {
        setState(() {
          message = null;
        });
      }
    } on FirebaseAuthException catch (error) {
      if (mounted) {
        setState(() {
          message = _authMessage(error);
        });
      }
    } catch (error) {
      if (mounted) {
        setState(() {
          message = _generalAuthMessage(error);
        });
      }
    } finally {
      if (mounted) {
        setState(() => isSubmitting = false);
      }
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    await _runAuthAction(() async {
      if (isRegisterMode) {
        final credential = await FirebaseAuth.instance.createUserWithEmailAndPassword(
          email: _emailController.text.trim(),
          password: _passwordController.text,
        );

        await credential.user?.updateDisplayName(_nameController.text.trim());
        if (credential.user != null) {
          await PatientAccountService.ensurePatientRecord(
            credential.user!,
            preferredName: _nameController.text.trim(),
            authProvider: 'password',
          );
        }
      } else {
        final credential = await FirebaseAuth.instance.signInWithEmailAndPassword(
          email: _emailController.text.trim(),
          password: _passwordController.text,
        );

        if (credential.user != null) {
          await PatientAccountService.ensurePatientRecord(
            credential.user!,
            authProvider: 'password',
          );
        }
      }
    });
  }

  Future<void> _signInWithGoogle() async {
    await _runAuthAction(() async {
      final googleUser = await GoogleSignIn(
        serverClientId: _googleWebClientId,
      ).signIn();

      if (googleUser == null) {
        return;
      }

      final googleAuth = await googleUser.authentication;
      final credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );

      final userCredential = await FirebaseAuth.instance.signInWithCredential(credential);
      if (userCredential.user != null) {
        await PatientAccountService.ensurePatientRecord(
          userCredential.user!,
          authProvider: 'google.com',
        );
      }
    });
  }

  String _generateNonce([int length = 32]) {
    const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._';
    final random = Random.secure();
    return List.generate(length, (_) => charset[random.nextInt(charset.length)]).join();
  }

  String _sha256OfString(String input) {
    final bytes = utf8.encode(input);
    return sha256.convert(bytes).toString();
  }

  Future<void> _signInWithApple() async {
    await _runAuthAction(() async {
      final rawNonce = _generateNonce();
      final hashedNonce = _sha256OfString(rawNonce);

      final appleCredential = await SignInWithApple.getAppleIDCredential(
        scopes: const [
          AppleIDAuthorizationScopes.email,
          AppleIDAuthorizationScopes.fullName,
        ],
        nonce: hashedNonce,
      );

      final oauthCredential = OAuthProvider('apple.com').credential(
        idToken: appleCredential.identityToken,
        rawNonce: rawNonce,
      );

      final userCredential = await FirebaseAuth.instance.signInWithCredential(oauthCredential);

      final firstName = appleCredential.givenName?.trim() ?? '';
      final lastName = appleCredential.familyName?.trim() ?? '';
      final displayName = '$firstName $lastName'.trim();

      if (displayName.isNotEmpty) {
        await userCredential.user?.updateDisplayName(displayName);
      }

      if (userCredential.user != null) {
        await PatientAccountService.ensurePatientRecord(
          userCredential.user!,
          preferredName: displayName,
          authProvider: 'apple.com',
        );
      }
    });
  }

  Future<void> _sendPasswordReset() async {
    final email = _emailController.text.trim();

    final err = Validators.email(email);
    if (err != null) {
      setState(() {
        message = 'Enter your email above first, then tap reset password.';
      });
      return;
    }

    await _runAuthAction(() async {
      await FirebaseAuth.instance.sendPasswordResetEmail(email: email);
      if (mounted) {
        setState(() {
          message = 'Password reset email sent to $email';
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                isRegisterMode ? 'Create your account' : 'Sign in to continue',
                style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 8),
              Text(
                'Use the same email you want to use for bookings, rehab updates and secure uploads.',
                style: theme.textTheme.bodyMedium,
              ),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: isSubmitting ? null : _signInWithGoogle,
                icon: const Icon(Icons.login_rounded),
                label: const Text('Continue with Google'),
              ),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: isSubmitting ? null : _signInWithApple,
                icon: const Icon(Icons.apple_rounded),
                label: const Text('Continue with Apple'),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  const Expanded(child: Divider()),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 10),
                    child: Text(
                      'or use email',
                      style: theme.textTheme.bodyMedium,
                    ),
                  ),
                  const Expanded(child: Divider()),
                ],
              ),
              const SizedBox(height: 16),
              if (isRegisterMode) ...[
                TextFormField(
                  controller: _nameController,
                  decoration: const InputDecoration(labelText: 'Full name'),
                  textInputAction: TextInputAction.next,
                  validator: (value) => isRegisterMode ? Validators.name(value) : null,
                ),
                const SizedBox(height: 12),
              ],
              TextFormField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                textInputAction: TextInputAction.next,
                decoration: const InputDecoration(labelText: 'Email'),
                validator: Validators.email,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _passwordController,
                obscureText: true,
                decoration: const InputDecoration(labelText: 'Password'),
                validator: Validators.password,
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: isSubmitting ? null : _submit,
                child: Text(
                  isSubmitting
                      ? 'Please wait...'
                      : isRegisterMode
                          ? 'Create account'
                          : 'Sign in',
                ),
              ),
              const SizedBox(height: 8),
              if (!isRegisterMode)
                TextButton(
                  onPressed: isSubmitting ? null : _sendPasswordReset,
                  child: const Text('Forgot password?'),
                ),
              TextButton(
                onPressed: isSubmitting
                    ? null
                    : () => setState(() {
                          isRegisterMode = !isRegisterMode;
                          message = null;
                        }),
                child: Text(
                  isRegisterMode ? 'Already have an account? Sign in' : 'Need an account? Create one',
                ),
              ),
              if (message != null) ...[
                const SizedBox(height: 8),
                Text(
                  message!,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: message!.contains('sent')
                        ? const Color(0xFF2380C8)
                        : const Color(0xFF9C3F27),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
