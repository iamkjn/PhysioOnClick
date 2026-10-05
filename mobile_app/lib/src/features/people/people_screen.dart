import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '../../core/app_colors.dart';
import '../../core/widgets/avatar_widget.dart';
import '../../core/widgets/empty_state.dart';
import '../addresses/address_repository.dart';
import '../addresses/addresses_screen.dart';
import 'add_person_sheet.dart';
import 'dependent_model.dart';
import 'people_repository.dart';
import 'usual_address_picker.dart';

class PeopleScreen extends StatelessWidget {
  const PeopleScreen({super.key, this.addressRepository});

  /// Injected in tests; defaults to the real repository.
  final AddressRepository? addressRepository;

  @override
  Widget build(BuildContext context) {
    final user = FirebaseAuth.instance.currentUser!;
    final repo = PeopleRepository();
    final addresses = addressRepository ?? AddressRepository();
    Future<void> openAddresses() => Navigator.push(
      context,
      MaterialPageRoute<void>(
        builder:
            (_) => AddressesScreen(uid: user.uid, addressRepository: addresses),
      ),
    );
    Widget picker(String? personId) => UsualAddressPicker(
      key: ValueKey('usual-${personId ?? 'me'}'),
      uid: user.uid,
      personId: personId,
      addressRepository: addresses,
      onAddAddress: openAddresses,
    );

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
            label: const Text(
              'Add',
              style: TextStyle(
                color: Color(0xFF0891B2),
                fontWeight: FontWeight.w700,
              ),
            ),
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
          return PeopleCardList(
            accountName: user.displayName ?? 'You',
            accountSubtitle: 'Your account · ${user.email ?? ""}',
            accountAvatarUrl: user.photoURL,
            people: snap.data ?? const [],
            pickerFor: picker,
            onAddPerson: () => AddPersonSheet.show(context),
            onEdit: (dep) => AddPersonSheet.show(context, existing: dep),
            onDelete: (dep) => _confirmDelete(context, repo, dep),
          );
        },
      ),
    );
  }

  Future<void> _confirmDelete(
    BuildContext context,
    PeopleRepository repo,
    Dependent dep,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder:
          (_) => AlertDialog(
            title: const Text('Remove person?'),
            content: Text(
              'This will remove ${dep.name} from your account. Their appointment history remains.',
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context, false),
                child: const Text('Cancel'),
              ),
              TextButton(
                onPressed: () => Navigator.pop(context, true),
                child: const Text(
                  'Remove',
                  style: TextStyle(color: Colors.red),
                ),
              ),
            ],
          ),
    );
    if (confirmed == true) await repo.deleteDependent(dep.id);
  }
}

/// The account holder ("You") card — always shown, with its usual-address
/// picker — followed by dependents, or the empty-state prompt when there
/// are none.
class PeopleCardList extends StatelessWidget {
  const PeopleCardList({
    super.key,
    required this.accountName,
    required this.accountSubtitle,
    this.accountAvatarUrl,
    required this.people,
    required this.pickerFor,
    required this.onAddPerson,
    required this.onEdit,
    required this.onDelete,
  });

  final String accountName;
  final String accountSubtitle;
  final String? accountAvatarUrl;
  final List<Dependent> people;
  final Widget Function(String? personId) pickerFor;
  final VoidCallback onAddPerson;
  final void Function(Dependent) onEdit;
  final void Function(Dependent) onDelete;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      children: [
        _PersonCard(
          name: accountName,
          subtitle: accountSubtitle,
          avatarUrl: accountAvatarUrl,
          tag: 'You',
          footer: pickerFor(null),
        ),
        const SizedBox(height: 10),
        if (people.isEmpty)
          EmptyState(
            title: 'Just you for now',
            body:
                'Add a family member or friend to book appointments on their behalf.',
            icon: Icons.group_outlined,
            cta: FilledButton(
              onPressed: onAddPerson,
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.gold,
                foregroundColor: Colors.white,
                minimumSize: const Size(160, 48),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: const Text('Add a Person'),
            ),
          )
        else ...[
          ...people.map(
            (dep) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: _PersonCard(
                name: dep.name,
                subtitle: '${dep.relationship} · ${_age(dep.dob)} years old',
                avatarUrl: dep.avatarUrl,
                onEdit: () => onEdit(dep),
                onDelete: () => onDelete(dep),
                footer: pickerFor(dep.id),
              ),
            ),
          ),
          const SizedBox(height: 8),
          OutlinedButton.icon(
            onPressed: onAddPerson,
            icon: const Icon(Icons.person_add_rounded),
            label: const Text('Add a person'),
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
      ],
    );
  }

  static int _age(String dob) {
    final d = DateTime.tryParse(dob);
    if (d == null) return 0;
    final now = DateTime.now();
    int age = now.year - d.year;
    if (now.month < d.month || (now.month == d.month && now.day < d.day)) age--;
    return age;
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
    this.footer,
  });

  final String name;
  final String subtitle;
  final String? avatarUrl;
  final String? tag;
  final VoidCallback? onEdit;
  final VoidCallback? onDelete;
  final Widget? footer;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 12,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              AvatarWidget(name: name, imageUrl: avatarUrl, size: 52),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          name,
                          style: const TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 16,
                          ),
                        ),
                        if (tag != null) ...[
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: const Color(0xFFD8F3F9),
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: Text(
                              tag!,
                              style: const TextStyle(
                                fontSize: 11,
                                color: Color(0xFF0E7490),
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 3),
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
              if (onEdit != null) ...[
                IconButton(
                  onPressed: onEdit,
                  icon: const Icon(
                    Icons.edit_rounded,
                    size: 18,
                    color: Color(0xFF5E7A84),
                  ),
                ),
                IconButton(
                  onPressed: onDelete,
                  icon: const Icon(
                    Icons.delete_outline_rounded,
                    size: 18,
                    color: Colors.red,
                  ),
                ),
              ],
            ],
          ),
          if (footer != null) ...[const SizedBox(height: 12), footer!],
        ],
      ),
    );
  }
}
