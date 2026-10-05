import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';

import '../../core/app_colors.dart';
import '../profile/exercise_video.dart';

class ExerciseLibraryScreen extends StatefulWidget {
  const ExerciseLibraryScreen({super.key});

  @override
  State<ExerciseLibraryScreen> createState() => _ExerciseLibraryScreenState();
}

class _ExerciseLibraryScreenState extends State<ExerciseLibraryScreen> {
  String _query = '';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(title: const Text('Exercise library')),
      body: StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
        stream: FirebaseFirestore.instance
            .collection('exerciseVideos')
            .limit(250)
            .snapshots(),
        builder: (context, snapshot) {
          if (snapshot.hasError) {
            return const Center(
              child: Text('Could not load exercises right now.'),
            );
          }
          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator());
          }
          final exercises = snapshot.data!.docs.where((doc) {
            if (_query.trim().isEmpty) return true;
            final q = _query.toLowerCase();
            final data = doc.data();
            return [
              doc.id,
              data['title'],
              data['bodyPart'],
              data['condition'],
              data['stage'],
              data['description'],
            ].join(' ').toLowerCase().contains(q);
          }).toList();

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              TextField(
                decoration: const InputDecoration(
                  hintText: 'Search by title, body area or condition',
                  prefixIcon: Icon(Icons.search_rounded),
                  border: OutlineInputBorder(),
                ),
                onChanged: (value) => setState(() => _query = value),
              ),
              const SizedBox(height: 14),
              Text(
                '${exercises.length} exercises',
                style: const TextStyle(color: AppColors.textSecondary),
              ),
              const SizedBox(height: 10),
              ...exercises.map((doc) {
                final data = doc.data();
                return Card(
                  child: ListTile(
                    leading: ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: Image.network(
                        exerciseImageUrl(doc.id),
                        width: 58,
                        height: 58,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(
                          width: 58,
                          height: 58,
                          color: AppColors.tealLight,
                          child: const Icon(
                            Icons.fitness_center_rounded,
                            color: AppColors.teal,
                          ),
                        ),
                      ),
                    ),
                    title: Text(
                      '${data['title'] ?? doc.id}',
                      style: const TextStyle(fontWeight: FontWeight.w800),
                    ),
                    subtitle: Text(
                      [data['bodyPart'], data['condition'], data['stage']]
                          .where((value) => '${value ?? ''}'.trim().isNotEmpty)
                          .join(' · '),
                    ),
                  ),
                );
              }),
            ],
          );
        },
      ),
    );
  }
}
