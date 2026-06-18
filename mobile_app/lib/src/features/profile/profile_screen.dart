import 'dart:typed_data';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';

import '../appointments/appointments_screen.dart';
import '../auth/auth_sheet.dart';
import '../people/people_screen.dart';
import 'exercise_video.dart';
import 'rehab_program.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return SafeArea(
      child: StreamBuilder<User?>(
        stream: FirebaseAuth.instance.authStateChanges(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          final user = snapshot.data;

          if (user == null) {
            return ListView(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
              children: [
                Text('Patient profile', style: theme.textTheme.headlineMedium),
                const SizedBox(height: 8),
                Text(
                  'Sign in or create an account to unlock bookings, rehab plans and secure uploads.',
                  style: theme.textTheme.bodyLarge,
                ),
                const SizedBox(height: 18),
                const AuthSheet(),
              ],
            );
          }

          return ListView(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
            children: [
              Text('Patient profile', style: theme.textTheme.headlineMedium),
              const SizedBox(height: 8),
              Text(
                'Your mobile patient area is now connected to Firebase Authentication, rehab programmes and exercise content.',
                style: theme.textTheme.bodyLarge,
              ),
              const SizedBox(height: 18),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        user.displayName?.isNotEmpty == true ? user.displayName! : 'Patient account',
                        style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 8),
                      Text(user.email ?? 'No email', style: theme.textTheme.bodyMedium),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: () => FirebaseAuth.instance.signOut(),
                        child: const Text('Sign out'),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 18),
              _QuickLinkTile(
                icon: Icons.people_rounded,
                label: 'My People',
                subtitle: 'Manage family & friends',
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const PeopleScreen()),
                ),
              ),
              const SizedBox(height: 10),
              _QuickLinkTile(
                icon: Icons.calendar_month_rounded,
                label: 'My Appointments',
                subtitle: 'View history & session summaries',
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const AppointmentsScreen()),
                ),
              ),
              const SizedBox(height: 18),
              Text('Assigned rehab programmes', style: theme.textTheme.titleLarge),
              const SizedBox(height: 12),
              _RehabProgramsSection(userEmail: user.email ?? ''),
              const SizedBox(height: 18),
              Text('Saved blog articles', style: theme.textTheme.titleLarge),
              const SizedBox(height: 12),
              _SavedBlogsSection(user: user),
              const SizedBox(height: 18),
              Text('Secure document uploads', style: theme.textTheme.titleLarge),
              const SizedBox(height: 12),
              _SecureUploadsSection(user: user),
            ],
          );
        },
      ),
    );
  }
}

class _SavedBlogsSection extends StatelessWidget {
  const _SavedBlogsSection({required this.user});

  final User user;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
      stream: FirebaseFirestore.instance
          .collection('patients')
          .doc(user.uid)
          .collection('favoriteBlogs')
          .orderBy('savedAt', descending: true)
          .snapshots(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Card(
            child: Padding(
              padding: EdgeInsets.all(18),
              child: CircularProgressIndicator(),
            ),
          );
        }

        if (snapshot.hasError) {
          return Card(
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Text(
                'We could not load saved blog articles right now.',
                style: theme.textTheme.bodyMedium,
              ),
            ),
          );
        }

        final docs = snapshot.data?.docs ?? <QueryDocumentSnapshot<Map<String, dynamic>>>[];

        if (docs.isEmpty) {
          return Card(
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Text(
                'No blogs saved yet. Tap the star in the blog tab to build your favourites list.',
                style: theme.textTheme.bodyMedium,
              ),
            ),
          );
        }

        return Card(
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              children: docs.map((doc) {
                final data = doc.data();
                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.star_rounded, color: Color(0xFFE0A106)),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              (data['title'] as String?) ?? 'Saved article',
                              style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              (data['category'] as String?) ?? '',
                              style: theme.textTheme.bodySmall,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
          ),
        );
      },
    );
  }
}

class _SecureUploadsSection extends StatefulWidget {
  const _SecureUploadsSection({required this.user});

  final User user;

  @override
  State<_SecureUploadsSection> createState() => _SecureUploadsSectionState();
}

class _SecureUploadsSectionState extends State<_SecureUploadsSection> {
  bool isUploading = false;
  String? feedback;

  Future<void> _pickAndUpload() async {
    setState(() {
      isUploading = true;
      feedback = null;
    });

    try {
      final result = await FilePicker.platform.pickFiles(
        allowMultiple: false,
        withData: true,
        type: FileType.custom,
        allowedExtensions: const ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'],
      );

      if (result == null || result.files.isEmpty) {
        setState(() => isUploading = false);
        return;
      }

      final picked = result.files.single;
      final Uint8List? bytes = picked.bytes;

      if (bytes == null) {
        setState(() {
          isUploading = false;
          feedback = 'We could not read that file. Please try another document.';
        });
        return;
      }

      final fileName = picked.name.replaceAll(RegExp(r'[^a-zA-Z0-9._-]'), '_');
      final storagePath =
          'patient-uploads/${widget.user.uid}/${DateTime.now().millisecondsSinceEpoch}_$fileName';

      final ref = FirebaseStorage.instance.ref(storagePath);
      final metadata = SettableMetadata(
        contentType: picked.extension == 'pdf'
            ? 'application/pdf'
            : picked.extension == 'png'
                ? 'image/png'
                : 'image/jpeg',
      );

      await ref.putData(bytes, metadata);
      final downloadUrl = await ref.getDownloadURL();

      await FirebaseFirestore.instance
          .collection('patients')
          .doc(widget.user.uid)
          .collection('uploads')
          .add({
        'fileName': picked.name,
        'downloadUrl': downloadUrl,
        'storagePath': storagePath,
        'size': picked.size,
        'uploadedAt': FieldValue.serverTimestamp(),
        'uploadedBy': widget.user.email ?? '',
        'extension': picked.extension ?? '',
      });

      if (mounted) {
        setState(() {
          isUploading = false;
          feedback = 'Document uploaded successfully.';
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          isUploading = false;
          feedback = 'We could not upload that document right now.';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Upload MRI reports, X-rays, GP letters or discharge summaries.',
              style: theme.textTheme.bodyMedium,
            ),
            const SizedBox(height: 14),
            ElevatedButton.icon(
              onPressed: isUploading ? null : _pickAndUpload,
              icon: const Icon(Icons.upload_file_rounded),
              label: Text(isUploading ? 'Uploading...' : 'Upload document'),
            ),
            if (feedback != null) ...[
              const SizedBox(height: 12),
              Text(
                feedback!,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: feedback!.contains('successfully')
                      ? const Color(0xFF2380C8)
                      : const Color(0xFF9C3F27),
                ),
              ),
            ],
            const SizedBox(height: 18),
            Text(
              'Uploaded files',
              style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 10),
            StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
              stream: FirebaseFirestore.instance
                  .collection('patients')
                  .doc(widget.user.uid)
                  .collection('uploads')
                  .orderBy('uploadedAt', descending: true)
                  .snapshots(),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Padding(
                    padding: EdgeInsets.symmetric(vertical: 8),
                    child: CircularProgressIndicator(),
                  );
                }

                if (snapshot.hasError) {
                  return Text(
                    'We could not load uploaded documents right now.',
                    style: theme.textTheme.bodyMedium,
                  );
                }

                final docs = snapshot.data?.docs ?? <QueryDocumentSnapshot<Map<String, dynamic>>>[];

                if (docs.isEmpty) {
                  return Text(
                    'No documents uploaded yet.',
                    style: theme.textTheme.bodyMedium,
                  );
                }

                return Column(
                  children: docs.map((doc) {
                    final data = doc.data();
                    final uploadedAt = (data['uploadedAt'] as Timestamp?)?.toDate();
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEAF3FB),
                          borderRadius: BorderRadius.circular(18),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(Icons.description_rounded, color: Color(0xFF2380C8)),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    (data['fileName'] as String?) ?? 'Document',
                                    style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    uploadedAt == null
                                        ? 'Uploaded just now'
                                        : 'Uploaded ${uploadedAt.day}/${uploadedAt.month}/${uploadedAt.year}',
                                    style: theme.textTheme.bodySmall,
                                  ),
                                  const SizedBox(height: 6),
                                  SelectableText(
                                    (data['downloadUrl'] as String?) ?? '',
                                    style: theme.textTheme.bodySmall?.copyWith(
                                      color: const Color(0xFF2380C8),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _RehabProgramsSection extends StatelessWidget {
  const _RehabProgramsSection({required this.userEmail});

  final String userEmail;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
      stream: FirebaseFirestore.instance
          .collection('rehabPrograms')
          .where('patientEmail', isEqualTo: userEmail)
          .snapshots(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }

        if (snapshot.hasError) {
          return Card(
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Text(
                'We could not load rehab programmes right now.',
                style: theme.textTheme.bodyMedium,
              ),
            ),
          );
        }

        final programs = snapshot.data?.docs
                .map((doc) => RehabProgram.fromMap(doc.data(), doc.id))
                .toList() ??
            <RehabProgram>[];

        if (programs.isEmpty) {
          return Card(
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Text(
                'No rehab programme is assigned to this email yet. Make sure the signed-in email matches the patientEmail in Firebase.',
                style: theme.textTheme.bodyMedium,
              ),
            ),
          );
        }

        return Column(
          children: programs.map((program) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 14),
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(program.title, style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
                      const SizedBox(height: 6),
                      Text(program.stage, style: theme.textTheme.bodyMedium),
                      if (program.notes.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        Text(program.notes, style: theme.textTheme.bodyMedium),
                      ],
                      if (program.goals.isNotEmpty) ...[
                        const SizedBox(height: 14),
                        Text('Goals', style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700)),
                        const SizedBox(height: 8),
                        ...program.goals.map((goal) => _Bullet(goal)),
                      ],
                      const SizedBox(height: 14),
                      Text('Assigned exercises', style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700)),
                      const SizedBox(height: 10),
                      _ExerciseLibrarySection(exerciseIds: program.exerciseIds),
                    ],
                  ),
                ),
              ),
            );
          }).toList(),
        );
      },
    );
  }
}

class _ExerciseLibrarySection extends StatelessWidget {
  const _ExerciseLibrarySection({required this.exerciseIds});

  final List<String> exerciseIds;

  Future<List<ExerciseVideo>> _loadExercises() async {
    if (exerciseIds.isEmpty) {
      return <ExerciseVideo>[];
    }

    final snapshot = await FirebaseFirestore.instance
        .collection('exerciseVideos')
        .where(FieldPath.documentId, whereIn: exerciseIds.take(10).toList())
        .get();

    final items = snapshot.docs
        .map((doc) => ExerciseVideo.fromMap(doc.data(), doc.id))
        .toList();

    items.sort((a, b) => exerciseIds.indexOf(a.id).compareTo(exerciseIds.indexOf(b.id)));
    return items;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return FutureBuilder<List<ExerciseVideo>>(
      future: _loadExercises(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Padding(
            padding: EdgeInsets.symmetric(vertical: 8),
            child: CircularProgressIndicator(),
          );
        }

        final items = snapshot.data ?? <ExerciseVideo>[];

        if (items.isEmpty) {
          return Text('No exercises assigned yet.', style: theme.textTheme.bodyMedium);
        }

        return Column(
          children: items.map((item) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFEAF3FB),
                  borderRadius: BorderRadius.circular(18),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(item.title, style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700)),
                    const SizedBox(height: 6),
                    Text('${item.condition} • ${item.stage}', style: theme.textTheme.bodyMedium),
                    const SizedBox(height: 6),
                    Text(item.description, style: theme.textTheme.bodyMedium),
                    if (item.videoUrl.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      SelectableText(
                        item.videoUrl,
                        style: theme.textTheme.bodySmall?.copyWith(color: const Color(0xFF2380C8)),
                      ),
                    ],
                  ],
                ),
              ),
            );
          }).toList(),
        );
      },
    );
  }
}

class _QuickLinkTile extends StatelessWidget {
  const _QuickLinkTile({
    required this.icon,
    required this.label,
    required this.subtitle,
    required this.onTap,
  });

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
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 8,
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: const Color(0xFFD8F3F9),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: const Color(0xFF0891B2), size: 22),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                  ),
                  Text(
                    subtitle,
                    style: const TextStyle(fontSize: 12, color: Color(0xFF5E7A84)),
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

class _Bullet extends StatelessWidget {
  const _Bullet(this.label);

  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.only(top: 4),
            child: Icon(Icons.check_circle_rounded, size: 18, color: Color(0xFF2380C8)),
          ),
          const SizedBox(width: 10),
          Expanded(child: Text(label)),
        ],
      ),
    );
  }
}
