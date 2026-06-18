import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '../../core/widgets/avatar_widget.dart';
import '../people/add_person_sheet.dart';
import '../people/dependent_model.dart';
import '../people/people_repository.dart';
import 'booking_screen.dart';

class WhoIsThisForScreen extends StatelessWidget {
  const WhoIsThisForScreen({super.key});

  Future<void> _select(
    BuildContext context, {
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
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const BookingScreen()),
      );
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
              Text(
                'Select who you\'re booking for',
                style: theme.textTheme.bodyMedium
                    ?.copyWith(color: const Color(0xFF5E7A84)),
              ),
              const SizedBox(height: 14),
              _SelectionTile(
                name: user.displayName ?? 'Myself',
                subtitle: 'My appointment',
                avatarUrl: user.photoURL,
                onTap: () => _select(
                  context,
                  patientName: user.displayName ?? 'Patient',
                  patientType: 'self',
                  patientId: user.uid,
                  avatarUrl: user.photoURL,
                ),
              ),
              const SizedBox(height: 10),
              ...dependents.map((dep) => Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: _SelectionTile(
                      name: dep.name,
                      subtitle: dep.relationship,
                      avatarUrl: dep.avatarUrl,
                      onTap: () => _select(
                        context,
                        patientName: dep.name,
                        patientType: 'dependent',
                        patientId: dep.id,
                        avatarUrl: dep.avatarUrl,
                      ),
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
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
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
  const _SelectionTile({
    required this.name,
    required this.subtitle,
    this.avatarUrl,
    required this.onTap,
  });

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
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 10,
            ),
          ],
        ),
        child: Row(
          children: [
            AvatarWidget(name: name, imageUrl: avatarUrl, size: 52),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 16,
                    ),
                  ),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      fontSize: 13,
                      color: Color(0xFF5E7A84),
                    ),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right_rounded, color: Color(0xFF9ADCEE)),
          ],
        ),
      ),
    );
  }
}
