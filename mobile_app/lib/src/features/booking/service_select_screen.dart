import 'dart:async';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '../../core/app_colors.dart';
import '../../core/page_transitions.dart';
import '../../core/widgets/auth_gate_sheet.dart';
import '../addresses/address_repository.dart';
import 'booking_step_header.dart';
import 'home_visit_repository.dart';
import 'models/book_service.dart';
import 'models/home_visit.dart';
import 'time_details_screen.dart';

/// Step 1 of the native booking flow (service -> time/details -> assessment
/// -> payment -> confirmation). Mirrors web's `BookingStepService`
/// (`components/booking-step-service.tsx`): a service is *selected* here
/// (not navigated-away-from on tap), visit type first (home/video),
/// and a single "Continue" button advances to [TimeDetailsScreen] — the same
/// select-then-continue shape as web, not a list of tap-to-navigate rows.
/// What step 1 hands to the next screen.
class ServiceSelection {
  final ResolvedService service;
  final VisitType visitType;
  final HomeVisitAddress? homeAddress;
  const ServiceSelection(
      {required this.service, required this.visitType, this.homeAddress});
}

final _postcodeShape = RegExp(r'^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$');
bool _validPostcode(String raw) =>
    raw.trim().isNotEmpty &&
    raw.trim().length <= kAddressPostcodeMax &&
    _postcodeShape.hasMatch(normalisePostcode(raw));

const _kDifferent = '__different__';

enum _CoverageState { idle, checking, covered, uncovered, failed }

class ServiceSelectScreen extends StatefulWidget {
  const ServiceSelectScreen({
    this.initialPersonId,
    this.initialPersonName,
    this.homeVisitRepository,
    this.addressRepository,
    this.uid,
    this.onContinue,
    super.key,
  });

  /// When set (non-null, non-self), the booking flow starts pre-selected for
  /// this dependent instead of defaulting to "myself".
  final String? initialPersonId;
  final String? initialPersonName;

  /// Injectable for tests; real implementations are used when null.
  final HomeVisitRepository? homeVisitRepository;
  final AddressRepository? addressRepository;

  /// Signed-in account uid; defaults to `FirebaseAuth.instance.currentUser`.
  final String? uid;

  /// Overrides navigation to [TimeDetailsScreen] (tests).
  final void Function(ServiceSelection selection)? onContinue;

  /// Routes to [ServiceSelectScreen] for authenticated users. For
  /// unauthenticated users, shows the auth gate sheet instead of allowing
  /// direct access to the booking flow — mirrors [WhoIsThisForScreen.go],
  /// the flow's other entry point. Without this gate, a signed-out user
  /// could fill out the entire assessment only to have submission silently
  /// no-op (AssessmentScreen._submit early-returns when signed out).
  static void go(BuildContext context, {String? personId, String? personName}) {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      showAuthGateSheet(
        context,
        message: 'Sign in or create an account to book your appointment.',
      );
      return;
    }
    final isSelf = personId == null || personId == user.uid;
    Navigator.push(
      context,
      PhysioPageRoute(
        builder: (_) => ServiceSelectScreen(
          initialPersonId: isSelf ? null : personId,
          initialPersonName: isSelf ? null : personName,
        ),
      ),
    );
  }

  @override
  State<ServiceSelectScreen> createState() => _ServiceSelectScreenState();
}

class _ServiceSelectScreenState extends State<ServiceSelectScreen> {
  late BookServiceId _selectedId = allBookServices().first.id;
  VisitType _visit = VisitType.video;

  HomeVisitRepository? _hvRepo;
  HomeVisitRepository get _hv => _hvRepo ??= widget.homeVisitRepository ?? HomeVisitRepository();
  AddressRepository? _addrRepo;
  AddressRepository get _addr => _addrRepo ??= widget.addressRepository ?? AddressRepository();
  String? _uid;

  // Saved addresses
  bool _savedLoaded = false;
  List<SavedAddress> _saved = [];
  final Map<String, bool> _savedCovered = {};
  String _choice = _kDifferent;

  // Different address
  final _postcodeCtrl = TextEditingController();
  final _lineCtrl = TextEditingController();
  Timer? _debounce;
  int _coverageSeq = 0;
  _CoverageState _coverage = _CoverageState.idle;
  CoverageResult? _coverageResult;
  bool _lookupLoading = false;
  bool _manual = false;
  List<AddressSuggestion> _suggestions = [];
  String? _pickedId;
  bool _saveToBook = true;

  @override
  void initState() {
    super.initState();
    _uid = widget.uid;
    if (_uid == null) {
      try {
        _uid = FirebaseAuth.instance.currentUser?.uid;
      } catch (_) {
        _uid = null;
      }
    }
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _postcodeCtrl.dispose();
    _lineCtrl.dispose();
    super.dispose();
  }

  void _selectVisit(VisitType v) {
    setState(() => _visit = v);
    if (v == VisitType.home && !_savedLoaded) _loadSaved();
  }

  Future<void> _loadSaved() async {
    _savedLoaded = true;
    final uid = _uid;
    if (uid == null) return;
    try {
      final saved = await _addr.getAddresses(uid);
      String? usual;
      try {
        usual = await _addr.getUsualAddressId(uid, widget.initialPersonId);
      } catch (_) {}
      if (!mounted) return;
      setState(() {
        _saved = saved;
        if (usual != null && saved.any((a) => a.id == usual)) _choice = usual;
      });
      for (final a in saved) {
        _hv.checkCoverage(a.postcode).then((r) {
          if (mounted) setState(() => _savedCovered[a.id] = r.covered);
        }, onError: (_) {});
      }
    } catch (_) {
      // Saved addresses are a convenience; the patient can still type one.
    }
  }

  void _onPostcodeChanged(String raw) {
    _debounce?.cancel();
    _coverageSeq++;
    setState(() {
      _coverage = _CoverageState.idle;
      _coverageResult = null;
      _suggestions = [];
      _pickedId = null;
      _manual = false;
    });
    if (!_validPostcode(raw)) return;
    _debounce = Timer(const Duration(milliseconds: 400), _checkCoverage);
  }

  Future<void> _checkCoverage() async {
    final seq = ++_coverageSeq;
    final pc = _postcodeCtrl.text;
    setState(() => _coverage = _CoverageState.checking);
    try {
      final r = await _hv.checkCoverage(pc);
      if (!mounted || seq != _coverageSeq) return;
      setState(() {
        _coverageResult = r;
        _coverage = r.covered ? _CoverageState.covered : _CoverageState.uncovered;
      });
      if (r.covered) _lookup(pc, seq);
    } catch (_) {
      if (!mounted || seq != _coverageSeq) return;
      setState(() => _coverage = _CoverageState.failed);
    }
  }

  Future<void> _lookup(String pc, int seq) async {
    setState(() => _lookupLoading = true);
    try {
      final list = await _hv.lookupAddresses(pc);
      if (!mounted || seq != _coverageSeq) return;
      setState(() {
        _suggestions = list;
        _manual = list.isEmpty;
        _lookupLoading = false;
      });
    } catch (_) {
      if (!mounted || seq != _coverageSeq) return;
      setState(() {
        _manual = true;
        _lookupLoading = false;
      });
    }
  }

  Future<void> _pick(String? id) async {
    if (id == null) return;
    setState(() => _pickedId = id);
    try {
      final a = await _hv.resolveAddress(id);
      if (!mounted || _pickedId != id) return;
      setState(() {
        _lineCtrl.text = a.line;
        if (a.postcode.isNotEmpty) _postcodeCtrl.text = a.postcode;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _manual = true;
        _pickedId = null;
      });
    }
  }

  SavedAddress? get _chosenSaved {
    if (_choice == _kDifferent) return null;
    for (final a in _saved) {
      if (a.id == _choice) return a;
    }
    return null;
  }

  /// Null = can't book a home visit (yet).
  HomeVisitAddress? get _homeAddress {
    final s = _chosenSaved;
    if (s != null) {
      if (_savedCovered[s.id] == false) return null;
      return HomeVisitAddress(line: s.line, postcode: normalisePostcode(s.postcode));
    }
    if (_coverage != _CoverageState.covered) return null;
    final line = _lineCtrl.text.replaceAll(RegExp(r'\s+'), ' ').trim();
    if (line.isEmpty || line.length > kAddressLineMax) return null;
    if (!_validPostcode(_postcodeCtrl.text)) return null;
    return HomeVisitAddress(line: line, postcode: normalisePostcode(_postcodeCtrl.text));
  }

  bool get _homeBlocked {
    final s = _chosenSaved;
    if (s != null) return _savedCovered[s.id] == false;
    return _coverage == _CoverageState.uncovered || _coverage == _CoverageState.failed;
  }

  void _continue() {
    final service = bookServiceFor(_selectedId);
    final home = _visit == VisitType.home ? _homeAddress : null;
    if (_visit == VisitType.home && home == null) return;
    if (home != null && _chosenSaved == null && _saveToBook && _uid != null) {
      final exists = _saved.any((a) =>
          normalisePostcode(a.postcode) == home.postcode &&
          a.line.trim().toLowerCase() == home.line.toLowerCase());
      if (!exists) {
        _addr.addAddress(_uid!, line: home.line, postcode: home.postcode).then(
              (_) {},
              onError: (_) {},
            );
      }
    }
    final selection =
        ServiceSelection(service: service, visitType: _visit, homeAddress: home);
    if (widget.onContinue != null) {
      widget.onContinue!(selection);
      return;
    }
    Navigator.push(
      context,
      PhysioPageRoute(
        builder: (_) => TimeDetailsScreen(
          service: service,
          visitType: _visit,
          homeAddress: home,
          initialPersonId: widget.initialPersonId,
          initialPersonName: widget.initialPersonName,
        ),
      ),
    );
  }

  Widget _visitCard(VisitType v, IconData icon, String title, String subtitle) {
    final selected = _visit == v;
    final theme = Theme.of(context);
    return Expanded(
      child: Semantics(
        button: true,
        selected: selected,
        label: '$title. $subtitle',
        excludeSemantics: true,
        child: InkWell(
          borderRadius: BorderRadius.circular(18),
          onTap: () => _selectVisit(v),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: selected ? AppColors.tealLight : AppColors.surface,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(
                color: selected ? AppColors.teal : AppColors.border,
                width: selected ? 2 : 1,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(icon, color: AppColors.teal, size: 28),
                const SizedBox(height: 10),
                Text(title,
                    style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700)),
                const SizedBox(height: 4),
                Text(subtitle, style: theme.textTheme.bodySmall),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _serviceCard(ResolvedService s) {
    final theme = Theme.of(context);
    final selected = s.id == _selectedId;
    final travel = travelFeePence(s, _visit);
    final title = serviceLabelFor(s, _visit);
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Semantics(
        button: true,
        selected: selected,
        child: InkWell(
          borderRadius: BorderRadius.circular(18),
          onTap: () => setState(() => _selectedId = s.id),
          child: Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(
                color: selected ? AppColors.teal : AppColors.border,
                width: selected ? 2 : 1,
              ),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title,
                          style: theme.textTheme.titleMedium
                              ?.copyWith(fontWeight: FontWeight.w700)),
                      const SizedBox(height: 4),
                      Text(s.description, style: theme.textTheme.bodyMedium),
                      const SizedBox(height: 8),
                      Text(
                        '${formatPounds(totalPence(s, _visit))} · ${s.duration}'
                        '${travel > 0 ? ' · incl. ${formatPounds(travel)} travel' : ''}',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: AppColors.textSecondary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Icon(
                  selected ? Icons.check_circle_rounded : Icons.circle_outlined,
                  color: selected ? AppColors.teal : AppColors.border,
                  size: 24,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _outOfAreaBadge() => Container(
        margin: const EdgeInsets.only(top: 4),
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
        decoration: BoxDecoration(
          color: AppColors.goldLight,
          borderRadius: BorderRadius.circular(8),
        ),
        child: const Text('Outside our home-visit area',
            style: TextStyle(fontSize: 12, color: AppColors.gold, fontWeight: FontWeight.w600)),
      );

  Widget _uncoveredBlock(String outward) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          "We don't offer home visits in $outward yet. Video consultations work anywhere in the UK, or contact us and we'll see if we can help.",
          style: theme.textTheme.bodyMedium,
        ),
        const SizedBox(height: 4),
        Text('Home visits cover Glasgow (G1–G53), Paisley (PA1–PA3) and Hamilton (ML3).',
            style: theme.textTheme.bodySmall?.copyWith(color: AppColors.textSecondary)),
        const SizedBox(height: 10),
        OutlinedButton(
          onPressed: () => _selectVisit(VisitType.video),
          child: const Text('Book a video consultation instead'),
        ),
      ],
    );
  }

  Widget _differentAddress() {
    final theme = Theme.of(context);
    final children = <Widget>[
      TextField(
        key: const Key('postcodeField'),
        controller: _postcodeCtrl,
        maxLength: kAddressPostcodeMax,
        textCapitalization: TextCapitalization.characters,
        decoration: const InputDecoration(labelText: 'Postcode', counterText: ''),
        onChanged: _onPostcodeChanged,
      ),
      const SizedBox(height: 10),
    ];
    switch (_coverage) {
      case _CoverageState.idle:
        break;
      case _CoverageState.checking:
        children.add(const LinearProgressIndicator());
      case _CoverageState.failed:
        children.addAll([
          Text("We couldn't check your postcode. Please try again.",
              style: theme.textTheme.bodyMedium?.copyWith(color: AppColors.error)),
          TextButton(onPressed: _checkCoverage, child: const Text('Retry')),
        ]);
      case _CoverageState.uncovered:
        children.add(_uncoveredBlock(_coverageResult?.outwardCode ?? ''));
      case _CoverageState.covered:
        children.add(Text('We visit ${_coverageResult?.outwardCode ?? ''}.',
            style: theme.textTheme.bodyMedium?.copyWith(color: AppColors.success)));
        children.add(const SizedBox(height: 8));
        if (_lookupLoading) {
          children.add(const LinearProgressIndicator());
        } else if (_manual) {
          children.add(TextField(
            key: const Key('manualLineField'),
            controller: _lineCtrl,
            maxLength: kAddressLineMax,
            decoration: const InputDecoration(labelText: 'Address (house number and street)'),
            onChanged: (_) => setState(() {}),
          ));
        } else {
          children.add(DropdownButtonFormField<String>(
            key: const Key('addressDropdown'),
            isExpanded: true,
            initialValue: _pickedId,
            hint: const Text('Select your address'),
            items: _suggestions
                .map((a) => DropdownMenuItem(
                    value: a.id, child: Text(a.label, overflow: TextOverflow.ellipsis)))
                .toList(),
            onChanged: _pick,
          ));
          children.add(TextButton(
            onPressed: () => setState(() => _manual = true),
            child: const Text('Enter address manually'),
          ));
        }
        if (_uid != null) {
          children.add(CheckboxListTile(
            contentPadding: EdgeInsets.zero,
            controlAffinity: ListTileControlAffinity.leading,
            value: _saveToBook,
            onChanged: (v) => setState(() => _saveToBook = v ?? false),
            title: const Text('Save to my address book'),
          ));
        }
    }
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: children);
  }

  Widget _homeSection() {
    final theme = Theme.of(context);
    final children = <Widget>[
      Text('Where should we visit?',
          style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700)),
      const SizedBox(height: 8),
    ];
    if (_saved.isNotEmpty) {
      final radios = <Widget>[];
      for (final a in _saved) {
        radios.add(RadioListTile<String>(
          contentPadding: EdgeInsets.zero,
          value: a.id,
          title: Text(a.display),
          subtitle: _savedCovered[a.id] == false
              ? Align(alignment: Alignment.centerLeft, child: _outOfAreaBadge())
              : null,
        ));
      }
      radios.add(const RadioListTile<String>(
        contentPadding: EdgeInsets.zero,
        value: _kDifferent,
        title: Text('Use a different address'),
      ));
      children.add(RadioGroup<String>(
        groupValue: _choice,
        onChanged: (v) => setState(() => _choice = v ?? _kDifferent),
        child: Column(children: radios),
      ));
    }
    final chosen = _chosenSaved;
    if (chosen == null) {
      children.add(_differentAddress());
    } else if (_savedCovered[chosen.id] == false) {
      final outward = normalisePostcode(chosen.postcode).split(' ').first;
      children.add(_uncoveredBlock(outward));
    }
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: children);
  }

  @override
  Widget build(BuildContext context) {
    final services = allBookServices();
    final theme = Theme.of(context);
    final blocked = _visit == VisitType.home && _homeBlocked;
    final canContinue = _visit == VisitType.video || _homeAddress != null;
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(title: const Text('Book your appointment')),
      body: SafeArea(
        child: Column(
          children: [
            const BookingStepHeader(step: 1, totalSteps: 3, title: 'Choose your service'),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
                children: [
                  Text('How would you like to be seen?',
                      style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 10),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _visitCard(VisitType.home, Icons.home_rounded, 'Home visit in Glasgow',
                          'Your physiotherapist visits you'),
                      const SizedBox(width: 12),
                      _visitCard(VisitType.video, Icons.videocam_rounded, 'Video consultation',
                          'Online, anywhere in the UK'),
                    ],
                  ),
                  const SizedBox(height: 16),
                  if (_visit == VisitType.home) ...[
                    _homeSection(),
                    const SizedBox(height: 16),
                  ],
                  if (!blocked) ...services.map(_serviceCard),
                ],
              ),
            ),
            if (!blocked)
              SafeArea(
                top: false,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
                  child: SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      style: FilledButton.styleFrom(
                        backgroundColor: AppColors.teal,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                      onPressed: canContinue ? _continue : null,
                      child: const Text('Continue to times'),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
