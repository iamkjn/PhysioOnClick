import 'package:flutter/material.dart';
import '../../people/people_repository.dart';
import 'recovery_service.dart';
import 'admin_recovery_panel_screen.dart';

class AdminPatientListScreen extends StatefulWidget {
  const AdminPatientListScreen({super.key});

  @override
  State<AdminPatientListScreen> createState() => _AdminPatientListScreenState();
}

class _AdminPatientListScreenState extends State<AdminPatientListScreen> {
  List<Map<String, dynamic>> _patients = [];
  String _search = '';
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    RecoveryService.getPatients().then((list) {
      setState(() {
        _patients = list;
        _loading = false;
      });
    });
  }

  void _selectPatient(Map<String, dynamic> patient) async {
    final uid = patient['uid'] as String;
    final name = (patient['displayName'] as String?) ?? 'Patient';
    final deps = await PeopleRepository().watchDependents(uid).first;

    if (!mounted) return;

    if (deps.isEmpty) {
      Navigator.push(
          context,
          MaterialPageRoute(
              builder: (_) => AdminRecoveryPanelScreen(
                    patientUid: uid,
                    patientName: name,
                    personId: uid,
                    personName: name,
                  )));
      return;
    }

    final options = [
      {'id': uid, 'name': '$name (account holder)'},
      ...deps.map((d) => {'id': d.id, 'name': '${d.name} (${d.relationship})'}),
    ];

    if (!mounted) return;
    showModalBottomSheet(
      context: context,
      builder: (_) => ListView(
        shrinkWrap: true,
        children: [
          const Padding(
            padding: EdgeInsets.all(16),
            child: Text('Select person',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          ),
          ...options.map((opt) => ListTile(
                title: Text(opt['name']!),
                onTap: () {
                  Navigator.pop(context);
                  Navigator.push(
                      context,
                      MaterialPageRoute(
                          builder: (_) => AdminRecoveryPanelScreen(
                                patientUid: uid,
                                patientName: name,
                                personId: opt['id']!,
                                personName: opt['name']!,
                              )));
                },
              )),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _patients.where((p) {
      final n = ((p['displayName'] as String?) ?? '').toLowerCase();
      final e = ((p['email'] as String?) ?? '').toLowerCase();
      return n.contains(_search.toLowerCase()) ||
          e.contains(_search.toLowerCase());
    }).toList();

    return Scaffold(
      appBar: AppBar(title: const Text('Patient Recovery')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              decoration: const InputDecoration(
                hintText: 'Search by name or email…',
                prefixIcon: Icon(Icons.search),
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.all(Radius.circular(12))),
              ),
              onChanged: (v) => setState(() => _search = v),
            ),
          ),
          if (_loading)
            const Expanded(child: Center(child: CircularProgressIndicator()))
          else
            Expanded(
              child: ListView.builder(
                itemCount: filtered.length,
                itemBuilder: (_, i) {
                  final p = filtered[i];
                  return ListTile(
                    leading: const CircleAvatar(child: Icon(Icons.person)),
                    title: Text((p['displayName'] as String?) ?? 'Unnamed'),
                    subtitle: Text((p['email'] as String?) ?? ''),
                    onTap: () => _selectPatient(p),
                  );
                },
              ),
            ),
        ],
      ),
    );
  }
}
