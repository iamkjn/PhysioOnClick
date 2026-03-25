import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import 'src/app.dart';
import 'src/core/firebase/firebase_bootstrap.dart';
import 'src/core/firebase/patient_account_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await FirebaseBootstrap.initialize();
  FirebaseAuth.instance.authStateChanges().listen((user) {
    if (user != null) {
      PatientAccountService.ensurePatientRecord(user);
    }
  });
  runApp(const PhysioOnClickMobileApp());
}
