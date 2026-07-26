import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';

import 'src/app.dart';
import 'src/core/analytics/analytics_service.dart';
import 'src/core/firebase/firebase_bootstrap.dart';
import 'src/core/firebase/patient_account_service.dart';

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Background messages are handled when the user taps the notification.
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await FirebaseBootstrap.initialize();
    await Analytics.initialize();
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
    final messaging = FirebaseMessaging.instance;
    await messaging.requestPermission(alert: true, badge: true, sound: true);
    FirebaseAuth.instance.authStateChanges().listen((user) async {
      // Tie analytics events to the signed-in user (UID only, never PII).
      Analytics.setUser(user?.uid);
      if (user != null) {
        PatientAccountService.ensurePatientRecord(user);
        final token = await messaging.getToken();
        if (token != null) {
          await FirebaseFirestore.instance
              .doc('users/${user.uid}')
              .set({'fcmToken': token}, SetOptions(merge: true));
        }
      }
    });
  } catch (_) {
    // Firebase unavailable (e.g. web preview without registered web app) — continue.
  }
  runApp(const PhysioOnClickMobileApp());
}
