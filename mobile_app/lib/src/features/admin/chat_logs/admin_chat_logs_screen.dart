import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../core/app_colors.dart';

class AdminChatLogsScreen extends StatefulWidget {
  const AdminChatLogsScreen({super.key});

  @override
  State<AdminChatLogsScreen> createState() => _AdminChatLogsScreenState();
}

class _AdminChatLogsScreenState extends State<AdminChatLogsScreen> {
  String _search = '';
  String? _expandedId;

  String _date(dynamic value) {
    if (value is Timestamp) {
      return DateFormat('d MMM yyyy, HH:mm').format(value.toDate().toLocal());
    }
    return 'No date';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(title: const Text('Chat logs')),
      body: StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
        stream: FirebaseFirestore.instance
            .collectionGroup('chatSessions')
            .orderBy('updatedAt', descending: true)
            .limit(100)
            .snapshots(),
        builder: (context, snapshot) {
          if (snapshot.hasError) {
            return const Center(child: Text('Could not load chat sessions.'));
          }
          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator());
          }
          final sessions = snapshot.data!.docs.where((doc) {
            if (_search.trim().isEmpty) return true;
            final q = _search.toLowerCase();
            final data = doc.data();
            final patientId = doc.reference.parent.parent?.id ?? '';
            final messages = (data['messages'] as List<dynamic>? ?? const []);
            return patientId.toLowerCase().contains(q) ||
                messages.any(
                  (msg) => '${(msg as Map?)?['text'] ?? ''}'
                      .toLowerCase()
                      .contains(q),
                );
          }).toList();

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              TextField(
                decoration: const InputDecoration(
                  hintText: 'Search patient id or message',
                  prefixIcon: Icon(Icons.search_rounded),
                  border: OutlineInputBorder(),
                ),
                onChanged: (value) => setState(() => _search = value),
              ),
              const SizedBox(height: 14),
              if (sessions.isEmpty)
                const Card(
                  child: Padding(
                    padding: EdgeInsets.all(18),
                    child: Text('No chat sessions found.'),
                  ),
                ),
              ...sessions.map((doc) {
                final data = doc.data();
                final messages =
                    (data['messages'] as List<dynamic>? ?? const [])
                        .whereType<Map<dynamic, dynamic>>()
                        .toList();
                final patientId = doc.reference.parent.parent?.id ?? 'Patient';
                final preview = messages.firstWhere(
                  (msg) => msg['role'] == 'user',
                  orElse: () => const {'text': 'No patient message'},
                );
                final isOpen = _expandedId == doc.id;
                return Card(
                  child: Column(
                    children: [
                      ListTile(
                        title: Text(
                          patientId,
                          style: const TextStyle(fontWeight: FontWeight.w800),
                        ),
                        subtitle: Text(
                          '${preview['text'] ?? ''}\n${_date(data['updatedAt'])}',
                        ),
                        isThreeLine: true,
                        trailing: Icon(
                          isOpen ? Icons.expand_less : Icons.expand_more,
                        ),
                        onTap: () => setState(
                          () => _expandedId = isOpen ? null : doc.id,
                        ),
                      ),
                      if (isOpen)
                        Padding(
                          padding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
                          child: Column(
                            children: messages.map((msg) {
                              final isUser = msg['role'] == 'user';
                              return Align(
                                alignment: isUser
                                    ? Alignment.centerRight
                                    : Alignment.centerLeft,
                                child: Container(
                                  margin: const EdgeInsets.symmetric(
                                    vertical: 4,
                                  ),
                                  padding: const EdgeInsets.all(10),
                                  constraints: const BoxConstraints(
                                    maxWidth: 280,
                                  ),
                                  decoration: BoxDecoration(
                                    color: isUser
                                        ? AppColors.teal
                                        : AppColors.tealLight,
                                    borderRadius: BorderRadius.circular(14),
                                  ),
                                  child: Text(
                                    '${msg['text'] ?? ''}',
                                    style: TextStyle(
                                      color: isUser
                                          ? Colors.white
                                          : AppColors.textPrimary,
                                    ),
                                  ),
                                ),
                              );
                            }).toList(),
                          ),
                        ),
                    ],
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
