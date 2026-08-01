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
    apiKey: 'AIzaSyB_CW6l9VKMCfcu3HHCVNtcy_BGU2TFQ7k',
    appId: '1:816942766820:web:a65bf3927bb1d65f1eaaf1',
    messagingSenderId: '816942766820',
    projectId: 'physioonclick-prod',
    storageBucket: 'physioonclick-prod.firebasestorage.app',
    authDomain: 'physioonclick-prod.firebaseapp.com',
    measurementId: 'G-B40839LTCZ',
  );

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyCQWx2wQIqTPfjIdjAZL42EmOyPJqZDf_c',
    appId: '1:816942766820:android:95983c70aebc6d5d1eaaf1',
    messagingSenderId: '816942766820',
    projectId: 'physioonclick-prod',
    storageBucket: 'physioonclick-prod.firebasestorage.app',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyDkFXsWinZMfTQU4KZEqxo-O025gO3Cjqo',
    appId: '1:816942766820:ios:66d12f425951da971eaaf1',
    messagingSenderId: '816942766820',
    projectId: 'physioonclick-prod',
    storageBucket: 'physioonclick-prod.firebasestorage.app',
    iosBundleId: 'com.iamkjn.physioonclick',
  );
}
