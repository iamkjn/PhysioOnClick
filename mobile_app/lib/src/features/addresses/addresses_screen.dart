import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '../booking/home_visit_repository.dart';
import 'address_repository.dart';

const kOutsideAreaLabel = 'Outside our home-visit area';
const kNoAddressesCopy = 'No saved addresses yet. Add one to book home visits faster.';

/// Account -> Addresses. Addresses/postcodes are personal data: never logged.
class AddressesScreen extends StatefulWidget {
  AddressesScreen({
    super.key,
    String? uid,
    AddressRepository? addressRepository,
    HomeVisitRepository? homeVisitRepository,
  })  : uid = uid ?? FirebaseAuth.instance.currentUser!.uid,
        addressRepository = addressRepository ?? AddressRepository(),
        homeVisitRepository = homeVisitRepository ?? HomeVisitRepository();

  final String uid;
  final AddressRepository addressRepository;
  final HomeVisitRepository homeVisitRepository;

  @override
  State<AddressesScreen> createState() => _AddressesScreenState();
}

class _AddressesScreenState extends State<AddressesScreen> {
  List<SavedAddress>? _items;
  String? _error;
  // postcode -> covered; absent = unknown (no badge).
  final Map<String, bool> _coverage = {};

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final list = await widget.addressRepository.getAddresses(widget.uid);
      if (!mounted) return;
      setState(() {
        _items = list;
        _error = null;
      });
      for (final a in list) {
        _checkCoverage(a.postcode);
      }
    } catch (_) {
      if (!mounted) return;
      setState(() => _error = "Couldn't load your addresses. Pull to try again.");
    }
  }

  Future<void> _checkCoverage(String postcode) async {
    if (_coverage.containsKey(postcode)) return;
    try {
      final r = await widget.homeVisitRepository.checkCoverage(postcode);
      if (mounted) setState(() => _coverage[postcode] = r.covered);
    } catch (_) {
      // Unknown: show no badge rather than a wrong one.
    }
  }

  Future<void> _openForm([SavedAddress? existing]) async {
    final saved = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (_) => AddressForm(
        uid: widget.uid,
        existing: existing,
        addressRepository: widget.addressRepository,
        homeVisitRepository: widget.homeVisitRepository,
      ),
    );
    if (saved == true) await _load();
  }

  Future<void> _delete(SavedAddress a) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete this address?'),
        content: const Text(
            'Anyone using it as their usual address for home visits will no longer have one set.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await widget.addressRepository.deleteAddress(widget.uid, a.id);
      await _load();
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Couldn't delete that address. Try again.")));
    }
  }

  @override
  Widget build(BuildContext context) {
    final items = _items;
    Widget body;
    if (_error != null) {
      body = Center(child: Padding(padding: const EdgeInsets.all(24), child: Text(_error!)));
    } else if (items == null) {
      body = const Center(child: CircularProgressIndicator());
    } else {
      body = RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
          children: [
            if (items.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 24),
                child: Text(kNoAddressesCopy, textAlign: TextAlign.center),
              ),
            ...items.map((a) => Card(
                  child: ListTile(
                    title: Text(a.label.isNotEmpty ? a.label : a.line),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (a.label.isNotEmpty) Text(a.line),
                        Text(a.postcode),
                        if (_coverage[a.postcode] == false) const OutsideAreaBadge(),
                      ],
                    ),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        IconButton(
                          tooltip: 'Edit address',
                          icon: const Icon(Icons.edit_rounded, size: 18),
                          onPressed: () => _openForm(a),
                        ),
                        IconButton(
                          tooltip: 'Delete address',
                          icon: const Icon(Icons.delete_outline_rounded,
                              size: 18, color: Colors.red),
                          onPressed: () => _delete(a),
                        ),
                      ],
                    ),
                  ),
                )),
            const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: () => _openForm(),
              icon: const Icon(Icons.add_location_alt_rounded),
              label: const Text('Add an address'),
              style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(50)),
            ),
          ],
        ),
      );
    }
    return Scaffold(appBar: AppBar(title: const Text('Addresses')), body: body);
  }
}

class OutsideAreaBadge extends StatelessWidget {
  const OutsideAreaBadge({super.key});
  @override
  Widget build(BuildContext context) => Container(
        margin: const EdgeInsets.only(top: 4),
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
        decoration: BoxDecoration(
          color: const Color(0xFFFFF4E5),
          borderRadius: BorderRadius.circular(999),
        ),
        child: const Text(kOutsideAreaLabel,
            style: TextStyle(fontSize: 11, color: Color(0xFF9A5B00), fontWeight: FontWeight.w600)),
      );
}

enum _Cov { idle, checking, covered, uncovered, failed }

/// Add/edit form: postcode -> coverage -> address dropdown (covered) or manual.
/// Saving outside the area is allowed (badged).
class AddressForm extends StatefulWidget {
  const AddressForm({
    super.key,
    required this.uid,
    required this.addressRepository,
    required this.homeVisitRepository,
    this.existing,
  });
  final String uid;
  final SavedAddress? existing;
  final AddressRepository addressRepository;
  final HomeVisitRepository homeVisitRepository;

  @override
  State<AddressForm> createState() => _AddressFormState();
}

class _AddressFormState extends State<AddressForm> {
  late final _label = TextEditingController(text: widget.existing?.label ?? '');
  late final _line = TextEditingController(text: widget.existing?.line ?? '');
  late final _postcode = TextEditingController(text: widget.existing?.postcode ?? '');
  _Cov _cov = _Cov.idle;
  List<AddressSuggestion> _suggestions = const [];
  String? _selected;
  String? _error;
  bool _saving = false;
  int _seq = 0;

  @override
  void dispose() {
    _label.dispose();
    _line.dispose();
    _postcode.dispose();
    super.dispose();
  }

  Future<void> _find() async {
    final pc = _postcode.text.trim();
    if (pc.isEmpty) return;
    final seq = ++_seq;
    setState(() {
      _cov = _Cov.checking;
      _suggestions = const [];
      _selected = null;
      _error = null;
    });
    try {
      final r = await widget.homeVisitRepository.checkCoverage(pc);
      if (!mounted || seq != _seq) return;
      setState(() => _cov = r.covered ? _Cov.covered : _Cov.uncovered);
      if (!r.covered) return;
      try {
        final list = await widget.homeVisitRepository.lookupAddresses(pc);
        if (!mounted || seq != _seq) return;
        setState(() => _suggestions = list);
      } catch (_) {
        // Manual entry stays available.
      }
    } catch (_) {
      if (!mounted || seq != _seq) return;
      setState(() => _cov = _Cov.failed);
    }
  }

  Future<void> _pick(String? id) async {
    if (id == null) return;
    setState(() => _selected = id);
    try {
      final a = await widget.homeVisitRepository.resolveAddress(id);
      if (!mounted) return;
      setState(() {
        _line.text = a.line;
        _postcode.text = a.postcode;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _error = "Couldn't fetch that address. Type it in below instead.");
    }
  }

  Future<void> _save() async {
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      final e = widget.existing;
      if (e == null) {
        await widget.addressRepository.addAddress(widget.uid,
            label: _label.text, line: _line.text, postcode: _postcode.text);
      } else {
        await widget.addressRepository.updateAddress(e.id,
            label: _label.text, line: _line.text, postcode: _postcode.text);
      }
      if (mounted) Navigator.pop(context, true);
    } on AddressValidationException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } catch (_) {
      if (mounted) setState(() => _error = "Couldn't save the address. Try again.");
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(16, 16, 16, 16 + MediaQuery.of(context).viewInsets.bottom),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(widget.existing == null ? 'Add an address' : 'Edit address',
                style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 12),
            TextField(
              key: const Key('address-label'),
              controller: _label,
              maxLength: kAddressLabelMax,
              decoration: const InputDecoration(labelText: 'Label (optional, e.g. Home, Mum\'s)'),
            ),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    key: const Key('address-postcode'),
                    controller: _postcode,
                    maxLength: kAddressPostcodeMax,
                    textCapitalization: TextCapitalization.characters,
                    decoration: const InputDecoration(labelText: 'Postcode'),
                  ),
                ),
                const SizedBox(width: 8),
                TextButton(
                  onPressed: _cov == _Cov.checking ? null : _find,
                  child: const Text('Find address'),
                ),
              ],
            ),
            if (_cov == _Cov.checking) const LinearProgressIndicator(),
            if (_cov == _Cov.uncovered)
              const Align(alignment: Alignment.centerLeft, child: OutsideAreaBadge()),
            if (_cov == _Cov.failed)
              const Text("Couldn't check that postcode. You can still type the address below."),
            if (_suggestions.isNotEmpty)
              DropdownButtonFormField<String>(
                key: const Key('address-dropdown'),
                initialValue: _selected,
                isExpanded: true,
                hint: const Text('Choose your address'),
                items: _suggestions
                    .map((s) => DropdownMenuItem(
                        value: s.id, child: Text(s.label, overflow: TextOverflow.ellipsis)))
                    .toList(),
                onChanged: _pick,
              ),
            TextField(
              key: const Key('address-line'),
              controller: _line,
              maxLength: kAddressLineMax,
              decoration: const InputDecoration(labelText: 'Address'),
            ),
            if (_error != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Text(_error!, style: const TextStyle(color: Colors.red)),
              ),
            FilledButton(
              onPressed: _saving ? null : _save,
              child: const Text('Save address'),
            ),
          ],
        ),
      ),
    );
  }
}
