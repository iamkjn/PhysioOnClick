import 'package:flutter/foundation.dart';

/// Base URL for the PhysioOnClick Next.js backend.
/// Flutter web uses localhost; Android emulator uses 10.0.2.2.
/// In production this should point to the deployed domain.
const String kApiBase = kIsWeb
    ? 'http://localhost:3000'
    : 'http://10.0.2.2:3000';
