import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';

import '../../../core/app_colors.dart';
import '../widgets/admin_pager.dart';
import 'admin_person_row.dart';
import 'admin_recovery_panel_screen.dart';

const _filterOptions = ['all', 'primary', 'dependent'];
const _filterLabels = {'all': 'All', 'primary': 'Primary', 'dependent': 'Dependents'};
const _pageSize = 15;

/// Admin patients list — mirrors web's `AdminPatientsList`
/// (`components/admin-patients-list.tsx`): every primary account holder AND
/// every dependent, flattened into one searchable, filterable list (not
/// just primary accounts with dependents hidden behind a picker sheet).
class AdminPatientListScreen extends StatefulWidget {
  const AdminPatientListScreen({super.key});

  @override
  State<AdminPatientListScreen> createState() => _AdminPatientListScreenState();
}

class _AdminPatientListScreenState extends State<AdminPatientListScreen> {
  List<AdminPersonRow> _rows = [];
  String _search = '';
  String _filter = 'all';
  bool _loading = true;
  bool _error = false;
  int _page = 1;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = false;
    });
    try {
      final results = await Future.wait([
        FirebaseFirestore.instance.collection('patients').get(),
        FirebaseFirestore.instance.collection('dependents').get(),
      ]);
      final patientsSnap = results[0];
      final dependentsSnap = results[1];

      final owners = <String, ({String name, String email})>{};
      final primaries = patientsSnap.docs.map((d) {
        final data = d.data();
        final name = (data['displayName'] as String?)?.isNotEmpty == true ? data['displayName'] as String : 'Unnamed';
        final email = (data['email'] as String?) ?? '';
        owners[d.id] = (name: name, email: email);
        return AdminPersonRow(key: 'p:${d.id}', kind: 'primary', ownerUid: d.id, personId: d.id, name: name, email: email);
      }).toList();

      final dependents = dependentsSnap.docs.map((d) {
        final data = d.data();
        final ownerId = (data['ownerId'] as String?) ?? '';
        final owner = owners[ownerId];
        return AdminPersonRow(
          key: 'd:${d.id}',
          kind: 'dependent',
          ownerUid: ownerId,
          personId: d.id,
          name: (data['name'] as String?)?.isNotEmpty == true ? data['name'] as String : 'Unnamed',
          relationship: (data['relationship'] as String?)?.isNotEmpty == true ? data['relationship'] as String : 'Dependent',
          ownerName: owner?.name ?? 'their primary account',
          ownerEmail: owner?.email ?? '',
        );
      }).toList();

      final rows = [...primaries, ...dependents]..sort((a, b) => a.name.compareTo(b.name));
      if (mounted) setState(() => _rows = rows);
    } catch (_) {
      if (mounted) setState(() => _error = true);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _openPerson(AdminPersonRow row) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => AdminRecoveryPanelScreen(
          patientUid: row.ownerUid,
          patientName: row.kind == 'primary' ? row.name : (row.ownerName ?? 'Patient'),
          personId: row.personId,
          personName: row.name,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final byFilter = _filter == 'all' ? _rows : _rows.where((r) => r.kind == _filter).toList();
    final filtered = byFilter.where((r) => r.matches(_search.trim())).toList();
    final pageCount = filtered.isEmpty ? 1 : (filtered.length / _pageSize).ceil();
    final currentPage = _page.clamp(1, pageCount);
    final paged = filtered.skip((currentPage - 1) * _pageSize).take(_pageSize).toList();
    final counts = {
      for (final f in _filterOptions) f: f == 'all' ? _rows.length : _rows.where((r) => r.kind == f).length,
    };

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(title: const Text('Patients')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: TextField(
              decoration: const InputDecoration(
                hintText: 'Search by name, email or relationship…',
                prefixIcon: Icon(Icons.search),
                border: OutlineInputBorder(),
                isDense: true,
              ),
              onChanged: (v) => setState(() {
                _search = v;
                _page = 1;
              }),
            ),
          ),
          SizedBox(
            height: 44,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              children: _filterOptions.map((f) {
                final selected = _filter == f;
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: ChoiceChip(
                    label: Text('${_filterLabels[f]} (${counts[f]})'),
                    selected: selected,
                    selectedColor: AppColors.teal,
                    showCheckmark: false,
                    labelStyle: TextStyle(
                      color: selected ? Colors.white : AppColors.textPrimary,
                      fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                    ),
                    onSelected: (_) => setState(() {
                      _filter = f;
                      _page = 1;
                    }),
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 8),
          if (_loading)
            const Expanded(child: Center(child: CircularProgressIndicator()))
          else if (_error)
            const Expanded(child: Center(child: Text('Could not load patients. Check your connection and try again.')))
          else if (filtered.isEmpty)
            const Expanded(child: Center(child: Text('No patients match this filter.')))
          else ...[
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                itemCount: paged.length,
                itemBuilder: (context, i) {
                  final row = paged[i];
                  return Card(
                    margin: const EdgeInsets.symmetric(vertical: 4),
                    child: ListTile(
                      leading: CircleAvatar(
                        backgroundColor: AppColors.tealLight,
                        child: Icon(
                          row.kind == 'primary' ? Icons.person_rounded : Icons.family_restroom_rounded,
                          color: AppColors.teal,
                        ),
                      ),
                      title: Text(row.name, style: const TextStyle(fontWeight: FontWeight.w700)),
                      subtitle: Text(
                        row.kind == 'primary'
                            ? row.email
                            : '${row.relationship} of ${row.ownerName}',
                      ),
                      trailing: const Icon(Icons.chevron_right_rounded),
                      onTap: () => _openPerson(row),
                    ),
                  );
                },
              ),
            ),
            if (pageCount > 1)
              AdminPager(
                page: currentPage,
                pageCount: pageCount,
                onPrev: () => setState(() => _page = currentPage - 1),
                onNext: () => setState(() => _page = currentPage + 1),
              ),
          ],
        ],
      ),
    );
  }
}
