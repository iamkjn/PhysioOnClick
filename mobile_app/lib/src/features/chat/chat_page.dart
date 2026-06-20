import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../appointments/appointments_screen.dart';
import '../booking/booking_screen.dart';

// ─── Theme constants ────────────────────────────────────────────────────────

const _primary = Color(0xFF0891B2);
const _primaryDark = Color(0xFF0E7490);
const _bgColor = Color(0xFFECFEFF);
const _textDark = Color(0xFF164E63);
const _email = 'hello@physioonclick.co.uk';

// ─── Site content (hardcoded from site-data) ────────────────────────────────

const _services = [
  (
    emoji: '💪',
    label: 'Musculoskeletal Physio',
    text: 'We treat back & neck pain, shoulder impingement, tendon pain, persistent sports injuries and work-related strain.\n\n'
        'Our approach includes a detailed functional assessment, manual therapy where appropriate, graduated exercise prescription and pain education.',
  ),
  (
    emoji: '🦿',
    label: 'Post-Surgical Rehab',
    text: 'Structured rehab after knee/hip replacement, ACL reconstruction, rotator cuff repair and fracture recovery.\n\n'
        'We guide you through post-operative milestones, strength & range-of-motion progression and return-to-function coaching.',
  ),
  (
    emoji: '🧠',
    label: 'Neurological Rehab',
    text: 'Goal-led rehab for stroke, Parkinson\'s, balance difficulties and neurological deconditioning.\n\n'
        'We focus on task-specific mobility practice, balance & gait training, and carer education.',
  ),
  (
    emoji: '👶',
    label: 'Paediatric Physio',
    text: 'Child-centred physiotherapy for developmental delay, coordination challenges, mobility support and post-operative rehab.\n\n'
        'Sessions use play-based strategies with full parent coaching. Parent attendance is encouraged.',
  ),
  (
    emoji: '🚶',
    label: 'Gait & Mobility',
    text: 'Walking assessment and movement analysis for falls risk, balance confidence, mobility aid review and reduced walking tolerance.\n\n'
        'We provide functional walking assessment, strength & balance prescription and outcome tracking.',
  ),
  (
    emoji: '💻',
    label: 'Online Rehab',
    text: 'UK-wide digital physiotherapy via secure video call with tailored exercise plans, progress tracking and weekly review calls.\n\n'
        'Online patients receive the same structured rehabilitation planning as in-person sessions.',
  ),
];

const _pricingText =
    'In-person sessions (Glasgow):\n'
    '• Initial Assessment (45 min) — £65\n'
    '• Follow-Up Session (30 min) — £50\n'
    '• Extended Session (60 min) — £80\n\n'
    'Online sessions (UK-wide):\n'
    '• Initial Online Assessment (45 min) — £55\n'
    '• Online Follow-Up (30 min) — £45\n\n'
    'Packages:\n'
    '• 4-Session Bundle — £180\n'
    '• 8-Session Bundle — £340\n\n'
    'No GP referral required — you can self-refer.';

// ─── Chat page ──────────────────────────────────────────────────────────────

class ChatPage extends StatefulWidget {
  const ChatPage({super.key});

  @override
  State<ChatPage> createState() => _ChatPageState();
}

class _ChatPageState extends State<ChatPage> {
  final _messages = <_Msg>[];
  final _scroll = ScrollController();
  List<_ChipDef> _chips = [];

  @override
  void initState() {
    super.initState();
    _messages.add(const _Msg(
      isBot: true,
      text: 'Hi! I\'m your PhysioOnClick assistant 👋\n\nHow can I help you today?',
    ));
    _chips = _homeChips();
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  // ── Chip sets ─────────────────────────────────────────────────────────────

  List<_ChipDef> _homeChips() => [
        _ChipDef('🏃', 'Our services', _tapServices),
        _ChipDef('💰', 'Pricing', _tapPricing),
        _ChipDef('📅', 'Book appointment', _tapBook),
        _ChipDef('📍', 'Location', _tapLocation),
        _ChipDef('📞', 'Contact us', _tapContact),
        _ChipDef('❌', 'Cancellation policy', _tapCancellation),
      ];

  List<_ChipDef> _backChips() => [
        _ChipDef('📅', 'Book appointment', _tapBook),
        _ChipDef('🏠', 'Main menu', _tapHome),
      ];

  // ── Tap handlers ──────────────────────────────────────────────────────────

  void _tapHome(BuildContext _) {
    setState(() {
      _messages.clear();
      _messages.add(const _Msg(
        isBot: true,
        text: 'Hi! I\'m your PhysioOnClick assistant 👋\n\nHow can I help you today?',
      ));
      _chips = _homeChips();
    });
  }

  void _tapServices(BuildContext _) {
    _botReply(
      'We offer 6 specialised physiotherapy services. Which one would you like to know more about?',
      chips: [
        for (final s in _services)
          _ChipDef(s.emoji, s.label, (c) => _tapServiceDetail(c, s.label, s.text)),
        _ChipDef('↩', 'Main menu', _tapHome),
      ],
    );
  }

  void _tapServiceDetail(BuildContext _, String label, String text) {
    _botReply(
      text,
      chips: [
        _ChipDef('📅', 'Book this service', _tapBook),
        _ChipDef('💰', 'See pricing', _tapPricing),
        _ChipDef('↩', 'Back to services', _tapServices),
        _ChipDef('🏠', 'Main menu', _tapHome),
      ],
    );
  }

  void _tapPricing(BuildContext _) {
    _botReply(_pricingText, chips: _backChips());
  }

  void _tapBook(BuildContext ctx) {
    _addUser('Book appointment');
    Navigator.of(ctx).push(
      MaterialPageRoute(builder: (_) => const BookingScreen()),
    );
  }

  void _tapLocation(BuildContext _) {
    _botReply(
      'We\'re based in Glasgow, UK and also offer online physiotherapy across the whole UK via secure video call.\n\n'
          'Appointments are available Monday–Saturday. No GP referral is required — you can self-refer directly.',
      chips: _backChips(),
    );
  }

  void _tapContact(BuildContext _) {
    _botReply(
      'You can reach us at:\n\n📧  $_email\n\nOr book directly through the app and we\'ll be in touch to confirm your session.',
      chips: [
        _ChipDef('📋', 'Copy email', (ctx) {
          Clipboard.setData(const ClipboardData(text: _email));
          ScaffoldMessenger.of(ctx).showSnackBar(
            const SnackBar(
              content: Text('Email copied to clipboard'),
              duration: Duration(seconds: 2),
            ),
          );
        }),
        _ChipDef('📅', 'Book appointment', _tapBook),
        _ChipDef('🏠', 'Main menu', _tapHome),
      ],
    );
  }

  void _tapCancellation(BuildContext _) {
    _botReply(
      'Please cancel at least 24 hours in advance to avoid a cancellation fee.\n\n'
          'You can manage your bookings through the Appointments screen in this app, or contact us at $_email.',
      chips: [
        _ChipDef('📋', 'My appointments', (ctx) {
          _addUser('My appointments');
          Navigator.of(ctx).push(
            MaterialPageRoute(builder: (_) => const AppointmentsScreen()),
          );
        }),
        _ChipDef('🏠', 'Main menu', _tapHome),
      ],
    );
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  void _botReply(String text, {required List<_ChipDef> chips}) {
    setState(() {
      _messages.add(_Msg(isBot: true, text: text));
      _chips = chips;
    });
    _scrollToBottom();
  }

  void _addUser(String text) {
    setState(() => _messages.add(_Msg(isBot: false, text: text)));
    _scrollToBottom();
  }

  void _onChipTap(BuildContext ctx, _ChipDef chip) {
    // Don't echo utility actions as user messages
    final isUtility = chip.label == 'Copy email' ||
        chip.label == 'Main menu' ||
        chip.label == 'Back to services';
    if (!isUtility) _addUser(chip.label);
    chip.onTap(ctx);
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) {
        _scroll.animateTo(
          _scroll.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  // ── Build ─────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bgColor,
      appBar: _ChatAppBar(),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              controller: _scroll,
              padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
              itemCount: _messages.length,
              itemBuilder: (_, i) => _BubbleWidget(msg: _messages[i]),
            ),
          ),
          _ChipsBar(
            chips: _chips,
            onTap: (chip) => _onChipTap(context, chip),
          ),
        ],
      ),
    );
  }
}

// ─── Data types ──────────────────────────────────────────────────────────────

class _Msg {
  final bool isBot;
  final String text;
  const _Msg({required this.isBot, required this.text});
}

class _ChipDef {
  final String emoji;
  final String label;
  final void Function(BuildContext) onTap;
  const _ChipDef(this.emoji, this.label, this.onTap);
}

// ─── App Bar ─────────────────────────────────────────────────────────────────

class _ChatAppBar extends StatelessWidget implements PreferredSizeWidget {
  @override
  Size get preferredSize => const Size.fromHeight(64);

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [_primary, _primaryDark],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(color: Color(0x330891B2), blurRadius: 12, offset: Offset(0, 4)),
        ],
      ),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
          child: Row(
            children: [
              IconButton(
                icon: const Icon(
                  Icons.arrow_back_ios_new_rounded,
                  color: Colors.white,
                  size: 20,
                ),
                onPressed: () => Navigator.of(context).pop(),
              ),
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.health_and_safety_rounded,
                  color: Colors.white,
                  size: 22,
                ),
              ),
              const SizedBox(width: 10),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'PhysioOnClick Assistant',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                        fontSize: 15,
                      ),
                    ),
                    Row(
                      children: [
                        Icon(Icons.circle, color: Color(0xFF4ADE80), size: 8),
                        SizedBox(width: 4),
                        Text(
                          'Online · Ask me anything',
                          style: TextStyle(color: Color(0xCCFFFFFF), fontSize: 11),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Message bubble ───────────────────────────────────────────────────────────

class _BubbleWidget extends StatelessWidget {
  const _BubbleWidget({required this.msg});
  final _Msg msg;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment:
            msg.isBot ? MainAxisAlignment.start : MainAxisAlignment.end,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (msg.isBot) ...[
            Container(
              width: 30,
              height: 30,
              margin: const EdgeInsets.only(right: 8, bottom: 2),
              decoration: const BoxDecoration(
                gradient: LinearGradient(colors: [_primary, _primaryDark]),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.health_and_safety_rounded,
                color: Colors.white,
                size: 16,
              ),
            ),
          ],
          Flexible(
            child: Container(
              constraints: BoxConstraints(
                maxWidth: MediaQuery.of(context).size.width * 0.72,
              ),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              decoration: BoxDecoration(
                color: msg.isBot ? Colors.white : null,
                gradient: msg.isBot
                    ? null
                    : const LinearGradient(
                        colors: [_primary, _primaryDark],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(18),
                  topRight: const Radius.circular(18),
                  bottomLeft: Radius.circular(msg.isBot ? 4 : 18),
                  bottomRight: Radius.circular(msg.isBot ? 18 : 4),
                ),
                boxShadow: [
                  BoxShadow(
                    color: msg.isBot
                        ? Colors.black.withValues(alpha: 0.06)
                        : const Color(0xFF0891B2).withValues(alpha: 0.25),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Text(
                msg.text,
                style: TextStyle(
                  color: msg.isBot ? _textDark : Colors.white,
                  fontSize: 14,
                  height: 1.6,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Chips bar ────────────────────────────────────────────────────────────────

class _ChipsBar extends StatelessWidget {
  const _ChipsBar({required this.chips, required this.onTap});
  final List<_ChipDef> chips;
  final void Function(_ChipDef) onTap;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
        decoration: BoxDecoration(
          color: Colors.white,
          border: const Border(top: BorderSide(color: Color(0xFFE0F7FA), width: 1)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 12,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: Wrap(
          spacing: 8,
          runSpacing: 8,
          children: chips
              .map((c) => _ChipWidget(chip: c, onTap: () => onTap(c)))
              .toList(),
        ),
      ),
    );
  }
}

class _ChipWidget extends StatefulWidget {
  const _ChipWidget({required this.chip, required this.onTap});
  final _ChipDef chip;
  final VoidCallback onTap;

  @override
  State<_ChipWidget> createState() => _ChipWidgetState();
}

class _ChipWidgetState extends State<_ChipWidget> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _pressed = true),
      onTapUp: (_) {
        setState(() => _pressed = false);
        widget.onTap();
      },
      onTapCancel: () => setState(() => _pressed = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 120),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: _pressed ? _primary : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: _pressed ? _primary : const Color(0xFFA5F3FC),
            width: 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF0891B2).withValues(alpha: _pressed ? 0.2 : 0.07),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(widget.chip.emoji, style: const TextStyle(fontSize: 13)),
            const SizedBox(width: 5),
            Text(
              widget.chip.label,
              style: TextStyle(
                color: _pressed ? Colors.white : _textDark,
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
