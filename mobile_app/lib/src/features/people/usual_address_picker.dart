import 'package:flutter/material.dart';

import '../addresses/address_repository.dart';

const _none = '__none__';

/// "Usual address for home visits" for the account holder (personId null)
/// or a dependent.
class UsualAddressPicker extends StatefulWidget {
  const UsualAddressPicker({
    super.key,
    required this.uid,
    required this.personId,
    required this.addressRepository,
    required this.onAddAddress,
  });
  final String uid;
  final String? personId;
  final AddressRepository addressRepository;

  /// Opens the Addresses screen; the picker reloads when it completes.
  final Future<void> Function() onAddAddress;

  @override
  State<UsualAddressPicker> createState() => _UsualAddressPickerState();
}

class _UsualAddressPickerState extends State<UsualAddressPicker> {
  List<SavedAddress>? _addresses;
  String? _current;
  bool _failed = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final r = widget.addressRepository;
      final list = await r.getAddresses(widget.uid);
      final cur = await r.getUsualAddressId(widget.uid, widget.personId);
      if (!mounted) return;
      setState(() {
        _addresses = list;
        _current = list.any((a) => a.id == cur) ? cur : null;
        _failed = false;
      });
    } catch (_) {
      if (mounted) setState(() => _failed = true);
    }
  }

  Future<void> _set(String? v) async {
    final id = v == _none ? null : v;
    final prev = _current;
    setState(() => _current = id);
    try {
      await widget.addressRepository.setUsualAddress(widget.uid, widget.personId, id);
    } catch (_) {
      if (!mounted) return;
      setState(() => _current = prev);
      ScaffoldMessenger.maybeOf(context)?.showSnackBar(
          const SnackBar(content: Text("Couldn't update the usual address. Try again.")));
    }
  }

  Future<void> _add() async {
    await widget.onAddAddress();
    await _load();
  }

  @override
  Widget build(BuildContext context) {
    final list = _addresses;
    Widget child;
    if (_failed) {
      child = const Text("Couldn't load addresses.", style: TextStyle(fontSize: 13));
    } else if (list == null) {
      child = const SizedBox(height: 4, child: LinearProgressIndicator());
    } else if (list.isEmpty) {
      child = Align(
        alignment: Alignment.centerLeft,
        child: TextButton(onPressed: _add, child: const Text('Add an address')),
      );
    } else {
      child = DropdownButton<String>(
        key: Key('usual-address-${widget.personId ?? 'me'}'),
        isExpanded: true,
        value: _current ?? _none,
        items: [
          const DropdownMenuItem(value: _none, child: Text('No usual address')),
          ...list.map((a) => DropdownMenuItem(
              value: a.id, child: Text(a.display, overflow: TextOverflow.ellipsis))),
        ],
        onChanged: _set,
      );
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Usual address for home visits',
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF5E7A84))),
        child,
      ],
    );
  }
}
