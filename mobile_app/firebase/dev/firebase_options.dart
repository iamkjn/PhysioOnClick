import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) return web;
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions are not configured for this platform.',
        );
    }
  }

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyCphx8G8AAcuG_lrTyfTpZbiqW7E82s6OQ',
    appId: '1:223916276926:web:124a98bd058b72e0b2b2ef',
    messagingSenderId: '223916276926',
    projectId: 'physioonclick-dev',
    storageBucket: 'physioonclick-dev.firebasestorage.app',
    authDomain: 'physioonclick-dev.firebaseapp.com',
    measurementId: 'G-VWY5J78DDS',
  );

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyC0_2Sb2Zl7mVYCEVaOGfTBIYpmA0LvAp0',
    appId: '1:223916276926:android:3c9659c72194fc96b2b2ef',
    messagingSenderId: '223916276926',
    projectId: 'physioonclick-dev',
    storageBucket: 'physioonclick-dev.firebasestorage.app',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyDyoYUTT5xnAAfrp8cqf65i2WDKc7k9aS0',
    appId: '1:223916276926:ios:7e6776d45ad8dd36b2b2ef',
    messagingSenderId: '223916276926',
    projectId: 'physioonclick-dev',
    storageBucket: 'physioonclick-dev.firebasestorage.app',
    iosBundleId: 'com.iamkjn.physioonclick',
  );
}
