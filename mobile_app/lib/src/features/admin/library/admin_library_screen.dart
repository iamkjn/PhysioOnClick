import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';

import '../../../core/app_colors.dart';

class AdminLibraryScreen extends StatefulWidget {
  const AdminLibraryScreen({super.key});

  @override
  State<AdminLibraryScreen> createState() => _AdminLibraryScreenState();
}

class _AdminLibraryScreenState extends State<AdminLibraryScreen> {
  String _query = '';
  bool _showSelfTests = false;

  @override
  Widget build(BuildContext context) {
    final collection = _showSelfTests ? 'selfTests' : 'exerciseVideos';
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(title: const Text('Library review')),
      body: StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
        stream: FirebaseFirestore.instance
            .collection(collection)
            .limit(250)
            .snapshots(),
        builder: (context, snapshot) {
          if (snapshot.hasError) {
            return const Center(child: Text('Could not load library content.'));
          }
          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator());
          }
          final items = snapshot.data!.docs.where((doc) {
            if (_query.trim().isEmpty) return true;
            final q = _query.toLowerCase();
            final data = doc.data();
            return [
              doc.id,
              data['title'],
              data['bodyPart'],
              data['condition'],
              data['stage'],
              data['clinicalArea'],
            ].join(' ').toLowerCase().contains(q);
          }).toList();

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              SegmentedButton<bool>(
                segments: const [
                  ButtonSegment(value: false, label: Text('Exercises')),
                  ButtonSegment(value: true, label: Text('Self-tests')),
                ],
                selected: {_showSelfTests},
                onSelectionChanged: (value) =>
                    setState(() => _showSelfTests = value.first),
              ),
              const SizedBox(height: 12),
              TextField(
                decoration: const InputDecoration(
                  hintText: 'Search title, area or condition',
                  prefixIcon: Icon(Icons.search_rounded),
                  border: OutlineInputBorder(),
                ),
                onChanged: (value) => setState(() => _query = value),
              ),
              const SizedBox(height: 14),
              Text(
                '${items.length} items',
                style: const TextStyle(color: AppColors.textSecondary),
              ),
              const SizedBox(height: 10),
              if (items.isEmpty)
                const Card(
                  child: Padding(
                    padding: EdgeInsets.all(18),
                    child: Text('No matching library items.'),
                  ),
                ),
              ...items.map((doc) {
                final data = doc.data();
                return Card(
                  child: ListTile(
                    title: Text(
                      '${data['title'] ?? doc.id}',
                      style: const TextStyle(fontWeight: FontWeight.w800),
                    ),
                    subtitle: Text(
                      [
                            data['bodyPart'],
                            data['condition'],
                            data['stage'],
                            data['clinicalArea'],
                          ]
                          .where((value) => '${value ?? ''}'.trim().isNotEmpty)
                          .join(' · '),
                    ),
                    trailing: Text(
                      '${data['status'] ?? data['reviewStatus'] ?? 'Review'}',
                      style: const TextStyle(
                        color: AppColors.teal,
                        fontWeight: FontWeight.w700,
                      ),
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
