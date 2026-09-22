# Native Mobile Booking Flow + Web/Mobile Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Flutter mobile app's WebView-based booking screen (which just loads `cal.com/physioonclick`) with a native flow that matches the web app's current order — service → time/details/who-for → assessment → Stripe payment → confirmation — and close the remaining parity gaps (exercise dosage display) so every patient-facing feature behaves the same on web and mobile.

**Architecture:** Mobile stays framework-light (no riverpod/dio/go_router — this codebase deliberately uses plain `StatefulWidget` + `package:http` + `Navigator.push`). The native booking flow is five new/modified screens pushed in sequence with `PhysioPageRoute`, backed by one new `CheckoutRepository` that talks to the *same* Next.js API routes the web app uses (`/api/cal/slots`, `/api/checkout/create`, `/api/checkout/status`). Cal.com booking creation stays 100% server-side (triggered by the Stripe webhook) — mobile never calls `/api/cal/book` (it's a 410-gone stub) and never talks to Cal.com directly for booking creation.

**Tech Stack:** Flutter (`http`, `webview_flutter`, `app_links`, `firebase_auth`, `cloud_firestore`), Next.js API routes (already deployed, unchanged except where a task says otherwise), Stripe Checkout (hosted page, opened in an in-app WebView).

## Global Constraints

- Do not introduce a new state-management package (riverpod/bloc/provider) or routing package (go_router) — follow the existing `StatefulWidget` + `Navigator.push(PhysioPageRoute(...))` convention used throughout `mobile_app/lib/src/features/`.
- All backend calls use `package:http` directly (`http.get`/`http.post` + manual `jsonDecode`), `Authorization: Bearer <FirebaseAuth idToken>`, and an explicit `.timeout(...)` — mirror `mobile_app/lib/src/features/invoices/invoices_repository.dart`.
- Booking creation is pay-first and server-side only. Never call `POST /api/cal/book` (returns 410) from mobile.
- The assessment must be submitted, and its Firestore doc id obtained, **before** checkout is created — `assessmentFormId` is part of the `/api/checkout/create` payload.
- New UI must use `AppColors`/the existing `buildPhysioTheme()` tokens (`mobile_app/lib/src/core/app_colors.dart`, `mobile_app/lib/src/core/theme.dart`) — no new hardcoded hex colors.
- `AppConfig.apiBaseUrl` (`mobile_app/lib/src/core/config.dart`, exported as `kApiBase` in `core/api_client.dart`) is the base URL for every backend call.
- Do not touch or regress the existing Appointments, People/Dependents, Chat, Recovery, Invoices, or Session Summaries features while doing this work — this is additive/replacement scoped strictly to `features/booking/` plus one new dosage-display change in `features/recovery` (or wherever exercise lists render).
- Run `flutter analyze` and `flutter test` (from `mobile_app/`) after each task's implementation step, before committing.

---

## File Structure

**New files:**
- `mobile_app/lib/src/features/booking/models/book_service.dart` — static Dart mirror of `lib/site-data.ts` pricing + `lib/cal-services.ts` catalogue (`BookServiceId`, `ResolvedService`, `allBookServices()`, `bookServiceFor(id)`, `FOCUS_AREAS`).
- `mobile_app/lib/src/features/booking/checkout_repository.dart` — `CheckoutRepository` class: `fetchSlots(...)`, `createCheckoutSession(...)`, `pollCheckoutStatus(...)`.
- `mobile_app/lib/src/features/booking/service_select_screen.dart` — Step 1: pick a `ResolvedService`.
- `mobile_app/lib/src/features/booking/time_details_screen.dart` — Step 2: date/slot picker + who-for (reuses `pendingSelections` write pattern already in `who_is_this_for_screen.dart`) + account details (name/email for guests, or signed-in user).
- `mobile_app/lib/src/features/booking/payment_screen.dart` — Step 4: opens the Stripe Checkout URL from `createCheckoutSession` in a `webview_flutter` view, detects completion, then polls `/api/checkout/status`.
- `mobile_app/lib/src/features/booking/booking_confirmation_screen.dart` — Step 5: shows paid/processing/failed state, links into the existing Appointments feature.
- `mobile_app/test/features/booking/book_service_test.dart`, `checkout_repository_test.dart` — unit tests.

**Modified files:**
- `mobile_app/lib/src/features/booking/booking_screen.dart` — becomes the flow's entry screen: keeps its `_RecentBookingsList`, replaces the WebView `initState` load with a "Book an appointment" CTA that pushes `ServiceSelectScreen`.
- `mobile_app/lib/src/features/booking/booking_record.dart` — deleted; call sites switch to `features/appointments/booking_model.dart`'s `BookingRecord`.
- `mobile_app/lib/src/features/assessment/assessment_model.dart` — fix version constant drift + add `bodyRegions` field (Task 2).
- `mobile_app/lib/src/features/assessment/assessment_screen.dart` — accept an optional `bookingId` (empty string pre-payment) and an `onSubmitted(String formId)` callback so it can be pushed from the new booking flow, in addition to its existing standalone entry points.
- `mobile_app/lib/src/app.dart` — no routing table changes needed (Navigator 1.0, imperative pushes), but the `_openAssessment` post-notification deep-link path must keep working unchanged (Task 8 verifies this).
- `mobile_app/lib/src/features/recovery/` (or wherever the patient exercise list widget lives) — render `dosage` fields (Task 9).

---

### Task 1: Service catalogue Dart mirror

**Files:**
- Create: `mobile_app/lib/src/features/booking/models/book_service.dart`
- Test: `mobile_app/test/features/booking/book_service_test.dart`

**Interfaces:**
- Produces: `enum BookServiceId { initialAssessment, followUp, bundle4, bundle8 }`, `class ResolvedService { final BookServiceId id; final String title; final String duration; final double price; final String description; final String mode; final String calSlug; final int minutes; final int sessions; final List<String> included; const ResolvedService({...}); String get apiId; }`, `List<ResolvedService> allBookServices()`, `ResolvedService bookServiceFor(BookServiceId id)`, `const List<String> kFocusAreas`.

- [ ] **Step 1: Write the failing test**

```dart
// mobile_app/test/features/booking/book_service_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:physioonclick/src/features/booking/models/book_service.dart';

void main() {
  test('allBookServices returns four services with correct api ids', () {
    final services = allBookServices();
    expect(services.length, 4);
    expect(services.map((s) => s.apiId).toSet(), {
      'initial-assessment',
      'follow-up',
      'bundle-4',
      'bundle-8',
    });
  });

  test('bookServiceFor resolves initial-assessment with correct fields', () {
    final svc = bookServiceFor(BookServiceId.initialAssessment);
    expect(svc.apiId, 'initial-assessment');
    expect(svc.calSlug, 'initial-online-assessment');
    expect(svc.minutes, 60);
    expect(svc.sessions, 1);
    expect(svc.price, 50);
  });

  test('bookServiceFor resolves bundle-8 reusing the initial-assessment cal slug', () {
    final svc = bookServiceFor(BookServiceId.bundle8);
    expect(svc.apiId, 'bundle-8');
    expect(svc.calSlug, 'initial-online-assessment');
    expect(svc.sessions, 8);
  });

  test('kFocusAreas matches the web catalogue', () {
    expect(kFocusAreas, [
      'Back & neck',
      'Shoulder',
      'Post-surgery',
      'Sports injury',
      'Neuro',
      'Paediatric',
    ]);
  });
}
```

- [ ] **Step 2: Run test to verify it fails**

Run (from `mobile_app/`): `flutter test test/features/booking/book_service_test.dart`
Expected: FAIL — `Target of URI doesn't exist: 'package:physioonclick/src/features/booking/models/book_service.dart'`

- [ ] **Step 3: Write minimal implementation**

```dart
// mobile_app/lib/src/features/booking/models/book_service.dart

/// Mirrors lib/site-data.ts (pricing) + lib/cal-services.ts (CAL_SERVICES)
/// on the web app. There is no JSON API for this catalogue — keep this
/// file in sync by hand whenever those two web files change.
enum BookServiceId { initialAssessment, followUp, bundle4, bundle8 }

extension BookServiceIdApi on BookServiceId {
  String get apiId => switch (this) {
        BookServiceId.initialAssessment => 'initial-assessment',
        BookServiceId.followUp => 'follow-up',
        BookServiceId.bundle4 => 'bundle-4',
        BookServiceId.bundle8 => 'bundle-8',
      };
}

class ResolvedService {
  final BookServiceId id;
  final String title;
  final String duration;
  final double price;
  final String description;
  final String mode; // "In-person" | "Online" | "Package"
  final String calSlug;
  final int minutes;
  final int sessions;
  final List<String> included;

  const ResolvedService({
    required this.id,
    required this.title,
    required this.duration,
    required this.price,
    required this.description,
    required this.mode,
    required this.calSlug,
    required this.minutes,
    required this.sessions,
    required this.included,
  });

  String get apiId => id.apiId;
}

const List<ResolvedService> _kServices = [
  ResolvedService(
    id: BookServiceId.initialAssessment,
    title: 'Initial Online Assessment',
    duration: '60 min',
    price: 50,
    description: 'A full initial assessment with your physiotherapist, online.',
    mode: 'Online',
    calSlug: 'initial-online-assessment',
    minutes: 60,
    sessions: 1,
    included: [],
  ),
  ResolvedService(
    id: BookServiceId.followUp,
    title: 'Online Follow-Up',
    duration: '30 min',
    price: 40,
    description: 'A focused follow-up session to review your progress.',
    mode: 'Online',
    calSlug: 'online-follow-up',
    minutes: 30,
    sessions: 1,
    included: [],
  ),
  ResolvedService(
    id: BookServiceId.bundle4,
    title: '4-Session Bundle',
    duration: '60 min',
    price: 180,
    description: 'Four online sessions, booked as you go.',
    mode: 'Package',
    calSlug: 'initial-online-assessment',
    minutes: 60,
    sessions: 4,
    included: [],
  ),
  ResolvedService(
    id: BookServiceId.bundle8,
    title: '8-Session Bundle',
    duration: '60 min',
    price: 340,
    description: 'Eight online sessions, booked as you go.',
    mode: 'Package',
    calSlug: 'initial-online-assessment',
    minutes: 60,
    sessions: 8,
    included: [],
  ),
];

List<ResolvedService> allBookServices() => _kServices;

ResolvedService bookServiceFor(BookServiceId id) =>
    _kServices.firstWhere((s) => s.id == id);

const List<String> kFocusAreas = [
  'Back & neck',
  'Shoulder',
  'Post-surgery',
  'Sports injury',
  'Neuro',
  'Paediatric',
];
```

⚠️ Before committing, cross-check `title`, `description`, and `price` for `follow-up`, `bundle-4`, `bundle-8` against the current `pricing` array in `lib/site-data.ts` (this research pass only confirmed exact figures for `initial-assessment`) — copy the live copy/prices verbatim rather than trusting the placeholders above.

- [ ] **Step 4: Run test to verify it passes**

Run: `flutter test test/features/booking/book_service_test.dart`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add mobile_app/lib/src/features/booking/models/book_service.dart mobile_app/test/features/booking/book_service_test.dart
git commit -m "feat(mobile): add static service catalogue mirroring web pricing"
```

---

### Task 2: Fix assessment model drift (version + bodyRegions)

**Files:**
- Modify: `mobile_app/lib/src/features/assessment/assessment_model.dart`
- Test: `mobile_app/test/features/assessment/assessment_model_test.dart` (create if it doesn't exist)

**Interfaces:**
- Consumes: existing `AssessmentInput` class in `assessment_model.dart`.
- Produces: `AssessmentInput` gains `final List<String> bodyRegions;` (default `const []`), and `toFirestore()` emits `'version': kAssessmentFormVersion` where `const kAssessmentFormVersion = '2.0';` (was previously hardcoded `'2026-07-csp-hcpc-v2'`).

- [ ] **Step 1: Write the failing test**

```dart
// mobile_app/test/features/assessment/assessment_model_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:physioonclick/src/features/assessment/assessment_model.dart';

void main() {
  test('toFirestore stamps version 2.0 to match web ASSESSMENT_FORM_VERSION', () {
    final input = AssessmentInput.blank(uid: 'u1', personId: 'p1');
    final data = input.toFirestore();
    expect(data['version'], '2.0');
  });

  test('toFirestore includes bodyRegions', () {
    final input = AssessmentInput.blank(uid: 'u1', personId: 'p1')
        .copyWith(bodyRegions: ['lower-back', 'left-shoulder']);
    final data = input.toFirestore();
    expect(data['bodyRegions'], ['lower-back', 'left-shoulder']);
  });
}
```

(Adjust `AssessmentInput.blank(...)`/`copyWith(...)` constructor names to whatever the existing file actually exposes — read `assessment_model.dart` first and use its real factory/constructor, since this plan was written from a summary, not the full file contents.)

- [ ] **Step 2: Run test to verify it fails**

Run: `flutter test test/features/assessment/assessment_model_test.dart`
Expected: FAIL — first assertion fails (`'2026-07-csp-hcpc-v2'` != `'2.0'`), second fails (`bodyRegions` key missing or field doesn't exist).

- [ ] **Step 3: Write minimal implementation**

In `assessment_model.dart`:
1. Add a top-level constant: `const kAssessmentFormVersion = '2.0';`
2. Add `final List<String> bodyRegions;` to the `AssessmentInput` class fields, default to `const []` in the default constructor and in `copyWith`.
3. In `toFirestore()`, change the hardcoded `'version': '2026-07-csp-hcpc-v2'` line to `'version': kAssessmentFormVersion` and add `'bodyRegions': bodyRegions,` alongside the existing `'bodyArea': bodyArea,` line.

- [ ] **Step 4: Run test to verify it passes**

Run: `flutter test test/features/assessment/assessment_model_test.dart`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add mobile_app/lib/src/features/assessment/assessment_model.dart mobile_app/test/features/assessment/assessment_model_test.dart
git commit -m "fix(mobile): align assessment form version and add bodyRegions field to match web"
```

---

### Task 3: `CheckoutRepository` — slots, create session, poll status

**Files:**
- Create: `mobile_app/lib/src/features/booking/checkout_repository.dart`
- Test: `mobile_app/test/features/booking/checkout_repository_test.dart`

**Interfaces:**
- Consumes: `kApiBase` from `mobile_app/lib/src/core/api_client.dart`, `FirebaseAuth.instance.currentUser` for the bearer token.
- Produces:
```dart
class CheckoutRepository {
  Future<Map<String, List<String>>> fetchSlots({
    required String service, required DateTime start, required DateTime end,
  });
  Future<String> createCheckoutSession({
    required String service, required DateTime start, required String name,
    required String email, String timeZone = 'Europe/London',
    List<String> focusAreas = const [], String? assessmentUid,
    String? assessmentPersonId, String? assessmentFormId,
  }); // returns the Stripe Checkout URL
  Future<CheckoutStatus> pollCheckoutStatus(String sessionId);
}
class CheckoutStatus {
  final String status; // "pending"|"processing"|"paid"|"slot_unavailable"|"booking_failed"
  final String? service; final String? calBookingUid;
  final String? invoiceNumber; final String? paidAt;
  const CheckoutStatus({required this.status, this.service, this.calBookingUid, this.invoiceNumber, this.paidAt});
  factory CheckoutStatus.fromJson(Map<String, dynamic> json);
}
```

- [ ] **Step 1: Write the failing test**

```dart
// mobile_app/test/features/booking/checkout_repository_test.dart
import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:physioonclick/src/features/booking/checkout_repository.dart';

void main() {
  test('fetchSlots parses the slots map from the API response', () async {
    final client = MockClient((request) async {
      expect(request.url.path, '/api/cal/slots');
      expect(request.url.queryParameters['service'], 'initial-assessment');
      return http.Response(
        jsonEncode({'slots': {'2026-09-20': ['2026-09-20T09:00:00.000Z']}}),
        200,
      );
    });
    final repo = CheckoutRepository(httpClient: client, idTokenProvider: () async => 'test-token');
    final slots = await repo.fetchSlots(
      service: 'initial-assessment',
      start: DateTime(2026, 9, 20),
      end: DateTime(2026, 9, 25),
    );
    expect(slots['2026-09-20'], ['2026-09-20T09:00:00.000Z']);
  });

  test('createCheckoutSession returns the Stripe URL on success', () async {
    final client = MockClient((request) async {
      expect(request.url.path, '/api/checkout/create');
      final body = jsonDecode(request.body) as Map<String, dynamic>;
      expect(body['service'], 'follow-up');
      expect(body['email'], 'patient@example.com');
      return http.Response(jsonEncode({'ok': true, 'url': 'https://checkout.stripe.com/session123'}), 200);
    });
    final repo = CheckoutRepository(httpClient: client, idTokenProvider: () async => 'test-token');
    final url = await repo.createCheckoutSession(
      service: 'follow-up',
      start: DateTime.utc(2026, 9, 20, 9),
      name: 'Pat Patient',
      email: 'patient@example.com',
    );
    expect(url, 'https://checkout.stripe.com/session123');
  });

  test('createCheckoutSession throws on ok:false response', () async {
    final client = MockClient((request) async =>
        http.Response(jsonEncode({'ok': false, 'error': 'Slot no longer available'}), 400));
    final repo = CheckoutRepository(httpClient: client, idTokenProvider: () async => 'test-token');
    expect(
      () => repo.createCheckoutSession(
        service: 'follow-up', start: DateTime.now(), name: 'A', email: 'a@b.com',
      ),
      throwsException,
    );
  });

  test('pollCheckoutStatus parses a paid status', () async {
    final client = MockClient((request) async {
      expect(request.url.path, '/api/checkout/status');
      expect(request.url.queryParameters['session_id'], 'session123');
      return http.Response(
        jsonEncode({'status': 'paid', 'calBookingUid': 'abc', 'invoiceNumber': 'INV-1'}),
        200,
      );
    });
    final repo = CheckoutRepository(httpClient: client, idTokenProvider: () async => 'test-token');
    final status = await repo.pollCheckoutStatus('session123');
    expect(status.status, 'paid');
    expect(status.calBookingUid, 'abc');
  });
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `flutter test test/features/booking/checkout_repository_test.dart`
Expected: FAIL — `checkout_repository.dart` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```dart
// mobile_app/lib/src/features/booking/checkout_repository.dart
import 'dart:convert';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:http/http.dart' as http;
import '../../core/api_client.dart';

class CheckoutStatus {
  final String status;
  final String? service;
  final String? calBookingUid;
  final String? invoiceNumber;
  final String? paidAt;

  const CheckoutStatus({
    required this.status,
    this.service,
    this.calBookingUid,
    this.invoiceNumber,
    this.paidAt,
  });

  factory CheckoutStatus.fromJson(Map<String, dynamic> json) => CheckoutStatus(
        status: json['status'] as String,
        service: json['service'] as String?,
        calBookingUid: json['calBookingUid'] as String?,
        invoiceNumber: json['invoiceNumber'] as String?,
        paidAt: json['paidAt'] as String?,
      );
}

typedef IdTokenProvider = Future<String?> Function();

class CheckoutRepository {
  CheckoutRepository({
    http.Client? httpClient,
    IdTokenProvider? idTokenProvider,
  })  : _client = httpClient ?? http.Client(),
        _idTokenProvider =
            idTokenProvider ?? (() => FirebaseAuth.instance.currentUser?.getIdToken());

  final http.Client _client;
  final IdTokenProvider _idTokenProvider;

  Future<Map<String, String>> _authHeaders() async {
    final token = await _idTokenProvider();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  Future<Map<String, List<String>>> fetchSlots({
    required String service,
    required DateTime start,
    required DateTime end,
  }) async {
    String fmt(DateTime d) =>
        '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
    final uri = Uri.parse('$kApiBase/api/cal/slots').replace(queryParameters: {
      'service': service,
      'start': fmt(start),
      'end': fmt(end),
    });
    final res = await _client
        .get(uri, headers: await _authHeaders())
        .timeout(const Duration(seconds: 20));
    if (res.statusCode != 200) {
      throw Exception('Failed to load slots (${res.statusCode})');
    }
    final body = jsonDecode(res.body) as Map<String, dynamic>;
    final slots = (body['slots'] as Map<String, dynamic>? ?? {});
    return slots.map((k, v) => MapEntry(k, (v as List).cast<String>()));
  }

  Future<String> createCheckoutSession({
    required String service,
    required DateTime start,
    required String name,
    required String email,
    String timeZone = 'Europe/London',
    List<String> focusAreas = const [],
    String? assessmentUid,
    String? assessmentPersonId,
    String? assessmentFormId,
  }) async {
    final uri = Uri.parse('$kApiBase/api/checkout/create');
    final res = await _client
        .post(
          uri,
          headers: await _authHeaders(),
          body: jsonEncode({
            'service': service,
            'start': start.toUtc().toIso8601String(),
            'name': name,
            'email': email,
            'timeZone': timeZone,
            if (focusAreas.isNotEmpty) 'focusAreas': focusAreas,
            if (assessmentUid != null) 'assessmentUid': assessmentUid,
            if (assessmentPersonId != null) 'assessmentPersonId': assessmentPersonId,
            if (assessmentFormId != null) 'assessmentFormId': assessmentFormId,
          }),
        )
        .timeout(const Duration(seconds: 20));
    final body = jsonDecode(res.body) as Map<String, dynamic>;
    if (res.statusCode != 200 || body['ok'] != true) {
      throw Exception(body['error'] as String? ?? 'Failed to start checkout (${res.statusCode})');
    }
    return body['url'] as String;
  }

  Future<CheckoutStatus> pollCheckoutStatus(String sessionId) async {
    final uri = Uri.parse('$kApiBase/api/checkout/status')
        .replace(queryParameters: {'session_id': sessionId});
    final res = await _client
        .get(uri, headers: await _authHeaders())
        .timeout(const Duration(seconds: 20));
    if (res.statusCode != 200) {
      throw Exception('Failed to check payment status (${res.statusCode})');
    }
    return CheckoutStatus.fromJson(jsonDecode(res.body) as Map<String, dynamic>);
  }
}
```

Add `http: ^1.2.2` already present; add `import 'package:http/testing.dart';` is test-only via the `http` package's `testing.dart` (no new pubspec dependency needed — `http` ships it).

- [ ] **Step 4: Run test to verify it passes**

Run: `flutter test test/features/booking/checkout_repository_test.dart`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add mobile_app/lib/src/features/booking/checkout_repository.dart mobile_app/test/features/booking/checkout_repository_test.dart
git commit -m "feat(mobile): add CheckoutRepository for slots/checkout/status API calls"
```

---

### Task 4: `ServiceSelectScreen` (flow step 1)

**Files:**
- Create: `mobile_app/lib/src/features/booking/service_select_screen.dart`
- Modify: `mobile_app/lib/src/features/booking/booking_screen.dart`

**Interfaces:**
- Consumes: `allBookServices()` from Task 1.
- Produces: `class ServiceSelectScreen extends StatelessWidget` with `static void go(BuildContext context)` that pushes itself via `PhysioPageRoute`; on tap, pushes `TimeDetailsScreen(service: chosen)` (Task 5 must exist for this to compile — implement this screen's tap handler as a `TODO`-free direct push once Task 5 lands; for this task, stub the destination push with a placeholder route that Task 5 replaces in the same PR sequence, OR implement Tasks 4 and 5 together since they're tightly coupled. **Recommendation: implement Task 5 first, then Task 4's tap handler references it directly** — reorder execution so Task 5 precedes Task 4 if using subagent-driven execution with strict per-task isolation).

- [ ] **Step 1: Write the failing test**

```dart
// mobile_app/test/features/booking/service_select_screen_test.dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:physioonclick/src/features/booking/service_select_screen.dart';

void main() {
  testWidgets('lists all four services with title and price', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: ServiceSelectScreen()));
    await tester.pumpAndSettle();
    expect(find.text('Initial Online Assessment'), findsOneWidget);
    expect(find.text('Online Follow-Up'), findsOneWidget);
    expect(find.textContaining('£50'), findsOneWidget);
  });
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `flutter test test/features/booking/service_select_screen_test.dart`
Expected: FAIL — file doesn't exist.

- [ ] **Step 3: Write minimal implementation**

```dart
// mobile_app/lib/src/features/booking/service_select_screen.dart
import 'package:flutter/material.dart';
import '../../core/app_colors.dart';
import '../../core/page_transitions.dart';
import 'models/book_service.dart';
import 'time_details_screen.dart';

class ServiceSelectScreen extends StatelessWidget {
  const ServiceSelectScreen({super.key});

  static void go(BuildContext context) {
    Navigator.push(context, PhysioPageRoute(builder: (_) => const ServiceSelectScreen()));
  }

  @override
  Widget build(BuildContext context) {
    final services = allBookServices();
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(title: const Text('Book an appointment')),
      body: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: services.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, i) {
          final s = services[i];
          return Card(
            child: ListTile(
              contentPadding: const EdgeInsets.all(16),
              title: Text(s.title, style: Theme.of(context).textTheme.titleMedium),
              subtitle: Text('${s.duration} · £${s.price.toStringAsFixed(0)}'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () {
                Navigator.push(
                  context,
                  PhysioPageRoute(builder: (_) => TimeDetailsScreen(service: s)),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `flutter test test/features/booking/service_select_screen_test.dart`
Expected: PASS (requires Task 5's `TimeDetailsScreen` to exist for the import to resolve — implement Task 5 first per the note above, or create a minimal `TimeDetailsScreen` stub here that Task 5 then fills in).

- [ ] **Step 5: Commit**

```bash
git add mobile_app/lib/src/features/booking/service_select_screen.dart mobile_app/test/features/booking/service_select_screen_test.dart
git commit -m "feat(mobile): add native service selection screen"
```

---

### Task 5: `TimeDetailsScreen` — slots, who-for, account details (flow step 2)

**Files:**
- Create: `mobile_app/lib/src/features/booking/time_details_screen.dart`

**Interfaces:**
- Consumes: `ResolvedService` (Task 1), `CheckoutRepository.fetchSlots` (Task 3), `PeopleRepository.watchDependents(uid)` (existing, from `features/people/`), the existing `pendingSelections/{uid}` Firestore write pattern from `who_is_this_for_screen.dart`.
- Produces: `class TimeDetailsScreen extends StatefulWidget { final ResolvedService service; const TimeDetailsScreen({required this.service, super.key}); }`. On continue, pushes `AssessmentStepScreen` (Task 6) with the chosen `DateTime start`, `String name`, `String email`, selected person info, and `service`.

- [ ] **Step 1: Write the failing test**

```dart
// mobile_app/test/features/booking/time_details_screen_test.dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:physioonclick/src/features/booking/models/book_service.dart';
import 'package:physioonclick/src/features/booking/time_details_screen.dart';

void main() {
  testWidgets('shows the selected service name in the app bar', (tester) async {
    final service = bookServiceFor(BookServiceId.followUp);
    await tester.pumpWidget(MaterialApp(home: TimeDetailsScreen(service: service)));
    await tester.pump();
    expect(find.text('Online Follow-Up'), findsOneWidget);
  });
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `flutter test test/features/booking/time_details_screen_test.dart`
Expected: FAIL — file doesn't exist.

- [ ] **Step 3: Write minimal implementation**

```dart
// mobile_app/lib/src/features/booking/time_details_screen.dart
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import '../../core/app_colors.dart';
import '../../core/page_transitions.dart';
import '../people/people_repository.dart';
import 'checkout_repository.dart';
import 'models/book_service.dart';
import 'assessment_step_screen.dart';

class TimeDetailsScreen extends StatefulWidget {
  final ResolvedService service;
  const TimeDetailsScreen({required this.service, super.key});

  @override
  State<TimeDetailsScreen> createState() => _TimeDetailsScreenState();
}

class _TimeDetailsScreenState extends State<TimeDetailsScreen> {
  final _repo = CheckoutRepository();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  Map<String, List<String>> _slots = {};
  String? _selectedSlotIso;
  bool _loadingSlots = true;
  String? _selectedPersonId; // null = booking for self
  String? _selectedPersonName;

  @override
  void initState() {
    super.initState();
    final user = FirebaseAuth.instance.currentUser;
    if (user != null) {
      _nameController.text = user.displayName ?? '';
      _emailController.text = user.email ?? '';
      _selectedPersonName = user.displayName;
    }
    _loadSlots();
  }

  Future<void> _loadSlots() async {
    final now = DateTime.now();
    final end = now.add(const Duration(days: 21));
    try {
      final slots = await _repo.fetchSlots(
        service: widget.service.apiId,
        start: now,
        end: end,
      );
      if (mounted) setState(() { _slots = slots; _loadingSlots = false; });
    } catch (_) {
      if (mounted) setState(() => _loadingSlots = false);
    }
  }

  Future<void> _writePendingSelectionIfNeeded() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null || _selectedPersonId == null) return;
    // Reuses the same pendingSelections/{uid} write shape as
    // who_is_this_for_screen.dart, so the Cal.com webhook stamps the
    // booking with the right patient — see that file for the exact
    // Firestore call this must mirror.
    await PeopleRepository().writePendingSelection(
      uid: user.uid,
      patientType: 'dependent',
      patientId: _selectedPersonId!,
      patientName: _selectedPersonName ?? '',
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(title: Text(widget.service.title)),
      body: _loadingSlots
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Text('Choose a time', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 12),
                ..._slots.entries.map((entry) => _DaySlots(
                      date: entry.key,
                      isos: entry.value,
                      selected: _selectedSlotIso,
                      onSelect: (iso) => setState(() => _selectedSlotIso = iso),
                    )),
                const SizedBox(height: 24),
                TextField(
                  controller: _nameController,
                  decoration: const InputDecoration(labelText: 'Full name'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _emailController,
                  decoration: const InputDecoration(labelText: 'Email'),
                  keyboardType: TextInputType.emailAddress,
                ),
                const SizedBox(height: 24),
                FilledButton(
                  onPressed: _selectedSlotIso == null
                      ? null
                      : () async {
                          await _writePendingSelectionIfNeeded();
                          if (!context.mounted) return;
                          Navigator.push(
                            context,
                            PhysioPageRoute(
                              builder: (_) => AssessmentStepScreen(
                                service: widget.service,
                                start: DateTime.parse(_selectedSlotIso!),
                                name: _nameController.text.trim(),
                                email: _emailController.text.trim(),
                                personId: _selectedPersonId,
                                personName: _selectedPersonName ?? _nameController.text.trim(),
                              ),
                            ),
                          );
                        },
                  child: const Text('Continue'),
                ),
              ],
            ),
    );
  }
}

class _DaySlots extends StatelessWidget {
  final String date;
  final List<String> isos;
  final String? selected;
  final ValueChanged<String> onSelect;
  const _DaySlots({required this.date, required this.isos, required this.selected, required this.onSelect});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(date, style: Theme.of(context).textTheme.labelLarge),
          Wrap(
            spacing: 8,
            children: isos.map((iso) {
              final time = DateTime.parse(iso).toLocal();
              final label = '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
              return ChoiceChip(
                label: Text(label),
                selected: selected == iso,
                onSelected: (_) => onSelect(iso),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}
```

⚠️ `PeopleRepository().writePendingSelection(...)` is a new method this task must add to `mobile_app/lib/src/features/people/people_repository.dart` if it doesn't already exist — read `who_is_this_for_screen.dart`'s existing inline Firestore write first and extract it into that exact method signature so both screens share one implementation instead of duplicating the write.

- [ ] **Step 4: Run test to verify it passes**

Run: `flutter test test/features/booking/time_details_screen_test.dart`
Expected: PASS (requires `assessment_step_screen.dart` to exist for import resolution — build Task 6 alongside this one, or add a temporary stub file that Task 6 replaces).

- [ ] **Step 5: Commit**

```bash
git add mobile_app/lib/src/features/booking/time_details_screen.dart mobile_app/lib/src/features/people/people_repository.dart mobile_app/test/features/booking/time_details_screen_test.dart
git commit -m "feat(mobile): add native time/slot selection and who-for step"
```

---

### Task 6: Wire the assessment wizard into the booking flow (flow step 3)

**Files:**
- Create: `mobile_app/lib/src/features/booking/assessment_step_screen.dart`
- Modify: `mobile_app/lib/src/features/assessment/assessment_screen.dart`

**Interfaces:**
- Consumes: `AssessmentScreen` (existing, modified to accept `bookingId` + `onSubmitted`), `ResolvedService`, `CheckoutRepository.createCheckoutSession` (Task 3).
- Produces: `class AssessmentStepScreen extends StatelessWidget { final ResolvedService service; final DateTime start; final String name; final String email; final String? personId; final String personName; const AssessmentStepScreen({...}); }`. Pushes `PaymentScreen` (Task 7) once the assessment is submitted and a Stripe URL is obtained.

- [ ] **Step 1: Write the failing test**

```dart
// mobile_app/test/features/booking/assessment_step_screen_test.dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:physioonclick/src/features/booking/assessment_step_screen.dart';
import 'package:physioonclick/src/features/booking/models/book_service.dart';

void main() {
  testWidgets('renders without crashing for a signed-out-style call', (tester) async {
    final service = bookServiceFor(BookServiceId.initialAssessment);
    await tester.pumpWidget(MaterialApp(
      home: AssessmentStepScreen(
        service: service,
        start: DateTime.utc(2026, 9, 20, 9),
        name: 'Pat Patient',
        email: 'pat@example.com',
        personId: null,
        personName: 'Pat Patient',
      ),
    ));
    await tester.pump();
    expect(find.byType(AssessmentStepScreen), findsOneWidget);
  });
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `flutter test test/features/booking/assessment_step_screen_test.dart`
Expected: FAIL — file doesn't exist.

- [ ] **Step 3: Write minimal implementation**

First, modify `assessment_screen.dart`'s constructor to add two optional parameters without breaking its existing standalone call sites (`app.dart`'s `_openAssessment` and `appointment_detail_screen.dart`'s "Complete assessment" button):

```dart
// In assessment_screen.dart — extend the existing constructor, do not remove existing params:
class AssessmentScreen extends StatefulWidget {
  final String uid;
  final String personId;
  // ... existing fields unchanged ...
  final String bookingId; // NEW — defaults to "" for the pre-payment case
  final ValueChanged<String>? onSubmitted; // NEW — formId callback for the booking flow

  const AssessmentScreen({
    required this.uid,
    required this.personId,
    // ... existing required/optional params unchanged ...
    this.bookingId = '',
    this.onSubmitted,
    super.key,
  });
  // ...
}
```

Inside its existing submit handler, after the Firestore write succeeds, add: `if (widget.onSubmitted != null) { widget.onSubmitted!(newFormId); return; }` before whatever navigation/success UI it currently shows (so the booking flow controls what happens next, instead of the standalone "assessment complete" screen).

```dart
// mobile_app/lib/src/features/booking/assessment_step_screen.dart
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import '../../core/page_transitions.dart';
import '../assessment/assessment_screen.dart';
import 'checkout_repository.dart';
import 'models/book_service.dart';
import 'payment_screen.dart';

class AssessmentStepScreen extends StatelessWidget {
  final ResolvedService service;
  final DateTime start;
  final String name;
  final String email;
  final String? personId;
  final String personName;

  const AssessmentStepScreen({
    required this.service,
    required this.start,
    required this.name,
    required this.email,
    required this.personId,
    required this.personName,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    final uid = FirebaseAuth.instance.currentUser?.uid ?? '';
    return AssessmentScreen(
      uid: uid,
      personId: personId ?? uid,
      bookingId: '', // no booking exists yet — pay-first flow
      onSubmitted: (formId) async {
        final repo = CheckoutRepository();
        try {
          final url = await repo.createCheckoutSession(
            service: service.apiId,
            start: start,
            name: name,
            email: email,
            assessmentUid: uid,
            assessmentPersonId: personId ?? uid,
            assessmentFormId: formId,
          );
          if (!context.mounted) return;
          Navigator.pushReplacement(
            context,
            PhysioPageRoute(builder: (_) => PaymentScreen(checkoutUrl: url)),
          );
        } catch (e) {
          if (!context.mounted) return;
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Could not start payment: $e')),
          );
        }
      },
    );
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `flutter test test/features/booking/assessment_step_screen_test.dart`
Expected: PASS (requires `PaymentScreen` from Task 7 — build together or stub).

- [ ] **Step 5: Commit**

```bash
git add mobile_app/lib/src/features/booking/assessment_step_screen.dart mobile_app/lib/src/features/assessment/assessment_screen.dart mobile_app/test/features/booking/assessment_step_screen_test.dart
git commit -m "feat(mobile): wire assessment wizard into booking flow pre-payment"
```

---

### Task 7: `PaymentScreen` — Stripe Checkout WebView + status polling (flow step 4)

**Files:**
- Create: `mobile_app/lib/src/features/booking/payment_screen.dart`

**Interfaces:**
- Consumes: `webview_flutter`'s `WebViewController` (already a dependency), `CheckoutRepository.pollCheckoutStatus` (Task 3), `app_links` package (already a dependency, used elsewhere in `app.dart` for `physioonclick://` deep links).
- Produces: `class PaymentScreen extends StatefulWidget { final String checkoutUrl; const PaymentScreen({required this.checkoutUrl, super.key}); }`. On detecting `session_id` in a navigated URL matching `.../book/success`, extracts it and starts polling; pushes `BookingConfirmationScreen` (Task 8) on `paid`/terminal status.

- [ ] **Step 1: Write the failing test**

```dart
// mobile_app/test/features/booking/payment_screen_test.dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:physioonclick/src/features/booking/payment_screen.dart';

void main() {
  testWidgets('shows a loading indicator while the checkout page loads', (tester) async {
    await tester.pumpWidget(const MaterialApp(
      home: PaymentScreen(checkoutUrl: 'https://checkout.stripe.com/test'),
    ));
    await tester.pump();
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
  });

  testWidgets('extracts session_id from a success URL', (tester) async {
    final sessionId = extractSessionId(
      Uri.parse('https://physioonclick.com/book/success?session_id=sess_abc123'),
    );
    expect(sessionId, 'sess_abc123');
  });

  testWidgets('extractSessionId returns null for non-success URLs', (tester) async {
    final sessionId = extractSessionId(Uri.parse('https://checkout.stripe.com/pay/cs_test'));
    expect(sessionId, isNull);
  });
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `flutter test test/features/booking/payment_screen_test.dart`
Expected: FAIL — file doesn't exist.

- [ ] **Step 3: Write minimal implementation**

```dart
// mobile_app/lib/src/features/booking/payment_screen.dart
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../../core/app_colors.dart';
import '../../core/page_transitions.dart';
import 'checkout_repository.dart';
import 'booking_confirmation_screen.dart';

/// Extracts the Stripe `session_id` query param from the web app's
/// hardcoded success URL (`{site}/book/success?session_id=...`).
/// Returns null for any other URL (including Stripe's own checkout pages).
String? extractSessionId(Uri uri) {
  if (!uri.path.contains('/book/success')) return null;
  return uri.queryParameters['session_id'];
}

class PaymentScreen extends StatefulWidget {
  final String checkoutUrl;
  const PaymentScreen({required this.checkoutUrl, super.key});

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  late final WebViewController _controller;
  bool _loading = true;
  bool _handledSuccess = false;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(NavigationDelegate(
        onPageStarted: (_) => setState(() => _loading = true),
        onPageFinished: (url) {
          setState(() => _loading = false);
          final sessionId = extractSessionId(Uri.parse(url));
          if (sessionId != null && !_handledSuccess) {
            _handledSuccess = true;
            _startPolling(sessionId);
          }
        },
      ))
      ..loadRequest(Uri.parse(widget.checkoutUrl));
  }

  Future<void> _startPolling(String sessionId) async {
    final repo = CheckoutRepository();
    for (var attempt = 0; attempt < 10; attempt++) {
      try {
        final status = await repo.pollCheckoutStatus(sessionId);
        if (status.status == 'paid' ||
            status.status == 'slot_unavailable' ||
            status.status == 'booking_failed') {
          if (!mounted) return;
          Navigator.pushReplacement(
            context,
            PhysioPageRoute(builder: (_) => BookingConfirmationScreen(status: status)),
          );
          return;
        }
      } catch (_) {
        // keep polling — a transient failure shouldn't abort the sequence
      }
      await Future.delayed(const Duration(milliseconds: 2000));
    }
    if (!mounted) return;
    Navigator.pushReplacement(
      context,
      PhysioPageRoute(
        builder: (_) => BookingConfirmationScreen(
          status: const CheckoutStatus(status: 'processing'),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(title: const Text('Payment')),
      body: Stack(
        children: [
          WebViewWidget(controller: _controller),
          if (_loading) const Center(child: CircularProgressIndicator()),
        ],
      ),
    );
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `flutter test test/features/booking/payment_screen_test.dart`
Expected: PASS (3 tests; requires `BookingConfirmationScreen` from Task 8 — build together or stub).

- [ ] **Step 5: Commit**

```bash
git add mobile_app/lib/src/features/booking/payment_screen.dart mobile_app/test/features/booking/payment_screen_test.dart
git commit -m "feat(mobile): add Stripe Checkout WebView step with status polling"
```

---

### Task 8: `BookingConfirmationScreen` + wire entry point, verify notification deep-link still works

**Files:**
- Create: `mobile_app/lib/src/features/booking/booking_confirmation_screen.dart`
- Modify: `mobile_app/lib/src/features/booking/booking_screen.dart` (replace WebView entry with native flow CTA)
- Delete: `mobile_app/lib/src/features/booking/booking_record.dart` (superseded by `features/appointments/booking_model.dart`'s `BookingRecord`)

**Interfaces:**
- Consumes: `CheckoutStatus` (Task 3/7), `AppointmentsRepository`/`BookingRecord` (existing, `features/appointments/`).
- Produces: `class BookingConfirmationScreen extends StatelessWidget { final CheckoutStatus status; const BookingConfirmationScreen({required this.status, super.key}); }`.

- [ ] **Step 1: Write the failing test**

```dart
// mobile_app/test/features/booking/booking_confirmation_screen_test.dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:physioonclick/src/features/booking/booking_confirmation_screen.dart';
import 'package:physioonclick/src/features/booking/checkout_repository.dart';

void main() {
  testWidgets('shows a success message for a paid status', (tester) async {
    await tester.pumpWidget(const MaterialApp(
      home: BookingConfirmationScreen(
        status: CheckoutStatus(status: 'paid', invoiceNumber: 'INV-1'),
      ),
    ));
    expect(find.textContaining('confirmed'), findsOneWidget);
  });

  testWidgets('shows a still-processing message for processing status', (tester) async {
    await tester.pumpWidget(const MaterialApp(
      home: BookingConfirmationScreen(status: CheckoutStatus(status: 'processing')),
    ));
    expect(find.textContaining('finishing up'), findsOneWidget);
  });

  testWidgets('shows a contact-us message for booking_failed status', (tester) async {
    await tester.pumpWidget(const MaterialApp(
      home: BookingConfirmationScreen(status: CheckoutStatus(status: 'booking_failed')),
    ));
    expect(find.textContaining('contact you'), findsOneWidget);
  });
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `flutter test test/features/booking/booking_confirmation_screen_test.dart`
Expected: FAIL — file doesn't exist.

- [ ] **Step 3: Write minimal implementation**

```dart
// mobile_app/lib/src/features/booking/booking_confirmation_screen.dart
import 'package:flutter/material.dart';
import '../../core/app_colors.dart';
import '../../core/page_transitions.dart';
import '../appointments/appointments_screen.dart';
import 'checkout_repository.dart';

class BookingConfirmationScreen extends StatelessWidget {
  final CheckoutStatus status;
  const BookingConfirmationScreen({required this.status, super.key});

  @override
  Widget build(BuildContext context) {
    final (icon, title, message) = switch (status.status) {
      'paid' => (
          Icons.check_circle,
          'Booking confirmed',
          'Your appointment is confirmed${status.invoiceNumber != null ? " — invoice ${status.invoiceNumber}" : ""}.'
        ),
      'slot_unavailable' || 'booking_failed' => (
          Icons.error_outline,
          'We hit a snag',
          "Your payment went through but we couldn't confirm the slot. We'll contact you shortly to sort it out."
        ),
      _ => (
          Icons.hourglass_top,
          'Almost there',
          "We're still finishing up your booking — this can take a minute. Check Appointments shortly."
        ),
    };
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(title: const Text('Booking'), automaticallyImplyLeading: false),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 64, color: AppColors.teal),
              const SizedBox(height: 16),
              Text(title, style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: 8),
              Text(message, textAlign: TextAlign.center),
              const SizedBox(height: 24),
              FilledButton(
                onPressed: () {
                  Navigator.pushAndRemoveUntil(
                    context,
                    PhysioFadeRoute(builder: (_) => const AppointmentsScreen()),
                    (route) => route.isFirst,
                  );
                },
                child: const Text('View appointments'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
```

(Confirm the exact class name/constructor for the Appointments feature's list screen — `AppointmentsScreen` is the assumed name based on `AppointmentsRepository`; adjust the import/class to whatever `mobile_app/lib/src/features/appointments/` actually exports.)

Now modify `booking_screen.dart`: remove the `WebViewController` field and its `initState` load of `AppConfig.calComBookingUrl`; keep `_RecentBookingsList` (switch its data source from `booking_record.dart`'s thinner model to `features/appointments/booking_model.dart`'s `BookingRecord.fromDoc`); add a prominent "Book an appointment" `FilledButton` at the top that calls `ServiceSelectScreen.go(context)`. Delete `booking_record.dart` and fix any remaining imports of it (grep `booking_record.dart` across `mobile_app/lib` first).

- [ ] **Step 4: Run test to verify it passes**

Run: `flutter test test/features/booking/booking_confirmation_screen_test.dart`
Expected: PASS (3 tests)

Then run the full booking feature suite plus a static check:
Run: `flutter analyze` (from `mobile_app/`)
Expected: no new errors/warnings introduced by this task's changes.

- [ ] **Step 5: Commit**

```bash
git add mobile_app/lib/src/features/booking/ mobile_app/test/features/booking/booking_confirmation_screen_test.dart
git commit -m "feat(mobile): replace WebView booking entry with native flow, add confirmation screen"
```

---

### Task 9: Verify existing post-payment assessment deep-link paths still work

**Files:**
- No code changes expected — this is a verification task. If the Task 6 constructor change broke either call site, fix them here.
- Read: `mobile_app/lib/src/app.dart` (`_openAssessment`), `mobile_app/lib/src/features/appointments/appointment_detail_screen.dart` ("Complete assessment" button).

**Interfaces:**
- Consumes: `AssessmentScreen(bookingId: ..., onSubmitted: null)` — both existing call sites should now pass their real `bookingId` and leave `onSubmitted` unset (`null`) so the screen falls back to its original post-submit behavior.

- [ ] **Step 1: Write the failing test (regression guard)**

```dart
// mobile_app/test/app_assessment_deeplink_test.dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:physioonclick/src/features/assessment/assessment_screen.dart';

void main() {
  testWidgets('AssessmentScreen still works with only required params (legacy call shape)', (tester) async {
    await tester.pumpWidget(const MaterialApp(
      home: AssessmentScreen(uid: 'u1', personId: 'p1'),
    ));
    await tester.pump();
    expect(find.byType(AssessmentScreen), findsOneWidget);
  });
}
```

- [ ] **Step 2: Run test to verify current state**

Run: `flutter test test/app_assessment_deeplink_test.dart`
Expected: Should PASS already if Task 6's constructor change kept `bookingId`/`onSubmitted` optional with sensible defaults (`''` and `null`). If it FAILS (e.g. a required positional param was added by mistake), that's the bug this task catches.

- [ ] **Step 3: Fix if needed**

If the test fails, go back to `assessment_screen.dart` and confirm `bookingId` defaults to `''` and `onSubmitted` defaults to `null` (per Task 6's Step 3) rather than being required.

Then manually trace (read, don't run) `app.dart`'s `_openAssessment(bookingId)` and `appointment_detail_screen.dart`'s button handler to confirm both still pass a real `bookingId` positional/named arg and do **not** pass `onSubmitted`, so they retain their original "assessment submitted → show success / pop back" behavior untouched by the new booking-flow callback path.

- [ ] **Step 4: Run test to verify it passes**

Run: `flutter test test/app_assessment_deeplink_test.dart`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add mobile_app/test/app_assessment_deeplink_test.dart
git commit -m "test(mobile): regression guard for legacy AssessmentScreen call sites"
```

(If Step 3 required a source fix, include that file in the `git add`/commit too, with message `fix(mobile): keep AssessmentScreen backward-compatible with notification/appointment-detail entry points`.)

---

### Task 10: Exercise dosage display parity (mobile recovery/exercise screens)

**Files:**
- Modify: whichever widget in `mobile_app/lib/src/features/recovery/` (or `motion/`) renders a patient's assigned exercise list — locate it via `grep -r "exerciseLogs\|assignedExercises" mobile_app/lib/src/features/` before editing, since the exact file wasn't read in this plan's research pass.
- Test: sibling widget test in `mobile_app/test/features/recovery/` (mirror the path of the file modified above).

**Interfaces:**
- Consumes: the existing per-exercise Firestore doc's `dosage` map (matches web's `ExerciseDosage` shape from `lib/exercises.ts`: `{ sets?, reps?, holdSeconds?, minutes?, perDay?, perWeek?, tempo?, notes? }`).
- Produces: a `String formatDosage(Map<String, dynamic>? dosage)` helper that renders the same human-readable summary the web app shows (e.g. `"3 sets × 12 reps, hold 5s"` / `"10 minutes"` / falls back to `notes` when set fields are all absent), plus wiring it into the exercise list item's subtitle/trailing text.

- [ ] **Step 1: Write the failing test**

```dart
// mobile_app/test/features/recovery/dosage_format_test.dart
// Adjust the import path to match wherever formatDosage ends up living.
import 'package:flutter_test/flutter_test.dart';
import 'package:physioonclick/src/features/recovery/dosage_format.dart';

void main() {
  test('formats sets/reps/hold', () {
    expect(
      formatDosage({'sets': 3, 'reps': 12, 'holdSeconds': 5}),
      '3 sets × 12 reps, hold 5s',
    );
  });

  test('formats minutes-based exercises', () {
    expect(formatDosage({'minutes': 10}), '10 minutes');
  });

  test('falls back to notes when no set/rep/minute fields present', () {
    expect(formatDosage({'notes': 'As tolerated'}), 'As tolerated');
  });

  test('returns empty string for null/empty dosage', () {
    expect(formatDosage(null), '');
    expect(formatDosage({}), '');
  });
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `flutter test test/features/recovery/dosage_format_test.dart`
Expected: FAIL — `dosage_format.dart` doesn't exist yet.

- [ ] **Step 3: Write minimal implementation**

```dart
// mobile_app/lib/src/features/recovery/dosage_format.dart

/// Mirrors the merge/fallback logic in lib/exercise-plan.ts's
/// resolveDosage(): sets/reps/holdSeconds/minutes/perDay/perWeek/tempo
/// render as a summary string; notes falls back independently when no
/// other field is present.
String formatDosage(Map<String, dynamic>? dosage) {
  if (dosage == null || dosage.isEmpty) return '';
  final parts = <String>[];
  final sets = dosage['sets'] as num?;
  final reps = dosage['reps'] as num?;
  final hold = dosage['holdSeconds'] as num?;
  final minutes = dosage['minutes'] as num?;
  final perDay = dosage['perDay'] as num?;
  final perWeek = dosage['perWeek'] as num?;
  final tempo = dosage['tempo'] as String?;

  if (sets != null && reps != null) {
    parts.add('${sets.toInt()} sets × ${reps.toInt()} reps');
  } else if (reps != null) {
    parts.add('${reps.toInt()} reps');
  }
  if (hold != null) parts.add('hold ${hold.toInt()}s');
  if (minutes != null) parts.add('${minutes.toInt()} minutes');
  if (tempo != null && tempo.isNotEmpty) parts.add(tempo);
  if (perDay != null) parts.add('${perDay.toInt()}x/day');
  if (perWeek != null) parts.add('${perWeek.toInt()}x/week');

  if (parts.isNotEmpty) return parts.join(', ');

  final notes = dosage['notes'] as String?;
  return notes ?? '';
}
```

Then wire `formatDosage(assignedExercise.dosage)` into the exercise list item widget's subtitle (the exact widget/file to edit must be located via the `grep` in this task's Files section before making this change — do not guess the file path).

- [ ] **Step 4: Run test to verify it passes**

Run: `flutter test test/features/recovery/dosage_format_test.dart`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add mobile_app/lib/src/features/recovery/dosage_format.dart mobile_app/test/features/recovery/dosage_format_test.dart
git commit -m "feat(mobile): render exercise dosage to match web parity"
```

(A second commit for the actual list-item wiring change, once the target file is located: `git commit -m "feat(mobile): surface dosage summary on assigned exercise list items"`.)

---

### Task 11: Full manual parity pass across already-matching features

**Files:** none modified — this is a checklist-driven manual/smoke verification task, to be run after Tasks 1–10 land, using two accounts on the dev Firebase project (`physioonclick-dev`): the admin account (`ADMIN_EMAIL`) and the test patient account `krunalnayak49@gmail.com` (per project convention — never test-book against real patients Seena/Anish George).

- [ ] **Step 1: Native booking end-to-end on a physical/simulator device against dev**

Run the app against `physioonclick-dev` (per `mobile_app/firebase/dev/` + `scripts/switch-firebase-env.sh`), and as `krunalnayak49@gmail.com`: pick a service → pick a slot → complete the assessment wizard → complete Stripe test-mode checkout (Stripe test card `4242 4242 4242 4242`) → confirm the confirmation screen shows "Booking confirmed" and the new booking appears in Appointments with `paid: true` and the assessment linked.

- [ ] **Step 2: Compare against the web flow side by side**

Using the browser preview tooling, run the same booking on `npm run dev` against the same dev project, confirm the step order and data collected (service, slot, assessment fields, payment) is equivalent, and that both flows produce a `bookings` doc with the same field shape (spot-check in the Firestore emulator/dev console).

- [ ] **Step 3: Re-verify previously-confirmed-matching features still work after these changes**

For each of: AI chat assistant, session-summary FCM push, recovery/streak tracking, dependents/people management, invoice PDF viewing — do one smoke pass per feature on both web and the newly-modified mobile build to confirm nothing regressed (these were confirmed structurally matching in prior research; this step is a behavioral spot-check, not a rebuild).

- [ ] **Step 4: Record results**

No commit needed for this task itself — if Step 1–3 surface a bug, open a fix as a new task/commit following the same TDD pattern as Tasks 1–10, then re-run this checklist.

---

## Deployment Note

None of this plan's mobile-side work requires new web/backend changes **except** the open question flagged in Task 7/Part B3 research: the Stripe success/cancel URLs are currently hardcoded server-side to `NEXT_PUBLIC_SITE_URL`. This plan's `PaymentScreen` works around that by intercepting the web app's own `https://physioonclick.com/book/success?session_id=...` URL inside the in-app WebView rather than requiring a backend change — confirm this interception actually fires in Task 11's Step 1 before considering the flow production-ready. If it doesn't fire reliably (e.g. Stripe keeps the WebView on its own domain and never navigates to the success URL in some payment method flows), a follow-up task to add mobile-specific `successUrl`/`cancelUrl` overrides to `app/api/checkout/create/route.ts` will be needed — do not add that speculatively; only add it if Task 11 proves it's needed.
