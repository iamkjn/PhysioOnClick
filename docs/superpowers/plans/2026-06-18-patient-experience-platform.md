# Patient Experience Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add dependent profiles, appointment tracking, post-session summaries with push notifications, and optional profile photos to PhysioOnClick web and mobile.

**Architecture:** Shared Firebase data layer (Firestore collections: `dependents`, `bookings` update, `sessionSummaries`) surfaces across the Flutter mobile app, Next.js patient portal, and Next.js admin panel. A Firebase Cloud Function sends FCM push notifications when a summary is published. A `pendingSelections/{userId}` Firestore document bridges the Cal.com WebView booking with the dependent selection made in-app.

**Tech Stack:** Flutter 3.x + firebase_messaging + image_picker; Next.js 15 App Router; Firebase Firestore, Storage, FCM, Cloud Functions (Node.js 20); existing firebase-admin in Next.js API routes.

## Global Constraints

- Flutter: follow existing widget patterns (StatelessWidget preferred, StatefulWidget when state needed)
- Dart: no `dynamic` types — use typed models
- Next.js: Server Components by default; `"use client"` only when hooks/events needed
- Firebase Storage avatar paths: `avatars/users/{userId}.jpg` and `avatars/dependents/{dependentId}.jpg`
- Firestore collection names (exact): `dependents`, `bookings`, `sessionSummaries`, `pendingSelections`
- Avatar initials colour: derive from `name.codeUnits.fold(0, (a,b)=>a+b) % colours.length` (Flutter) / same logic in JS
- All timestamps: Firestore `serverTimestamp()` / `FieldValue.serverTimestamp()`
- No web push notifications in v1 (mobile FCM only)

---

## File Map

### New files
```
# Firebase Cloud Function
functions/src/index.ts                              ← onSummaryPublished FCM trigger

# Flutter
mobile_app/lib/src/core/utils/avatar_utils.dart    ← colour-from-name hash
mobile_app/lib/src/core/widgets/avatar_widget.dart ← reusable avatar circle
mobile_app/lib/src/features/people/dependent_model.dart
mobile_app/lib/src/features/people/people_repository.dart
mobile_app/lib/src/features/people/people_screen.dart
mobile_app/lib/src/features/people/add_person_sheet.dart
mobile_app/lib/src/features/booking/who_is_this_for_screen.dart
mobile_app/lib/src/features/appointments/booking_model.dart
mobile_app/lib/src/features/appointments/appointments_repository.dart
mobile_app/lib/src/features/appointments/appointments_screen.dart
mobile_app/lib/src/features/appointments/appointment_detail_screen.dart

# Web
lib/dependents.ts                                   ← Firestore CRUD for dependents
lib/patient-bookings.ts                             ← Firestore read for patient bookings
lib/session-summaries.ts                            ← Firestore write for summaries
app/patient/people/page.tsx                         ← Manage people UI
app/patient/appointments/page.tsx                   ← Appointment history
app/patient/appointments/[id]/page.tsx              ← Appointment detail + summary
components/person-card.tsx                          ← Reusable person card (web)
components/avatar.tsx                               ← Reusable avatar (web)
components/appointment-card.tsx                     ← Reusable appointment row (web)
components/summary-form.tsx                         ← Admin summary write form
```

### Modified files
```
firestore.rules                                     ← add dependents, sessionSummaries, pendingSelections rules
mobile_app/pubspec.yaml                             ← add firebase_messaging, image_picker
mobile_app/lib/main.dart                            ← FCM token capture
mobile_app/lib/src/app.dart                         ← notification tap deep-link handler
mobile_app/lib/src/features/booking/booking_screen.dart ← insert WhoIsThisForScreen
mobile_app/lib/src/features/profile/profile_screen.dart ← My People + My Appointments sections
app/book/page.tsx                                   ← who-is-this-for selector
app/admin/page.tsx                                  ← appointments with patient name + summary button
app/api/cal-webhook/route.ts                        ← merge pendingSelections into booking
```

---

## Task 1: Firestore Rules + Data Layer

**Files:**
- Modify: `firestore.rules`

**Interfaces:**
- Produces: security rules for `dependents`, `sessionSummaries`, `pendingSelections` used by all later tasks

- [ ] **Step 1: Add new collection rules to firestore.rules**

Open `firestore.rules` and add these rules before the final `match /{document=**}` catch-all:

```
    match /dependents/{dependentId} {
      allow read, write: if isSignedIn() && request.auth.uid == resource.data.ownerId;
      allow create: if isSignedIn() && request.auth.uid == request.resource.data.ownerId;
      allow read, write: if isAdmin();
    }

    match /sessionSummaries/{summaryId} {
      allow read: if isSignedIn() && (
        isAdmin() ||
        exists(/databases/$(database)/documents/bookings/$(resource.data.bookingId)) &&
        get(/databases/$(database)/documents/bookings/$(resource.data.bookingId)).data.bookedBy == request.auth.uid
      );
      allow create, update, delete: if isAdmin();
    }

    match /pendingSelections/{userId} {
      allow read, write: if isSignedIn() && request.auth.uid == userId;
    }
```

Also update the existing `bookings` rule to allow read by `bookedBy` uid (not just email):

```
    match /bookings/{bookingId} {
      allow create: if true;
      allow read: if isAdmin() || ownsEmailResource() ||
        (isSignedIn() && resource.data.bookedBy == request.auth.uid);
      allow update, delete: if isAdmin();
    }
```

- [ ] **Step 2: Deploy rules**

```bash
cd /Users/iamkjn/Documents/Playground
firebase deploy --only firestore:rules
```

Expected: `✔  firestore: released rules`

- [ ] **Step 3: Commit**

```bash
git add firestore.rules
git commit -m "feat: add Firestore rules for dependents, summaries, pendingSelections"
```

---

## Task 2: Firebase Cloud Function — onSummaryPublished

**Files:**
- Create: `functions/src/index.ts`
- Create: `functions/package.json`
- Create: `functions/tsconfig.json`

**Interfaces:**
- Consumes: `sessionSummaries/{summaryId}` onCreate event
- Consumes: `bookings/{bookingId}` document (field: `bookedBy`, `service`, `sessionDate`)
- Consumes: `users/{userId}` document (field: `fcmToken`)
- Produces: FCM push notification to patient device

- [ ] **Step 1: Initialise Firebase Functions if not already done**

```bash
cd /Users/iamkjn/Documents/Playground
firebase init functions
# Choose: TypeScript, ESLint yes, install deps yes
```

If `functions/` already exists, skip this step.

- [ ] **Step 2: Write the Cloud Function**

Replace `functions/src/index.ts` with:

```typescript
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

initializeApp();

export const onSummaryPublished = onDocumentCreated(
  "sessionSummaries/{summaryId}",
  async (event) => {
    const summary = event.data?.data();
    if (!summary) return;

    const db = getFirestore();

    // Get the linked booking to find who booked it
    const bookingSnap = await db.doc(`bookings/${summary.bookingId}`).get();
    if (!bookingSnap.exists) return;
    const booking = bookingSnap.data()!;

    // Get the booker's FCM token
    const userSnap = await db.doc(`users/${booking.bookedBy}`).get();
    if (!userSnap.exists) return;
    const fcmToken: string | undefined = userSnap.data()?.fcmToken;
    if (!fcmToken) return;

    // Format date for notification body
    const date = booking.sessionDate?.toDate
      ? booking.sessionDate.toDate().toLocaleDateString("en-GB", { day: "numeric", month: "short" })
      : "your session";

    await getMessaging().send({
      token: fcmToken,
      notification: {
        title: "📋 Session summary ready",
        body: `${summary.patientName}'s ${booking.service ?? "session"} summary from ${date} is now available`,
      },
      data: {
        type: "summary",
        bookingId: summary.bookingId,
        summaryId: event.params.summaryId,
      },
      apns: { payload: { aps: { sound: "default" } } },
      android: { notification: { sound: "default" } },
    });

    // Mark notification sent
    await event.data!.ref.update({ notificationSent: FieldValue.serverTimestamp() });
  }
);
```

- [ ] **Step 3: Deploy the function**

```bash
cd /Users/iamkjn/Documents/Playground/functions
npm run build
firebase deploy --only functions
```

Expected: `✔  functions: Finished running predeploy script. ✔  functions[onSummaryPublished]`

- [ ] **Step 4: Commit**

```bash
git add functions/
git commit -m "feat: Cloud Function — send FCM push on session summary publish"
```

---

## Task 3: Flutter — Packages + Avatar Utilities

**Files:**
- Modify: `mobile_app/pubspec.yaml`
- Create: `mobile_app/lib/src/core/utils/avatar_utils.dart`
- Create: `mobile_app/lib/src/core/widgets/avatar_widget.dart`

**Interfaces:**
- Produces: `avatarColor(String name) → Color` used by all avatar widgets
- Produces: `AvatarWidget({String name, String? imageUrl, double size})` used in Tasks 4, 5, 6, 7

- [ ] **Step 1: Add packages to pubspec.yaml**

In `mobile_app/pubspec.yaml`, under `dependencies:`, add:

```yaml
  firebase_messaging: ^15.1.3
  image_picker: ^1.1.2
```

- [ ] **Step 2: Install packages**

```bash
cd /Users/iamkjn/Documents/Playground/mobile_app && flutter pub get
```

Expected: `Got dependencies!`

- [ ] **Step 3: Create avatar_utils.dart**

```dart
// mobile_app/lib/src/core/utils/avatar_utils.dart
import 'package:flutter/material.dart';

const _avatarColours = [
  Color(0xFF0891B2), // teal
  Color(0xFF16A34A), // green
  Color(0xFF7C3AED), // purple
  Color(0xFFD97706), // amber
  Color(0xFFDC2626), // red
  Color(0xFF0E7490), // dark teal
  Color(0xFF059669), // emerald
  Color(0xFF9333EA), // violet
];

Color avatarColor(String name) {
  if (name.isEmpty) return _avatarColours[0];
  final hash = name.codeUnits.fold(0, (a, b) => a + b);
  return _avatarColours[hash % _avatarColours.length];
}

String avatarInitials(String name) {
  final parts = name.trim().split(RegExp(r'\s+'));
  if (parts.isEmpty) return '?';
  if (parts.length == 1) return parts[0][0].toUpperCase();
  return '${parts[0][0]}${parts[parts.length - 1][0]}'.toUpperCase();
}
```

- [ ] **Step 4: Create avatar_widget.dart**

```dart
// mobile_app/lib/src/core/widgets/avatar_widget.dart
import 'package:flutter/material.dart';

import '../utils/avatar_utils.dart';

class AvatarWidget extends StatelessWidget {
  const AvatarWidget({
    super.key,
    required this.name,
    this.imageUrl,
    this.size = 48,
    this.onTap,
    this.showEditBadge = false,
  });

  final String name;
  final String? imageUrl;
  final double size;
  final VoidCallback? onTap;
  final bool showEditBadge;

  @override
  Widget build(BuildContext context) {
    final circle = imageUrl != null && imageUrl!.isNotEmpty
        ? CircleAvatar(
            radius: size / 2,
            backgroundImage: NetworkImage(imageUrl!),
          )
        : CircleAvatar(
            radius: size / 2,
            backgroundColor: avatarColor(name),
            child: Text(
              avatarInitials(name),
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w700,
                fontSize: size * 0.38,
              ),
            ),
          );

    if (onTap == null && !showEditBadge) return circle;

    return GestureDetector(
      onTap: onTap,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          circle,
          if (showEditBadge)
            Positioned(
              bottom: 0,
              right: 0,
              child: Container(
                width: size * 0.38,
                height: size * 0.38,
                decoration: BoxDecoration(
                  color: const Color(0xFF0891B2),
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 1.5),
                ),
                child: Icon(Icons.camera_alt_rounded, color: Colors.white, size: size * 0.22),
              ),
            ),
        ],
      ),
    );
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add mobile_app/pubspec.yaml mobile_app/pubspec.lock mobile_app/lib/src/core/utils/avatar_utils.dart mobile_app/lib/src/core/widgets/avatar_widget.dart
git commit -m "feat(mobile): add firebase_messaging, image_picker, AvatarWidget"
```

---

## Task 4: Flutter — Dependent Model + Repository

**Files:**
- Create: `mobile_app/lib/src/features/people/dependent_model.dart`
- Create: `mobile_app/lib/src/features/people/people_repository.dart`

**Interfaces:**
- Produces: `Dependent` model used by Tasks 5, 6, 7, 8
- Produces: `PeopleRepository.watchDependents(userId)` → `Stream<List<Dependent>>`
- Produces: `PeopleRepository.addDependent(Dependent)` → `Future<String>` (returns new docId)
- Produces: `PeopleRepository.deleteDependent(String id)` → `Future<void>`
- Produces: `PeopleRepository.updateAvatarUrl(String id, String url)` → `Future<void>`

- [ ] **Step 1: Create dependent_model.dart**

```dart
// mobile_app/lib/src/features/people/dependent_model.dart
import 'package:cloud_firestore/cloud_firestore.dart';

class Dependent {
  const Dependent({
    required this.id,
    required this.ownerId,
    required this.name,
    required this.dob,
    required this.relationship,
    this.notes = '',
    this.avatarUrl,
  });

  final String id;
  final String ownerId;
  final String name;
  final String dob; // ISO "YYYY-MM-DD"
  final String relationship; // "Mother"|"Father"|"Son"|"Daughter"|"Partner"|"Other"
  final String notes;
  final String? avatarUrl;

  factory Dependent.fromDoc(DocumentSnapshot doc) {
    final d = doc.data() as Map<String, dynamic>;
    return Dependent(
      id: doc.id,
      ownerId: d['ownerId'] as String,
      name: d['name'] as String,
      dob: d['dob'] as String,
      relationship: d['relationship'] as String,
      notes: (d['notes'] as String?) ?? '',
      avatarUrl: d['avatarUrl'] as String?,
    );
  }

  Map<String, dynamic> toMap() => {
        'ownerId': ownerId,
        'name': name,
        'dob': dob,
        'relationship': relationship,
        'notes': notes,
        if (avatarUrl != null) 'avatarUrl': avatarUrl,
        'createdAt': FieldValue.serverTimestamp(),
      };

  Dependent copyWith({String? avatarUrl}) => Dependent(
        id: id,
        ownerId: ownerId,
        name: name,
        dob: dob,
        relationship: relationship,
        notes: notes,
        avatarUrl: avatarUrl ?? this.avatarUrl,
      );
}
```

- [ ] **Step 2: Create people_repository.dart**

```dart
// mobile_app/lib/src/features/people/people_repository.dart
import 'dart:io';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';

import 'dependent_model.dart';

class PeopleRepository {
  final _col = FirebaseFirestore.instance.collection('dependents');
  final _storage = FirebaseStorage.instance;

  Stream<List<Dependent>> watchDependents(String userId) {
    return _col
        .where('ownerId', isEqualTo: userId)
        .orderBy('createdAt', descending: false)
        .snapshots()
        .map((s) => s.docs.map(Dependent.fromDoc).toList());
  }

  Future<String> addDependent(Dependent dep) async {
    final ref = await _col.add(dep.toMap());
    return ref.id;
  }

  Future<void> updateDependent(Dependent dep) async {
    await _col.doc(dep.id).update({
      'name': dep.name,
      'dob': dep.dob,
      'relationship': dep.relationship,
      'notes': dep.notes,
    });
  }

  Future<void> deleteDependent(String id) async {
    await _col.doc(id).delete();
  }

  Future<String> uploadAvatar(String dependentId, File imageFile) async {
    final ref = _storage.ref('avatars/dependents/$dependentId.jpg');
    await ref.putFile(imageFile, SettableMetadata(contentType: 'image/jpeg'));
    return ref.getDownloadURL();
  }

  Future<void> updateAvatarUrl(String dependentId, String url) async {
    await _col.doc(dependentId).update({'avatarUrl': url});
  }

  Future<String> uploadUserAvatar(String userId, File imageFile) async {
    final ref = _storage.ref('avatars/users/$userId.jpg');
    await ref.putFile(imageFile, SettableMetadata(contentType: 'image/jpeg'));
    return ref.getDownloadURL();
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add mobile_app/lib/src/features/people/
git commit -m "feat(mobile): Dependent model and PeopleRepository"
```

---

## Task 5: Flutter — People Screen + Add Person Sheet

**Files:**
- Create: `mobile_app/lib/src/features/people/people_screen.dart`
- Create: `mobile_app/lib/src/features/people/add_person_sheet.dart`

**Interfaces:**
- Consumes: `PeopleRepository`, `AvatarWidget`, `Dependent`
- Produces: `PeopleScreen` widget navigated to from profile screen (Task 8)
- Produces: `AddPersonSheet.show(context, {Dependent? existing})` → `Future<void>`

- [ ] **Step 1: Create add_person_sheet.dart**

```dart
// mobile_app/lib/src/features/people/add_person_sheet.dart
import 'dart:io';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/widgets/avatar_widget.dart';
import 'dependent_model.dart';
import 'people_repository.dart';

class AddPersonSheet extends StatefulWidget {
  const AddPersonSheet({super.key, this.existing});

  final Dependent? existing;

  static Future<void> show(BuildContext context, {Dependent? existing}) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => AddPersonSheet(existing: existing),
    );
  }

  @override
  State<AddPersonSheet> createState() => _AddPersonSheetState();
}

class _AddPersonSheetState extends State<AddPersonSheet> {
  final _repo = PeopleRepository();
  final _nameCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();
  String _relationship = 'Other';
  DateTime? _dob;
  File? _pickedImage;
  bool _saving = false;

  static const _relationships = ['Mother', 'Father', 'Son', 'Daughter', 'Partner', 'Other'];

  @override
  void initState() {
    super.initState();
    if (widget.existing != null) {
      _nameCtrl.text = widget.existing!.name;
      _notesCtrl.text = widget.existing!.notes;
      _relationship = widget.existing!.relationship;
      _dob = DateTime.tryParse(widget.existing!.dob);
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _notesCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      builder: (_) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt_rounded),
              title: const Text('Take photo'),
              onTap: () => Navigator.pop(context, ImageSource.camera),
            ),
            ListTile(
              leading: const Icon(Icons.photo_library_rounded),
              title: const Text('Choose from library'),
              onTap: () => Navigator.pop(context, ImageSource.gallery),
            ),
          ],
        ),
      ),
    );
    if (source == null) return;
    final xfile = await picker.pickImage(source: source, imageQuality: 80, maxWidth: 512);
    if (xfile != null) setState(() => _pickedImage = File(xfile.path));
  }

  Future<void> _pickDob() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _dob ?? DateTime(1980),
      firstDate: DateTime(1900),
      lastDate: DateTime.now(),
    );
    if (picked != null) setState(() => _dob = picked);
  }

  Future<void> _save() async {
    final name = _nameCtrl.text.trim();
    if (name.isEmpty || _dob == null) return;
    final uid = FirebaseAuth.instance.currentUser!.uid;
    setState(() => _saving = true);

    try {
      if (widget.existing == null) {
        // Create new dependent
        final dep = Dependent(
          id: '',
          ownerId: uid,
          name: name,
          dob: _dob!.toIso8601String().split('T').first,
          relationship: _relationship,
          notes: _notesCtrl.text.trim(),
        );
        final newId = await _repo.addDependent(dep);
        if (_pickedImage != null) {
          final url = await _repo.uploadAvatar(newId, _pickedImage!);
          await _repo.updateAvatarUrl(newId, url);
        }
      } else {
        final updated = Dependent(
          id: widget.existing!.id,
          ownerId: uid,
          name: name,
          dob: _dob!.toIso8601String().split('T').first,
          relationship: _relationship,
          notes: _notesCtrl.text.trim(),
          avatarUrl: widget.existing!.avatarUrl,
        );
        await _repo.updateDependent(updated);
        if (_pickedImage != null) {
          final url = await _repo.uploadAvatar(widget.existing!.id, _pickedImage!);
          await _repo.updateAvatarUrl(widget.existing!.id, url);
        }
      }
      if (mounted) Navigator.pop(context);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.existing != null;
    final name = _nameCtrl.text.trim();

    return DraggableScrollableSheet(
      initialChildSize: 0.85,
      maxChildSize: 0.95,
      minChildSize: 0.5,
      builder: (_, ctrl) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: ListView(
          controller: ctrl,
          padding: const EdgeInsets.fromLTRB(24, 12, 24, 40),
          children: [
            Center(
              child: Container(
                width: 40, height: 4,
                decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(2)),
              ),
            ),
            const SizedBox(height: 20),
            Center(
              child: AvatarWidget(
                name: name.isEmpty ? '?' : name,
                imageUrl: _pickedImage != null ? null : widget.existing?.avatarUrl,
                size: 80,
                showEditBadge: true,
                onTap: _pickImage,
              ),
            ),
            const SizedBox(height: 20),
            Text(isEdit ? 'Edit person' : 'Add a person',
                style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
            const SizedBox(height: 20),
            TextField(
              controller: _nameCtrl,
              onChanged: (_) => setState(() {}),
              decoration: const InputDecoration(labelText: 'Full name', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 14),
            DropdownButtonFormField<String>(
              value: _relationship,
              decoration: const InputDecoration(labelText: 'Relationship', border: OutlineInputBorder()),
              items: _relationships.map((r) => DropdownMenuItem(value: r, child: Text(r))).toList(),
              onChanged: (v) => setState(() => _relationship = v!),
            ),
            const SizedBox(height: 14),
            InkWell(
              onTap: _pickDob,
              child: InputDecorator(
                decoration: const InputDecoration(labelText: 'Date of birth', border: OutlineInputBorder()),
                child: Text(
                  _dob != null
                      ? '${_dob!.day}/${_dob!.month}/${_dob!.year}'
                      : 'Tap to select',
                  style: TextStyle(color: _dob != null ? Colors.black87 : Colors.grey[600]),
                ),
              ),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: _notesCtrl,
              decoration: const InputDecoration(
                labelText: 'Medical notes (optional)',
                border: OutlineInputBorder(),
                hintText: 'e.g. diabetic, had knee surgery 2022',
              ),
              maxLines: 2,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: (name.isEmpty || _dob == null || _saving) ? null : _save,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF0891B2),
                foregroundColor: Colors.white,
                minimumSize: const Size.fromHeight(52),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: _saving
                  ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : Text(isEdit ? 'Save changes' : 'Add person', style: const TextStyle(fontWeight: FontWeight.w700)),
            ),
          ],
        ),
      ),
    );
  }
}
```

- [ ] **Step 2: Create people_screen.dart**

```dart
// mobile_app/lib/src/features/people/people_screen.dart
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '../../core/widgets/avatar_widget.dart';
import 'add_person_sheet.dart';
import 'dependent_model.dart';
import 'people_repository.dart';

class PeopleScreen extends StatelessWidget {
  const PeopleScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = FirebaseAuth.instance.currentUser!;
    final repo = PeopleRepository();
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('My People'),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF0C2A38),
        elevation: 0,
        actions: [
          TextButton.icon(
            onPressed: () => AddPersonSheet.show(context),
            icon: const Icon(Icons.add_rounded, color: Color(0xFF0891B2)),
            label: const Text('Add', style: TextStyle(color: Color(0xFF0891B2), fontWeight: FontWeight.w700)),
          ),
        ],
      ),
      backgroundColor: const Color(0xFFF0FDFA),
      body: StreamBuilder<List<Dependent>>(
        stream: repo.watchDependents(user.uid),
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          final people = snap.data ?? [];

          return ListView(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
            children: [
              // Self card
              _PersonCard(
                name: user.displayName ?? 'You',
                subtitle: 'Your account · ${user.email ?? ""}',
                avatarUrl: user.photoURL,
                tag: 'You',
              ),
              const SizedBox(height: 10),
              ...people.map((dep) => Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: _PersonCard(
                      name: dep.name,
                      subtitle: '${dep.relationship} · ${_age(dep.dob)} years old',
                      avatarUrl: dep.avatarUrl,
                      onEdit: () => AddPersonSheet.show(context, existing: dep),
                      onDelete: () => _confirmDelete(context, repo, dep),
                    ),
                  )),
              const SizedBox(height: 8),
              OutlinedButton.icon(
                onPressed: () => AddPersonSheet.show(context),
                icon: const Icon(Icons.person_add_rounded),
                label: const Text('Add a person'),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size.fromHeight(50),
                  side: const BorderSide(color: Color(0xFF0891B2)),
                  foregroundColor: const Color(0xFF0891B2),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  int _age(String dob) {
    final d = DateTime.tryParse(dob);
    if (d == null) return 0;
    final now = DateTime.now();
    int age = now.year - d.year;
    if (now.month < d.month || (now.month == d.month && now.day < d.day)) age--;
    return age;
  }

  Future<void> _confirmDelete(BuildContext context, PeopleRepository repo, Dependent dep) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Remove person?'),
        content: Text('This will remove ${dep.name} from your account. Their appointment history remains.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Remove', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
    if (confirmed == true) await repo.deleteDependent(dep.id);
  }
}

class _PersonCard extends StatelessWidget {
  const _PersonCard({
    required this.name,
    required this.subtitle,
    this.avatarUrl,
    this.tag,
    this.onEdit,
    this.onDelete,
  });

  final String name;
  final String subtitle;
  final String? avatarUrl;
  final String? tag;
  final VoidCallback? onEdit;
  final VoidCallback? onDelete;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 12, offset: const Offset(0, 2))],
      ),
      child: Row(
        children: [
          AvatarWidget(name: name, imageUrl: avatarUrl, size: 52),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(name, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                    if (tag != null) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFFD8F3F9),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(tag!, style: const TextStyle(fontSize: 11, color: Color(0xFF0E7490), fontWeight: FontWeight.w600)),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 3),
                Text(subtitle, style: const TextStyle(fontSize: 13, color: Color(0xFF5E7A84))),
              ],
            ),
          ),
          if (onEdit != null) ...[
            IconButton(onPressed: onEdit, icon: const Icon(Icons.edit_rounded, size: 18, color: Color(0xFF5E7A84))),
            IconButton(onPressed: onDelete, icon: const Icon(Icons.delete_outline_rounded, size: 18, color: Colors.red)),
          ],
        ],
      ),
    );
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add mobile_app/lib/src/features/people/
git commit -m "feat(mobile): PeopleScreen and AddPersonSheet with avatar upload"
```

---

## Task 6: Flutter — FCM Setup + Deep Linking

**Files:**
- Modify: `mobile_app/lib/main.dart`
- Modify: `mobile_app/lib/src/app.dart`

**Interfaces:**
- Consumes: `firebase_messaging` package (Task 3)
- Produces: FCM token saved to `users/{uid}.fcmToken` on app launch
- Produces: Notification tap opens `AppointmentDetailScreen(bookingId: ...)` (Task 7)

- [ ] **Step 1: Update main.dart to capture FCM token**

Add the FCM initialisation block inside the existing `main()` function, after `FirebaseBootstrap.initialize()` succeeds:

```dart
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

// Inside main(), after FirebaseBootstrap.initialize():
FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
final messaging = FirebaseMessaging.instance;
await messaging.requestPermission(alert: true, badge: true, sound: true);
FirebaseAuth.instance.authStateChanges().listen((user) async {
  if (user != null) {
    final token = await messaging.getToken();
    if (token != null) {
      await FirebaseFirestore.instance
          .doc('users/${user.uid}')
          .set({'fcmToken': token}, SetOptions(merge: true));
    }
  }
});
```

Add the background handler at the top level of `main.dart` (outside `main()`):

```dart
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Background messages received but no action needed — foreground handles navigation
}
```

- [ ] **Step 2: Update app.dart to handle notification taps**

In `_PhysioOnClickMobileAppState.initState()`, add after `_resolveHome()`:

```dart
import 'package:firebase_messaging/firebase_messaging.dart';
import '../features/appointments/appointment_detail_screen.dart';

// In initState():
_initFcmListeners();

// New method:
void _initFcmListeners() {
  // App opened from terminated state via notification
  FirebaseMessaging.instance.getInitialMessage().then((message) {
    if (message != null) _handleNotificationTap(message);
  });

  // App in background, user taps notification
  FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);
}

void _handleNotificationTap(RemoteMessage message) {
  final bookingId = message.data['bookingId'] as String?;
  if (bookingId == null) return;
  navigatorKey.currentState?.push(
    MaterialPageRoute(builder: (_) => AppointmentDetailScreen(bookingId: bookingId)),
  );
}
```

- [ ] **Step 3: iOS — add push entitlement**

In `mobile_app/ios/Runner/Runner.entitlements` (create if absent):
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>aps-environment</key>
  <string>development</string>
</dict>
</plist>
```

- [ ] **Step 4: Commit**

```bash
git add mobile_app/lib/main.dart mobile_app/lib/src/app.dart mobile_app/ios/
git commit -m "feat(mobile): FCM token capture and notification deep-link handler"
```

---

## Task 7: Flutter — Appointments Screen + Detail

**Files:**
- Create: `mobile_app/lib/src/features/appointments/booking_model.dart`
- Create: `mobile_app/lib/src/features/appointments/appointments_repository.dart`
- Create: `mobile_app/lib/src/features/appointments/appointments_screen.dart`
- Create: `mobile_app/lib/src/features/appointments/appointment_detail_screen.dart`

**Interfaces:**
- Consumes: `AvatarWidget`, `avatarColor`
- Produces: `AppointmentsScreen` widget navigated to from profile (Task 8)
- Produces: `AppointmentDetailScreen(bookingId: String)` navigated to from notification tap (Task 6) and appointments list

- [ ] **Step 1: Create booking_model.dart**

```dart
// mobile_app/lib/src/features/appointments/booking_model.dart
import 'package:cloud_firestore/cloud_firestore.dart';

class BookingRecord {
  const BookingRecord({
    required this.id,
    required this.patientName,
    required this.patientAvatarUrl,
    required this.service,
    required this.sessionDate,
    required this.status,
    this.summaryId,
  });

  final String id;
  final String patientName;
  final String? patientAvatarUrl;
  final String service;
  final DateTime sessionDate;
  final String status; // "upcoming"|"completed"|"cancelled"
  final String? summaryId;

  bool get isUpcoming => status == 'upcoming';
  bool get hasSummary => summaryId != null;

  factory BookingRecord.fromDoc(DocumentSnapshot doc) {
    final d = doc.data() as Map<String, dynamic>;
    final ts = d['sessionDate'];
    final date = ts is Timestamp ? ts.toDate() : DateTime.now();
    return BookingRecord(
      id: doc.id,
      patientName: (d['patientName'] as String?) ?? 'Patient',
      patientAvatarUrl: d['patientAvatarUrl'] as String?,
      service: (d['service'] as String?) ?? 'Session',
      sessionDate: date,
      status: (d['status'] as String?) ?? 'upcoming',
      summaryId: d['summaryId'] as String?,
    );
  }
}

class SessionSummary {
  const SessionSummary({
    required this.id,
    required this.patientName,
    required this.workedOn,
    required this.exercises,
    required this.nextSteps,
    required this.followUpWeeks,
    required this.publishedAt,
  });

  final String id;
  final String patientName;
  final String workedOn;
  final String exercises;
  final String nextSteps;
  final int followUpWeeks;
  final DateTime publishedAt;

  factory SessionSummary.fromDoc(DocumentSnapshot doc) {
    final d = doc.data() as Map<String, dynamic>;
    final ts = d['publishedAt'];
    final date = ts is Timestamp ? ts.toDate() : DateTime.now();
    return SessionSummary(
      id: doc.id,
      patientName: (d['patientName'] as String?) ?? '',
      workedOn: (d['workedOn'] as String?) ?? '',
      exercises: (d['exercises'] as String?) ?? '',
      nextSteps: (d['nextSteps'] as String?) ?? '',
      followUpWeeks: (d['followUpWeeks'] as int?) ?? 0,
      publishedAt: date,
    );
  }
}
```

- [ ] **Step 2: Create appointments_repository.dart**

```dart
// mobile_app/lib/src/features/appointments/appointments_repository.dart
import 'package:cloud_firestore/cloud_firestore.dart';

import 'booking_model.dart';

class AppointmentsRepository {
  final _db = FirebaseFirestore.instance;

  Stream<List<BookingRecord>> watchBookings(String userId) {
    return _db
        .collection('bookings')
        .where('bookedBy', isEqualTo: userId)
        .orderBy('sessionDate', descending: true)
        .limit(50)
        .snapshots()
        .map((s) => s.docs.map(BookingRecord.fromDoc).toList());
  }

  Future<BookingRecord?> getBooking(String bookingId) async {
    final doc = await _db.doc('bookings/$bookingId').get();
    if (!doc.exists) return null;
    return BookingRecord.fromDoc(doc);
  }

  Future<SessionSummary?> getSummary(String bookingId) async {
    final snap = await _db
        .collection('sessionSummaries')
        .where('bookingId', isEqualTo: bookingId)
        .limit(1)
        .get();
    if (snap.docs.isEmpty) return null;
    return SessionSummary.fromDoc(snap.docs.first);
  }
}
```

- [ ] **Step 3: Create appointments_screen.dart**

```dart
// mobile_app/lib/src/features/appointments/appointments_screen.dart
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../core/widgets/avatar_widget.dart';
import 'appointment_detail_screen.dart';
import 'appointments_repository.dart';
import 'booking_model.dart';

class AppointmentsScreen extends StatelessWidget {
  const AppointmentsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      return const Scaffold(body: Center(child: Text('Sign in to view appointments')));
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Appointments'),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF0C2A38),
        elevation: 0,
      ),
      backgroundColor: const Color(0xFFF0FDFA),
      body: StreamBuilder<List<BookingRecord>>(
        stream: AppointmentsRepository().watchBookings(user.uid),
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          final all = snap.data ?? [];
          final upcoming = all.where((b) => b.isUpcoming).toList();
          final past = all.where((b) => !b.isUpcoming).toList();

          if (all.isEmpty) {
            return Center(
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                const Icon(Icons.calendar_today_rounded, size: 48, color: Color(0xFF9ADCEE)),
                const SizedBox(height: 14),
                Text('No appointments yet', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 6),
                const Text('Book a session to get started', style: TextStyle(color: Color(0xFF5E7A84))),
              ]),
            );
          }

          return ListView(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
            children: [
              if (upcoming.isNotEmpty) ...[
                _SectionHeader('Upcoming'),
                ...upcoming.map((b) => _AppointmentTile(booking: b)),
                const SizedBox(height: 8),
              ],
              if (past.isNotEmpty) ...[
                _SectionHeader('Past'),
                ...past.map((b) => _AppointmentTile(booking: b)),
              ],
            ],
          );
        },
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10, left: 4),
      child: Text(text, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: Color(0xFF0C2A38))),
    );
  }
}

class _AppointmentTile extends StatelessWidget {
  const _AppointmentTile({required this.booking});
  final BookingRecord booking;

  @override
  Widget build(BuildContext context) {
    final fmt = DateFormat('d MMM yyyy');

    return GestureDetector(
      onTap: () => Navigator.push(context,
          MaterialPageRoute(builder: (_) => AppointmentDetailScreen(bookingId: booking.id))),
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, 2))],
        ),
        child: Row(
          children: [
            AvatarWidget(name: booking.patientName, imageUrl: booking.patientAvatarUrl, size: 44),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(booking.patientName, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                  const SizedBox(height: 2),
                  Text(booking.service, style: const TextStyle(color: Color(0xFF5E7A84), fontSize: 13)),
                  const SizedBox(height: 2),
                  Text(fmt.format(booking.sessionDate), style: const TextStyle(color: Color(0xFF9ADCEE), fontSize: 12, fontWeight: FontWeight.w600)),
                ],
              ),
            ),
            if (!booking.isUpcoming)
              booking.hasSummary
                  ? const Icon(Icons.article_rounded, color: Color(0xFF0891B2), size: 22)
                  : const Icon(Icons.hourglass_top_rounded, color: Color(0xFF9ADCEE), size: 22)
            else
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(color: const Color(0xFFD8F3F9), borderRadius: BorderRadius.circular(999)),
                child: const Text('Upcoming', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF0E7490))),
              ),
          ],
        ),
      ),
    );
  }
}
```

- [ ] **Step 4: Create appointment_detail_screen.dart**

```dart
// mobile_app/lib/src/features/appointments/appointment_detail_screen.dart
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../core/widgets/avatar_widget.dart';
import 'appointments_repository.dart';
import 'booking_model.dart';

class AppointmentDetailScreen extends StatefulWidget {
  const AppointmentDetailScreen({super.key, required this.bookingId});
  final String bookingId;

  @override
  State<AppointmentDetailScreen> createState() => _AppointmentDetailScreenState();
}

class _AppointmentDetailScreenState extends State<AppointmentDetailScreen> {
  final _repo = AppointmentsRepository();
  late Future<(BookingRecord?, SessionSummary?)> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<(BookingRecord?, SessionSummary?)> _load() async {
    final booking = await _repo.getBooking(widget.bookingId);
    final summary = await _repo.getSummary(widget.bookingId);
    return (booking, summary);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Appointment'),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF0C2A38),
        elevation: 0,
      ),
      backgroundColor: const Color(0xFFF0FDFA),
      body: FutureBuilder<(BookingRecord?, SessionSummary?)>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          final (booking, summary) = snap.data ?? (null, null);
          if (booking == null) return const Center(child: Text('Appointment not found'));

          return ListView(
            padding: const EdgeInsets.all(20),
            children: [
              // Booking header card
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 12, offset: const Offset(0, 2))],
                ),
                child: Row(
                  children: [
                    AvatarWidget(name: booking.patientName, imageUrl: booking.patientAvatarUrl, size: 56),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(booking.patientName, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
                          const SizedBox(height: 4),
                          Text(booking.service, style: const TextStyle(color: Color(0xFF5E7A84))),
                          Text(DateFormat('EEEE d MMMM yyyy').format(booking.sessionDate),
                              style: const TextStyle(color: Color(0xFF0891B2), fontWeight: FontWeight.w600, fontSize: 13)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              // Summary section
              if (summary != null) ...[
                const Text('Session summary', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
                const SizedBox(height: 12),
                _SummaryBlock('What we worked on', summary.workedOn, Icons.medical_services_rounded),
                const SizedBox(height: 10),
                _SummaryBlock('Exercises assigned', summary.exercises, Icons.fitness_center_rounded),
                const SizedBox(height: 10),
                _SummaryBlock('Next steps & advice', summary.nextSteps, Icons.tips_and_updates_rounded),
                if (summary.followUpWeeks > 0) ...[
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFFD8F3F9),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.calendar_month_rounded, color: Color(0xFF0891B2)),
                        const SizedBox(width: 10),
                        Text('Follow-up recommended in ${summary.followUpWeeks} week${summary.followUpWeeks > 1 ? "s" : ""}',
                            style: const TextStyle(color: Color(0xFF0E7490), fontWeight: FontWeight.w600)),
                      ],
                    ),
                  ),
                ],
              ] else ...[
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
                  child: const Column(children: [
                    Icon(Icons.hourglass_top_rounded, color: Color(0xFF9ADCEE), size: 36),
                    SizedBox(height: 10),
                    Text('Summary coming soon', style: TextStyle(fontWeight: FontWeight.w700)),
                    SizedBox(height: 4),
                    Text('Your physio will add a summary after your session.',
                        textAlign: TextAlign.center, style: TextStyle(color: Color(0xFF5E7A84))),
                  ]),
                ),
              ],
            ],
          );
        },
      ),
    );
  }
}

class _SummaryBlock extends StatelessWidget {
  const _SummaryBlock(this.title, this.body, this.icon);
  final String title;
  final String body;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14),
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8)]),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Icon(icon, size: 16, color: const Color(0xFF0891B2)),
          const SizedBox(width: 6),
          Text(title, style: const TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF0C2A38))),
        ]),
        const SizedBox(height: 8),
        Text(body, style: const TextStyle(height: 1.55, color: Color(0xFF374151))),
      ]),
    );
  }
}
```

- [ ] **Step 5: Add intl package (needed for DateFormat)**

```bash
cd /Users/iamkjn/Documents/Playground/mobile_app
flutter pub add intl
flutter pub get
```

- [ ] **Step 6: Commit**

```bash
git add mobile_app/lib/src/features/appointments/ mobile_app/pubspec.yaml mobile_app/pubspec.lock
git commit -m "feat(mobile): AppointmentsScreen and AppointmentDetailScreen"
```

---

## Task 8: Flutter — Booking Flow + Profile Screen Update

**Files:**
- Create: `mobile_app/lib/src/features/booking/who_is_this_for_screen.dart`
- Modify: `mobile_app/lib/src/features/booking/booking_screen.dart`
- Modify: `mobile_app/lib/src/features/profile/profile_screen.dart`

**Interfaces:**
- Consumes: `PeopleRepository`, `AvatarWidget`, `Dependent`, `AppointmentsScreen`, `PeopleScreen`
- Produces: `WhoIsThisForScreen` that sets `pendingSelections/{uid}` in Firestore then opens `BookingScreen`

- [ ] **Step 1: Create who_is_this_for_screen.dart**

```dart
// mobile_app/lib/src/features/booking/who_is_this_for_screen.dart
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '../../core/widgets/avatar_widget.dart';
import '../people/dependent_model.dart';
import '../people/people_repository.dart';
import '../people/add_person_sheet.dart';
import 'booking_screen.dart';

class WhoIsThisForScreen extends StatelessWidget {
  const WhoIsThisForScreen({super.key});

  Future<void> _select(BuildContext context, {
    required String patientName,
    required String patientType,
    required String patientId,
    String? avatarUrl,
  }) async {
    final uid = FirebaseAuth.instance.currentUser!.uid;
    await FirebaseFirestore.instance.doc('pendingSelections/$uid').set({
      'patientType': patientType,
      'patientId': patientId,
      'patientName': patientName,
      'patientAvatarUrl': avatarUrl ?? '',
      'selectedAt': FieldValue.serverTimestamp(),
    });
    if (context.mounted) {
      Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const BookingScreen()));
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = FirebaseAuth.instance.currentUser!;
    final repo = PeopleRepository();
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: const Color(0xFFF0FDFA),
      appBar: AppBar(
        title: const Text('Who is this for?'),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF0C2A38),
        elevation: 0,
      ),
      body: StreamBuilder<List<Dependent>>(
        stream: repo.watchDependents(user.uid),
        builder: (context, snap) {
          final dependents = snap.data ?? [];

          return ListView(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
            children: [
              Text('Select who you\'re booking for',
                  style: theme.textTheme.bodyMedium?.copyWith(color: const Color(0xFF5E7A84))),
              const SizedBox(height: 14),
              // Self
              _SelectionTile(
                name: user.displayName ?? 'Myself',
                subtitle: 'My appointment',
                avatarUrl: user.photoURL,
                onTap: () => _select(context,
                    patientName: user.displayName ?? 'Patient',
                    patientType: 'self',
                    patientId: user.uid,
                    avatarUrl: user.photoURL),
              ),
              const SizedBox(height: 10),
              ...dependents.map((dep) => Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: _SelectionTile(
                      name: dep.name,
                      subtitle: dep.relationship,
                      avatarUrl: dep.avatarUrl,
                      onTap: () => _select(context,
                          patientName: dep.name,
                          patientType: 'dependent',
                          patientId: dep.id,
                          avatarUrl: dep.avatarUrl),
                    ),
                  )),
              const SizedBox(height: 8),
              OutlinedButton.icon(
                onPressed: () => AddPersonSheet.show(context),
                icon: const Icon(Icons.person_add_rounded),
                label: const Text('Book for someone new'),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size.fromHeight(50),
                  side: const BorderSide(color: Color(0xFF0891B2)),
                  foregroundColor: const Color(0xFF0891B2),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _SelectionTile extends StatelessWidget {
  const _SelectionTile({required this.name, required this.subtitle, this.avatarUrl, required this.onTap});
  final String name;
  final String subtitle;
  final String? avatarUrl;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10)],
        ),
        child: Row(
          children: [
            AvatarWidget(name: name, imageUrl: avatarUrl, size: 52),
            const SizedBox(width: 14),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(name, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                Text(subtitle, style: const TextStyle(fontSize: 13, color: Color(0xFF5E7A84))),
              ]),
            ),
            const Icon(Icons.chevron_right_rounded, color: Color(0xFF9ADCEE)),
          ],
        ),
      ),
    );
  }
}
```

- [ ] **Step 2: Update booking tab in root_shell.dart to navigate via WhoIsThisForScreen**

In `mobile_app/lib/src/features/root/root_shell.dart`, update the Booking tab's `onTap` in the `_NavItem` section. The booking tab (index 2) should push `WhoIsThisForScreen` when user is signed in, otherwise open `BookingScreen` directly:

Change the Booking `_NavItem` onTap:
```dart
onTap: () {
  final user = FirebaseAuth.instance.currentUser;
  if (user != null) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => const WhoIsThisForScreen()));
  } else {
    setState(() => currentIndex = 2);
  }
},
```

Add imports at top of root_shell.dart:
```dart
import 'package:firebase_auth/firebase_auth.dart';
import '../booking/who_is_this_for_screen.dart';
```

- [ ] **Step 3: Update profile_screen.dart to add My People + My Appointments sections**

After the existing sign-in card in `profile_screen.dart`, add these two sections for signed-in users (insert before the rehab programmes section):

```dart
import '../appointments/appointments_screen.dart';
import '../people/people_screen.dart';

// After the account card:
const SizedBox(height: 18),
_QuickLinkTile(
  icon: Icons.people_rounded,
  label: 'My People',
  subtitle: 'Manage family & friends',
  onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const PeopleScreen())),
),
const SizedBox(height: 10),
_QuickLinkTile(
  icon: Icons.calendar_month_rounded,
  label: 'My Appointments',
  subtitle: 'View history & session summaries',
  onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AppointmentsScreen())),
),
```

Add the `_QuickLinkTile` widget at the bottom of `profile_screen.dart`:

```dart
class _QuickLinkTile extends StatelessWidget {
  const _QuickLinkTile({required this.icon, required this.label, required this.subtitle, required this.onTap});
  final IconData icon;
  final String label;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 8)],
        ),
        child: Row(
          children: [
            Container(
              width: 44, height: 44,
              decoration: BoxDecoration(color: const Color(0xFFD8F3F9), borderRadius: BorderRadius.circular(12)),
              child: Icon(icon, color: const Color(0xFF0891B2), size: 22),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(label, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                Text(subtitle, style: const TextStyle(fontSize: 12, color: Color(0xFF5E7A84))),
              ]),
            ),
            const Icon(Icons.chevron_right_rounded, color: Color(0xFF9ADCEE)),
          ],
        ),
      ),
    );
  }
}
```

- [ ] **Step 4: Build and verify Flutter compiles**

```bash
cd /Users/iamkjn/Documents/Playground/mobile_app && flutter analyze
```

Expected: no errors (warnings about deprecated APIs in other files are pre-existing and acceptable).

- [ ] **Step 5: Commit**

```bash
git add mobile_app/lib/src/features/booking/who_is_this_for_screen.dart mobile_app/lib/src/features/booking/booking_screen.dart mobile_app/lib/src/features/root/root_shell.dart mobile_app/lib/src/features/profile/profile_screen.dart
git commit -m "feat(mobile): WhoIsThisForScreen, My People + My Appointments in profile"
```

---

## Task 9: Web — Firestore Helpers + Security

**Files:**
- Create: `lib/dependents.ts`
- Create: `lib/patient-bookings.ts`
- Create: `lib/session-summaries.ts`

**Interfaces:**
- Produces: `getDependents(userId)` → `Dependent[]`
- Produces: `addDependent(userId, data)` → `string` (docId)
- Produces: `deleteDependent(id)` → `void`
- Produces: `getPatientBookings(userId)` → `BookingRecord[]`
- Produces: `getBooking(id)` → `BookingRecord | null`
- Produces: `getSessionSummary(bookingId)` → `SessionSummary | null`
- Produces: `publishSummary(data)` → `string` (summaryId) — admin only, uses firebase-admin

- [ ] **Step 1: Create lib/dependents.ts**

```typescript
// lib/dependents.ts
import {
  collection, addDoc, getDocs, deleteDoc, doc, updateDoc,
  query, where, orderBy, serverTimestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Dependent {
  id: string;
  ownerId: string;
  name: string;
  dob: string;
  relationship: string;
  notes: string;
  avatarUrl?: string;
}

export async function getDependents(userId: string): Promise<Dependent[]> {
  if (!db) return [];
  const q = query(
    collection(db, "dependents"),
    where("ownerId", "==", userId),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Dependent));
}

export async function addDependent(
  userId: string,
  data: Omit<Dependent, "id" | "ownerId">
): Promise<string> {
  if (!db) throw new Error("Firestore not available");
  const ref = await addDoc(collection(db, "dependents"), {
    ...data,
    ownerId: userId,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateDependent(
  id: string,
  data: Partial<Pick<Dependent, "name" | "dob" | "relationship" | "notes" | "avatarUrl">>
): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, "dependents", id), data);
}

export async function deleteDependent(id: string): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, "dependents", id));
}
```

- [ ] **Step 2: Create lib/patient-bookings.ts**

```typescript
// lib/patient-bookings.ts
import { collection, getDocs, getDoc, doc, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface BookingRecord {
  id: string;
  patientName: string;
  patientAvatarUrl?: string;
  service: string;
  sessionDate: Date;
  status: "upcoming" | "completed" | "cancelled";
  summaryId?: string;
}

function toBookingRecord(id: string, data: Record<string, unknown>): BookingRecord {
  const ts = data.sessionDate as { toDate?: () => Date } | undefined;
  const date = ts?.toDate ? ts.toDate() : new Date();
  return {
    id,
    patientName: (data.patientName as string) ?? "Patient",
    patientAvatarUrl: data.patientAvatarUrl as string | undefined,
    service: (data.service as string) ?? "Session",
    sessionDate: date,
    status: (data.status as BookingRecord["status"]) ?? "upcoming",
    summaryId: data.summaryId as string | undefined,
  };
}

export async function getPatientBookings(userId: string): Promise<BookingRecord[]> {
  if (!db) return [];
  const q = query(
    collection(db, "bookings"),
    where("bookedBy", "==", userId),
    orderBy("sessionDate", "desc"),
    limit(50)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => toBookingRecord(d.id, d.data() as Record<string, unknown>));
}

export async function getBooking(id: string): Promise<BookingRecord | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, "bookings", id));
  if (!snap.exists()) return null;
  return toBookingRecord(snap.id, snap.data() as Record<string, unknown>);
}
```

- [ ] **Step 3: Create lib/session-summaries.ts**

```typescript
// lib/session-summaries.ts (client read + admin write)
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface SessionSummary {
  id: string;
  bookingId: string;
  patientName: string;
  workedOn: string;
  exercises: string;
  nextSteps: string;
  followUpWeeks: number;
  publishedAt: Date;
}

export async function getSessionSummary(bookingId: string): Promise<SessionSummary | null> {
  if (!db) return null;
  const q = query(
    collection(db, "sessionSummaries"),
    where("bookingId", "==", bookingId),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  const data = d.data();
  const ts = data.publishedAt as { toDate?: () => Date } | undefined;
  return {
    id: d.id,
    bookingId: data.bookingId as string,
    patientName: (data.patientName as string) ?? "",
    workedOn: (data.workedOn as string) ?? "",
    exercises: (data.exercises as string) ?? "",
    nextSteps: (data.nextSteps as string) ?? "",
    followUpWeeks: (data.followUpWeeks as number) ?? 0,
    publishedAt: ts?.toDate ? ts.toDate() : new Date(),
  };
}
```

- [ ] **Step 4: Add server-side publishSummary to admin actions**

In `app/admin/actions.ts`, add:

```typescript
// app/admin/actions.ts (add to existing file)
"use server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export interface PublishSummaryInput {
  bookingId: string;
  patientId: string;
  patientType: string;
  patientName: string;
  workedOn: string;
  exercises: string;
  nextSteps: string;
  followUpWeeks: number;
  service: string;
}

export async function publishSummary(input: PublishSummaryInput): Promise<{ summaryId: string }> {
  const ref = await adminDb.collection("sessionSummaries").add({
    ...input,
    publishedAt: FieldValue.serverTimestamp(),
    notificationSent: false,
  });
  // Link the summary back to the booking
  await adminDb.doc(`bookings/${input.bookingId}`).update({ summaryId: ref.id });
  return { summaryId: ref.id };
}
```

- [ ] **Step 5: Commit**

```bash
git add lib/dependents.ts lib/patient-bookings.ts lib/session-summaries.ts app/admin/actions.ts
git commit -m "feat(web): Firestore helpers for dependents, bookings, summaries + publishSummary action"
```

---

## Task 10: Web — Patient Portal Pages

**Files:**
- Create: `components/avatar.tsx`
- Create: `app/patient/people/page.tsx`
- Create: `app/patient/appointments/page.tsx`
- Create: `app/patient/appointments/[id]/page.tsx`

**Interfaces:**
- Consumes: `getDependents`, `addDependent`, `deleteDependent` (Task 9)
- Consumes: `getPatientBookings`, `getBooking`, `getSessionSummary` (Task 9)
- Produces: pages at `/patient/people`, `/patient/appointments`, `/patient/appointments/[id]`

- [ ] **Step 1: Create components/avatar.tsx**

```tsx
// components/avatar.tsx
"use client";

const COLOURS = [
  "#0891B2","#16A34A","#7C3AED","#D97706","#DC2626","#0E7490","#059669","#9333EA"
];

function avatarColor(name: string): string {
  if (!name) return COLOURS[0];
  const hash = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return COLOURS[hash % COLOURS.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface AvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: number;
  className?: string;
}

export function Avatar({ name, imageUrl, size = 48, className = "" }: AvatarProps) {
  const px = `${size}px`;
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        width={size}
        height={size}
        style={{ width: px, height: px, borderRadius: "50%", objectFit: "cover" }}
        className={className}
      />
    );
  }
  return (
    <div
      style={{
        width: px, height: px, borderRadius: "50%",
        background: avatarColor(name),
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontWeight: 700, fontSize: size * 0.38,
        flexShrink: 0,
      }}
      className={className}
    >
      {initials(name)}
    </div>
  );
}
```

- [ ] **Step 2: Create app/patient/people/page.tsx**

```tsx
// app/patient/people/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { Avatar } from "@/components/avatar";
import { getDependents, addDependent, deleteDependent, type Dependent } from "@/lib/dependents";
import "@/app/globals.css";

export default function PeoplePage() {
  const [uid, setUid] = useState<string | null>(null);
  const [dependents, setDependents] = useState<Dependent[]>([]);
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();
    return onAuthStateChanged(auth, u => {
      if (!u) { router.push("/patient"); return; }
      setUid(u.uid);
      getDependents(u.uid).then(setDependents);
    });
  }, [router]);

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!uid) return;
    const fd = new FormData(e.currentTarget);
    const id = await addDependent(uid, {
      name: fd.get("name") as string,
      dob: fd.get("dob") as string,
      relationship: fd.get("relationship") as string,
      notes: (fd.get("notes") as string) ?? "",
    });
    setDependents(await getDependents(uid));
    setShowForm(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this person from your account?")) return;
    await deleteDependent(id);
    if (uid) setDependents(await getDependents(uid));
  }

  return (
    <div className="site-shell" style={{ paddingTop: "2rem", paddingBottom: "4rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <h1 style={{ margin: 0 }}>My People</h1>
        <button className="button primary" onClick={() => setShowForm(true)}>+ Add person</button>
      </div>

      <div style={{ display: "grid", gap: "1rem" }}>
        {dependents.map(dep => (
          <div key={dep.id} style={{ background: "#fff", borderRadius: 16, padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "1rem", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <Avatar name={dep.name} imageUrl={dep.avatarUrl} size={52} />
            <div style={{ flex: 1 }}>
              <strong style={{ display: "block" }}>{dep.name}</strong>
              <span style={{ fontSize: 13, color: "#5E7A84" }}>{dep.relationship} · DOB {dep.dob}</span>
              {dep.notes && <span style={{ display: "block", fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>{dep.notes}</span>}
            </div>
            <button onClick={() => handleDelete(dep.id)} style={{ background: "none", border: "none", color: "#DC2626", cursor: "pointer", fontSize: 13 }}>Remove</button>
          </div>
        ))}
        {dependents.length === 0 && !showForm && (
          <p style={{ color: "#5E7A84" }}>No people added yet. Add a family member or friend to book on their behalf.</p>
        )}
      </div>

      {showForm && (
        <div style={{ marginTop: "1.5rem", background: "#fff", borderRadius: 18, padding: "1.5rem", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
          <h3 style={{ marginTop: 0 }}>Add a person</h3>
          <form onSubmit={handleAdd} style={{ display: "grid", gap: "0.75rem" }}>
            <input name="name" placeholder="Full name" required className="input" style={{ padding: "0.6rem 0.85rem", border: "1px solid #D1E8EE", borderRadius: 10, fontSize: 15 }} />
            <input name="dob" type="date" required className="input" style={{ padding: "0.6rem 0.85rem", border: "1px solid #D1E8EE", borderRadius: 10, fontSize: 15 }} />
            <select name="relationship" required style={{ padding: "0.6rem 0.85rem", border: "1px solid #D1E8EE", borderRadius: 10, fontSize: 15 }}>
              {["Mother","Father","Son","Daughter","Partner","Other"].map(r => <option key={r}>{r}</option>)}
            </select>
            <input name="notes" placeholder="Medical notes (optional)" style={{ padding: "0.6rem 0.85rem", border: "1px solid #D1E8EE", borderRadius: 10, fontSize: 15 }} />
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button type="submit" className="button primary">Save</button>
              <button type="button" className="button secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create app/patient/appointments/page.tsx**

```tsx
// app/patient/appointments/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { Avatar } from "@/components/avatar";
import { getPatientBookings, type BookingRecord } from "@/lib/patient-bookings";

export default function AppointmentsPage() {
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();
    return onAuthStateChanged(auth, u => {
      if (!u) { router.push("/patient"); return; }
      getPatientBookings(u.uid).then(setBookings);
    });
  }, [router]);

  const upcoming = bookings.filter(b => b.status === "upcoming");
  const past = bookings.filter(b => b.status !== "upcoming");

  return (
    <div className="site-shell" style={{ paddingTop: "2rem", paddingBottom: "4rem" }}>
      <h1>My Appointments</h1>
      {upcoming.length > 0 && (
        <section style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>Upcoming</h2>
          {upcoming.map(b => <BookingRow key={b.id} booking={b} />)}
        </section>
      )}
      {past.length > 0 && (
        <section>
          <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>Past</h2>
          {past.map(b => <BookingRow key={b.id} booking={b} />)}
        </section>
      )}
      {bookings.length === 0 && <p style={{ color: "#5E7A84" }}>No appointments yet.</p>}
    </div>
  );
}

function BookingRow({ booking }: { booking: BookingRecord }) {
  const date = booking.sessionDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  return (
    <Link href={`/patient/appointments/${booking.id}`} style={{ textDecoration: "none" }}>
      <div style={{ background: "#fff", borderRadius: 14, padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "1rem", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", marginBottom: "0.625rem", cursor: "pointer" }}>
        <Avatar name={booking.patientName} imageUrl={booking.patientAvatarUrl} size={44} />
        <div style={{ flex: 1 }}>
          <strong style={{ display: "block", color: "#0C2A38" }}>{booking.patientName}</strong>
          <span style={{ fontSize: 13, color: "#5E7A84" }}>{booking.service} · {date}</span>
        </div>
        {booking.status !== "upcoming"
          ? booking.summaryId
            ? <span style={{ fontSize: 20 }}>📋</span>
            : <span style={{ fontSize: 20, opacity: 0.4 }}>⏳</span>
          : <span style={{ background: "#D8F3F9", color: "#0E7490", fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 999 }}>Upcoming</span>}
      </div>
    </Link>
  );
}
```

- [ ] **Step 4: Create app/patient/appointments/[id]/page.tsx**

```tsx
// app/patient/appointments/[id]/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { Avatar } from "@/components/avatar";
import { getBooking, type BookingRecord } from "@/lib/patient-bookings";
import { getSessionSummary, type SessionSummary } from "@/lib/session-summaries";

export default function AppointmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<BookingRecord | null>(null);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    return onAuthStateChanged(auth, async u => {
      if (!u || !id) return;
      const [b, s] = await Promise.all([getBooking(id), getSessionSummary(id)]);
      setBooking(b);
      setSummary(s);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="site-shell" style={{ paddingTop: "3rem" }}>Loading…</div>;
  if (!booking) return <div className="site-shell" style={{ paddingTop: "3rem" }}>Appointment not found.</div>;

  const date = booking.sessionDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="site-shell" style={{ paddingTop: "2rem", paddingBottom: "4rem", maxWidth: 640 }}>
      <a href="/patient/appointments" style={{ color: "#0891B2", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>← Back to appointments</a>
      <div style={{ background: "#fff", borderRadius: 18, padding: "1.5rem", marginTop: "1.25rem", display: "flex", alignItems: "center", gap: "1rem", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
        <Avatar name={booking.patientName} imageUrl={booking.patientAvatarUrl} size={60} />
        <div>
          <h2 style={{ margin: 0, color: "#0C2A38" }}>{booking.patientName}</h2>
          <p style={{ margin: "4px 0 0", color: "#5E7A84" }}>{booking.service}</p>
          <p style={{ margin: "2px 0 0", color: "#0891B2", fontWeight: 600, fontSize: 14 }}>{date}</p>
        </div>
      </div>

      {summary ? (
        <div style={{ marginTop: "1.5rem", display: "grid", gap: "1rem" }}>
          <h2>Session summary</h2>
          <SummaryBlock title="What we worked on" icon="🩺" body={summary.workedOn} />
          <SummaryBlock title="Exercises assigned" icon="💪" body={summary.exercises} />
          <SummaryBlock title="Next steps & advice" icon="💡" body={summary.nextSteps} />
          {summary.followUpWeeks > 0 && (
            <div style={{ background: "#D8F3F9", borderRadius: 14, padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span>📅</span>
              <strong style={{ color: "#0E7490" }}>Follow-up recommended in {summary.followUpWeeks} week{summary.followUpWeeks > 1 ? "s" : ""}</strong>
            </div>
          )}
        </div>
      ) : (
        <div style={{ marginTop: "1.5rem", background: "#fff", borderRadius: 16, padding: "2rem", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 36 }}>⏳</div>
          <h3>Summary coming soon</h3>
          <p style={{ color: "#5E7A84" }}>Your physio will add a session summary shortly.</p>
        </div>
      )}
    </div>
  );
}

function SummaryBlock({ title, icon, body }: { title: string; icon: string; body: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: "1.25rem", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
      <h3 style={{ margin: "0 0 0.5rem", fontSize: 15, display: "flex", alignItems: "center", gap: "0.5rem" }}><span>{icon}</span>{title}</h3>
      <p style={{ margin: 0, color: "#374151", lineHeight: 1.65 }}>{body}</p>
    </div>
  );
}
```

- [ ] **Step 5: Add navigation links in patient portal sidebar/nav**

In `app/patient/page.tsx` (the patient portal home), add links to the new pages:

```tsx
<Link href="/patient/appointments">My Appointments →</Link>
<Link href="/patient/people">My People →</Link>
```

- [ ] **Step 6: Commit**

```bash
git add components/avatar.tsx app/patient/people/ app/patient/appointments/
git commit -m "feat(web): patient portal — My People and Appointments pages"
```

---

## Task 11: Admin Panel — Summary Write Form

**Files:**
- Create: `components/summary-form.tsx`
- Modify: `app/admin/page.tsx`

**Interfaces:**
- Consumes: `publishSummary` Server Action (Task 9)
- Produces: Summary write form rendered per-booking in admin panel

- [ ] **Step 1: Create components/summary-form.tsx**

```tsx
// components/summary-form.tsx
"use client";
import { useState } from "react";
import { publishSummary, type PublishSummaryInput } from "@/app/admin/actions";

interface SummaryFormProps {
  booking: {
    id: string;
    patientId: string;
    patientType: string;
    patientName: string;
    service: string;
  };
  onPublished: () => void;
}

export function SummaryForm({ booking, onPublished }: SummaryFormProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ workedOn: "", exercises: "", nextSteps: "", followUpWeeks: 2 });

  async function handlePublish() {
    if (!form.workedOn || !form.exercises || !form.nextSteps) return;
    setSaving(true);
    try {
      const input: PublishSummaryInput = {
        bookingId: booking.id,
        patientId: booking.patientId,
        patientType: booking.patientType,
        patientName: booking.patientName,
        service: booking.service,
        ...form,
      };
      await publishSummary(input);
      onPublished();
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="button secondary"
        style={{ fontSize: 13, padding: "4px 12px" }}
      >
        📋 Write summary
      </button>
    );
  }

  return (
    <div style={{ border: "1px solid #D8F3F9", borderRadius: 14, padding: "1.25rem", marginTop: "0.75rem", background: "#FAFFFE" }}>
      <h4 style={{ margin: "0 0 1rem", color: "#0C2A38" }}>Session summary — {booking.patientName}</h4>
      <div style={{ display: "grid", gap: "0.75rem" }}>
        {(["workedOn", "exercises", "nextSteps"] as const).map(field => (
          <label key={field}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#5E7A84", display: "block", marginBottom: 4 }}>
              {field === "workedOn" ? "What we worked on today" : field === "exercises" ? "Exercises assigned" : "Next steps & advice"}
            </span>
            <textarea
              value={form[field]}
              onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
              rows={2}
              style={{ width: "100%", border: "1px solid #D1E8EE", borderRadius: 10, padding: "0.5rem 0.75rem", fontSize: 14, resize: "vertical", boxSizing: "border-box" }}
            />
          </label>
        ))}
        <label>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#5E7A84", display: "block", marginBottom: 4 }}>Recommend follow-up in (weeks, 0 = none)</span>
          <input
            type="number"
            min={0}
            max={52}
            value={form.followUpWeeks}
            onChange={e => setForm(f => ({ ...f, followUpWeeks: parseInt(e.target.value) || 0 }))}
            style={{ border: "1px solid #D1E8EE", borderRadius: 10, padding: "0.5rem 0.75rem", fontSize: 14, width: 80 }}
          />
        </label>
      </div>
      <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
        <button className="button primary" onClick={handlePublish} disabled={saving} style={{ fontSize: 14 }}>
          {saving ? "Publishing…" : "Publish summary"}
        </button>
        <button className="button secondary" onClick={() => setOpen(false)} style={{ fontSize: 14 }}>Cancel</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire SummaryForm into admin bookings table**

In `components/admin-bookings-table.tsx`, import and render `<SummaryForm>` for each completed booking that has no `summaryId`:

```tsx
import { SummaryForm } from "@/components/summary-form";

// Inside each booking row, after the status badge:
{booking.status === "completed" && !booking.summaryId && (
  <SummaryForm
    booking={{
      id: booking.id,
      patientId: booking.patientId ?? booking.bookedBy ?? "",
      patientType: booking.patientType ?? "self",
      patientName: booking.patientName ?? booking.name ?? "Patient",
      service: booking.service ?? "Session",
    }}
    onPublished={() => router.refresh()}
  />
)}
```

- [ ] **Step 3: Commit**

```bash
git add components/summary-form.tsx components/admin-bookings-table.tsx
git commit -m "feat(admin): SummaryForm — write and publish post-session summaries"
```

---

## Task 12: Cal.com Webhook — Merge Pending Selection

**Files:**
- Modify: `app/api/cal-webhook/route.ts`

**Interfaces:**
- Consumes: `pendingSelections/{uid}` written by `WhoIsThisForScreen` (Task 8)
- Produces: `bookings/{bookingId}` updated with `bookedBy`, `patientType`, `patientId`, `patientName`, `patientAvatarUrl`

- [ ] **Step 1: Update webhook handler to read pendingSelections**

In the existing `app/api/cal-webhook/route.ts`, inside the `BOOKING_CREATED` handler block, after saving the booking to Firestore, add:

```typescript
// After saving the booking to Firestore:
// Look up pendingSelection by attendee email to find Firebase uid
const usersSnap = await adminDb
  .collection("users")
  .where("email", "==", attendeeEmail)
  .limit(1)
  .get();

if (!usersSnap.empty) {
  const userId = usersSnap.docs[0].id;
  const selectionSnap = await adminDb.doc(`pendingSelections/${userId}`).get();

  if (selectionSnap.exists) {
    const sel = selectionSnap.data()!;
    // Merge dependent info into the booking
    await adminDb.doc(`bookings/${bookingDocId}`).update({
      bookedBy: userId,
      patientType: sel.patientType,
      patientId: sel.patientId,
      patientName: sel.patientName,
      patientAvatarUrl: sel.patientAvatarUrl ?? "",
    });
    // Clear the pending selection
    await adminDb.doc(`pendingSelections/${userId}`).delete();
  } else {
    // No pending selection — booking is for self
    await adminDb.doc(`bookings/${bookingDocId}`).update({
      bookedBy: userId,
      patientType: "self",
      patientId: userId,
      patientName: usersSnap.docs[0].data().displayName ?? "Patient",
    });
  }
}
```

Note: `attendeeEmail` is the attendee's email from the Cal.com payload. `bookingDocId` is the Firestore document ID created when saving the booking in this same handler. Check the existing webhook handler for the exact variable names and insert this block after the initial `setDoc` call.

- [ ] **Step 2: Test the webhook locally**

```bash
# Start dev server
npm run dev

# In a second terminal, simulate a webhook:
curl -X POST http://localhost:3000/api/cal-webhook \
  -H "Content-Type: application/json" \
  -d '{"triggerEvent":"BOOKING_CREATED","payload":{"uid":"test123","attendees":[{"email":"test@example.com","name":"Test User"}],"eventType":{"title":"Initial Assessment"},"startTime":"2026-07-15T10:00:00Z","status":"ACCEPTED"}}'
```

Expected: 200 response, booking created in Firestore with `bookedBy`, `patientType: "self"` (since no pendingSelection exists for that email in test).

- [ ] **Step 3: Commit**

```bash
git add app/api/cal-webhook/route.ts
git commit -m "feat(webhook): merge pendingSelection into booking on BOOKING_CREATED"
```

---

## Final Verification

- [ ] `flutter analyze` in `mobile_app/` — no errors
- [ ] `npm run build` in project root — no TypeScript errors
- [ ] Test on physical device: add dependent → book for them → confirm Cal.com opens
- [ ] Test admin: mark booking completed → write summary → verify FCM notification received
- [ ] Test web portal: `/patient/appointments` shows bookings, `/patient/appointments/[id]` shows summary
- [ ] Test web portal: `/patient/people` — add, view, remove dependents
