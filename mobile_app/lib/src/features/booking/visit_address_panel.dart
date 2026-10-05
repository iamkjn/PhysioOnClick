import 'package:flutter/material.dart';

import '../../core/app_colors.dart';
import '../addresses/address_repository.dart';
import '../addresses/outside_area_badge.dart';
import 'home_visit_repository.dart';
import 'models/home_visit.dart';

enum _Switch { idle, checking, uncovered, failed }

/// Step 2: confirms where the home visit is. Step 1 may have preselected the
/// usual address of a different person than the one picked here, so when the
/// picked person's usual address differs we suggest it — never switching
/// silently, and only after a coverage check passes.
class VisitAddressPanel extends StatefulWidget {
  const VisitAddressPanel({
    required this.address,
    required this.step1PersonId,
    required this.selectedPersonId,
    required this.selectedPersonName,
    required this.uid,
    required this.addressRepository,
    required this.homeVisitRepository,
    required this.onChange,
    required this.onAddressChanged,
    super.key,
  });

  final HomeVisitAddress address;

  /// Person (null = account holder) whose usual address step 1 used.
  final String? step1PersonId;
  final String? selectedPersonId;
  final String? selectedPersonName;
  final String? uid;
  final AddressRepository addressRepository;
  final HomeVisitRepository homeVisitRepository;
  final VoidCallback onChange;
  final ValueChanged<HomeVisitAddress> onAddressChanged;

  @override
  State<VisitAddressPanel> createState() => _VisitAddressPanelState();
}

class _VisitAddressPanelState extends State<VisitAddressPanel> {
  SavedAddress? _suggested;
  _Switch _state = _Switch.idle;
  int _seq = 0;

  bool _same(SavedAddress s, HomeVisitAddress a) =>
      normalisePostcode(s.postcode) == normalisePostcode(a.postcode) &&
      s.line.trim().toLowerCase() == a.line.trim().toLowerCase();

  @override
  void initState() {
    super.initState();
    _loadSuggestion();
  }

  @override
  void didUpdateWidget(VisitAddressPanel old) {
    super.didUpdateWidget(old);
    if (old.selectedPersonId != widget.selectedPersonId) {
      _loadSuggestion();
    } else if (_suggested != null && _same(_suggested!, widget.address)) {
      setState(() => _suggested = null);
    }
  }

  Future<void> _loadSuggestion() async {
    final seq = ++_seq;
    setState(() {
      _suggested = null;
      _state = _Switch.idle;
    });
    final uid = widget.uid;
    if (uid == null || widget.selectedPersonId == widget.step1PersonId) return;
    try {
      final id = await widget.addressRepository.getUsualAddressId(uid, widget.selectedPersonId);
      if (id == null) return;
      final all = await widget.addressRepository.getAddresses(uid);
      if (!mounted || seq != _seq) return;
      SavedAddress? found;
      for (final a in all) {
        if (a.id == id) found = a;
      }
      if (found == null || _same(found, widget.address)) return;
      setState(() => _suggested = found);
    } catch (_) {
      // A suggestion is a convenience; keep the chosen address.
    }
  }

  Future<void> _useSuggested() async {
    final s = _suggested;
    if (s == null) return;
    final seq = _seq;
    setState(() => _state = _Switch.checking);
    try {
      final r = await widget.homeVisitRepository.checkCoverage(s.postcode);
      if (!mounted || seq != _seq) return;
      if (!r.covered) {
        setState(() => _state = _Switch.uncovered);
        return;
      }
      setState(() {
        _state = _Switch.idle;
        _suggested = null;
      });
      widget.onAddressChanged(
          HomeVisitAddress(line: s.line, postcode: normalisePostcode(s.postcode)));
    } catch (_) {
      if (!mounted || seq != _seq) return;
      setState(() => _state = _Switch.failed);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final s = _suggested;
    final name = widget.selectedPersonName;
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.home_rounded, color: AppColors.teal, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text('Home visit at ${widget.address.formatted}',
                    style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600)),
              ),
              TextButton(onPressed: widget.onChange, child: const Text('Change')),
            ],
          ),
          if (s != null) ...[
            Text(
              '${name != null && name.isNotEmpty ? "$name's" : 'Your'} usual address is ${s.display}.',
              style: theme.textTheme.bodySmall?.copyWith(color: AppColors.textSecondary),
            ),
            if (_state == _Switch.checking)
              const LinearProgressIndicator()
            else
              TextButton(onPressed: _useSuggested, child: const Text('Use this address')),
            if (_state == _Switch.uncovered) const OutsideAreaBadge(),
            if (_state == _Switch.failed)
              Text("We couldn't check your postcode. Please try again.",
                  style: theme.textTheme.bodySmall?.copyWith(color: AppColors.error)),
          ],
        ],
      ),
    );
  }
}
