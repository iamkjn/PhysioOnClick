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

  // Web uses the same Firebase project; register a Web app in the
  // Firebase console and replace the appId + apiKey with web-specific values.
  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyBdmEnOoVjsuvZ2gRhZK8HUei-7fitv-OQ',
    appId: '1:119591358761:web:000000000000000000000000',
    messagingSenderId: '119591358761',
    projectId: 'physioonclick',
    storageBucket: 'physioonclick.firebasestorage.app',
    authDomain: 'physioonclick.firebaseapp.com',
  );

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyBdmEnOoVjsuvZ2gRhZK8HUei-7fitv-OQ',
    appId: '1:119591358761:android:fd98d96c7a5770d6baa738',
    messagingSenderId: '119591358761',
    projectId: 'physioonclick',
    storageBucket: 'physioonclick.firebasestorage.app',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyBOOtjri-M5t2JDvhf1Ho1kPrDRJaRGDco',
    appId: '1:119591358761:ios:9cb54f3176ee84c2baa738',
    messagingSenderId: '119591358761',
    projectId: 'physioonclick',
    storageBucket: 'physioonclick.firebasestorage.app',
    iosBundleId: 'com.physioonclick.mobileApp',
  );
}
