import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions are only configured for Android and iOS in this mobile app.',
        );
    }
  }

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
