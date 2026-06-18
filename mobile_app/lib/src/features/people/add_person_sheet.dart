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
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
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
            Text(
              isEdit ? 'Edit person' : 'Add a person',
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 20),
            TextField(
              controller: _nameCtrl,
              onChanged: (_) => setState(() {}),
              decoration: const InputDecoration(
                labelText: 'Full name',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 14),
            DropdownButtonFormField<String>(
              value: _relationship,
              decoration: const InputDecoration(
                labelText: 'Relationship',
                border: OutlineInputBorder(),
              ),
              items: _relationships
                  .map((r) => DropdownMenuItem(value: r, child: Text(r)))
                  .toList(),
              onChanged: (v) => setState(() => _relationship = v!),
            ),
            const SizedBox(height: 14),
            InkWell(
              onTap: _pickDob,
              child: InputDecorator(
                decoration: const InputDecoration(
                  labelText: 'Date of birth',
                  border: OutlineInputBorder(),
                ),
                child: Text(
                  _dob != null
                      ? '${_dob!.day}/${_dob!.month}/${_dob!.year}'
                      : 'Tap to select',
                  style: TextStyle(
                    color: _dob != null ? Colors.black87 : Colors.grey[600],
                  ),
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
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: _saving
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : Text(
                      isEdit ? 'Save changes' : 'Add person',
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
