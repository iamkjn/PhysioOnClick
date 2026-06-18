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
