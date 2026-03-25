import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '../../core/firebase/patient_account_service.dart';
import '../auth/auth_sheet.dart';
import 'booking_record.dart';

const _services = [
  'Initial Assessment',
  'Follow-Up Session',
  'Extended Session',
  'Initial Online Assessment',
  'Online Follow-Up',
];

class BookingScreen extends StatefulWidget {
  const BookingScreen({super.key});

  @override
  State<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends State<BookingScreen> {
  final _formKey = GlobalKey<FormState>();
  final _fullNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _notesController = TextEditingController();

  String selectedService = _services.first;
  DateTime? selectedDate;
  TimeOfDay? selectedTime;
  String? status;
  bool isSaving = false;

  @override
  void dispose() {
    _fullNameController.dispose();
    _phoneController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: now.add(const Duration(days: 1)),
      firstDate: now,
      lastDate: now.add(const Duration(days: 60)),
    );

    if (picked != null) {
      setState(() => selectedDate = picked);
    }
  }

  Future<void> _pickTime() async {
    final picked = await showTimePicker(
      context: context,
      initialTime: const TimeOfDay(hour: 10, minute: 0),
    );

    if (picked != null) {
      setState(() => selectedTime = picked);
    }
  }

  Future<void> _submit(User user) async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (selectedDate == null || selectedTime == null) {
      setState(() => status = 'Please choose both a preferred date and time.');
      return;
    }

    setState(() {
      isSaving = true;
      status = null;
    });

    final appointmentLabel =
        '${selectedDate!.day}/${selectedDate!.month}/${selectedDate!.year} at ${selectedTime!.format(context)}';

    try {
      await PatientAccountService.ensurePatientRecord(user);
      await FirebaseFirestore.instance.collection('bookings').add({
        'userId': user.uid,
        'fullName': _fullNameController.text.trim(),
        'email': user.email,
        'phone': _phoneController.text.trim(),
        'service': selectedService,
        'appointmentDate':
            '${selectedDate!.year.toString().padLeft(4, '0')}-${selectedDate!.month.toString().padLeft(2, '0')}-${selectedDate!.day.toString().padLeft(2, '0')}',
        'appointmentTime':
            '${selectedTime!.hour.toString().padLeft(2, '0')}:${selectedTime!.minute.toString().padLeft(2, '0')}',
        'appointmentLabel': appointmentLabel,
        'notes': _notesController.text.trim(),
        'status': 'pending',
        'patientRef': 'patients/${user.uid}',
        'source': 'flutter-mobile-app',
        'createdAt': FieldValue.serverTimestamp(),
      });

      setState(() {
        status = 'Booking request saved for $appointmentLabel.';
        isSaving = false;
        selectedDate = null;
        selectedTime = null;
      });
      _formKey.currentState!.reset();
      _fullNameController.clear();
      _phoneController.clear();
      _notesController.clear();
      selectedService = _services.first;
    } catch (_) {
      setState(() {
        status = 'We could not save the booking right now. Please try again.';
        isSaving = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return SafeArea(
      child: StreamBuilder<User?>(
        stream: FirebaseAuth.instance.authStateChanges(),
        builder: (context, authSnapshot) {
          final user = authSnapshot.data;

          if (authSnapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (user == null) {
            return ListView(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
              children: [
                Text('Booking', style: theme.textTheme.headlineMedium),
                const SizedBox(height: 8),
                Text(
                  'Sign in first so appointment requests are linked to the patient account.',
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
              Text('Booking', style: theme.textTheme.headlineMedium),
              const SizedBox(height: 8),
              Text(
                'Request a live appointment slot and view your recent Firebase booking records.',
                style: theme.textTheme.bodyLarge,
              ),
              const SizedBox(height: 18),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(18),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'New appointment request',
                          style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: 16),
                        TextFormField(
                          controller: _fullNameController,
                          decoration: const InputDecoration(labelText: 'Full name'),
                          validator: (value) =>
                              (value ?? '').trim().length < 2 ? 'Enter your full name.' : null,
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          initialValue: user.email ?? '',
                          readOnly: true,
                          decoration: const InputDecoration(labelText: 'Email'),
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: _phoneController,
                          decoration: const InputDecoration(labelText: 'Phone'),
                        ),
                        const SizedBox(height: 12),
                        DropdownButtonFormField<String>(
                          value: selectedService,
                          decoration: const InputDecoration(labelText: 'Service'),
                          items: _services
                              .map((service) => DropdownMenuItem(value: service, child: Text(service)))
                              .toList(),
                          onChanged: (value) {
                            if (value != null) {
                              setState(() => selectedService = value);
                            }
                          },
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: OutlinedButton(
                                onPressed: _pickDate,
                                child: Text(
                                  selectedDate == null
                                      ? 'Choose date'
                                      : '${selectedDate!.day}/${selectedDate!.month}/${selectedDate!.year}',
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: OutlinedButton(
                                onPressed: _pickTime,
                                child: Text(
                                  selectedTime == null ? 'Choose time' : selectedTime!.format(context),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: _notesController,
                          minLines: 3,
                          maxLines: 5,
                          decoration: const InputDecoration(labelText: 'Notes'),
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: isSaving ? null : () => _submit(user),
                          child: Text(isSaving ? 'Saving...' : 'Save booking request'),
                        ),
                        if (status != null) ...[
                          const SizedBox(height: 10),
                          Text(status!, style: theme.textTheme.bodyMedium),
                        ],
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 18),
              Text('Your recent bookings', style: theme.textTheme.titleLarge),
              const SizedBox(height: 12),
              StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
                stream: FirebaseFirestore.instance
                    .collection('bookings')
                    .where('email', isEqualTo: user.email)
                    .snapshots(),
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const Center(child: CircularProgressIndicator());
                  }

                  final items = snapshot.data?.docs
                          .map((doc) => BookingRecord.fromMap(doc.data(), doc.id))
                          .toList() ??
                      <BookingRecord>[];

                  if (items.isEmpty) {
                    return Card(
                      child: Padding(
                        padding: const EdgeInsets.all(18),
                        child: Text(
                          'No bookings found yet for this account.',
                          style: theme.textTheme.bodyMedium,
                        ),
                      ),
                    );
                  }

                  return Column(
                    children: items.map((item) {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Card(
                          child: Padding(
                            padding: const EdgeInsets.all(18),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(item.service, style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
                                const SizedBox(height: 8),
                                Text(item.appointmentLabel, style: theme.textTheme.bodyMedium),
                                const SizedBox(height: 6),
                                Text('Status: ${item.status}', style: theme.textTheme.bodyMedium),
                                if (item.notes.isNotEmpty) ...[
                                  const SizedBox(height: 6),
                                  Text(item.notes, style: theme.textTheme.bodyMedium),
                                ],
                              ],
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  );
                },
              ),
            ],
          );
        },
      ),
    );
  }
}
