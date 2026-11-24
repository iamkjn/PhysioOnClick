import 'dart:async';

import 'package:flutter/material.dart';

import '../../../core/app_colors.dart';
import 'admin_notifications.dart';

/// App-bar bell for the admin dashboard, matching web's
/// components/admin-notification-bell.tsx: a red unread count, and opening
/// the list marks everything read (past sessions included, which can't be
/// tapped) so the count goes straight back to 0.
class AdminNotificationBell extends StatefulWidget {
  AdminNotificationBell({
    super.key,
    Stream<List<AdminNotification>>? notifications,
    Future<void> Function(String id)? markRead,
    this.onOpenSession,
    DateTime Function()? now,
  }) : notifications = notifications ?? watchAdminNotifications(),
       markRead = markRead ?? markAdminNotificationRead,
       now = now ?? DateTime.now;

  final Stream<List<AdminNotification>> notifications;
  final Future<void> Function(String id) markRead;

  /// Called when an upcoming session in the list is tapped.
  final void Function(BuildContext context, AdminNotification n)? onOpenSession;
  final DateTime Function() now;

  @override
  State<AdminNotificationBell> createState() => _AdminNotificationBellState();
}

class _AdminNotificationBellState extends State<AdminNotificationBell> {
  StreamSubscription<List<AdminNotification>>? _sub;
  List<AdminNotification> _items = const [];

  /// Marked read locally so the badge clears without waiting for Firestore.
  final Set<String> _seen = {};

  @override
  void initState() {
    super.initState();
    _sub = widget.notifications.listen(
      (items) => setState(() => _items = items),
      onError: (Object e) => debugPrint('admin notifications failed: $e'),
    );
  }

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }

  List<AdminNotification> get _unread =>
      _items.where((n) => !n.read && !_seen.contains(n.id)).toList();

  Future<void> _open() async {
    final fresh = _unread.map((n) => n.id).toSet();
    if (fresh.isNotEmpty) {
      setState(() => _seen.addAll(fresh));
      for (final id in fresh) {
        widget
            .markRead(id)
            .catchError(
              (Object e) =>
                  debugPrint('mark admin notification read failed: $e'),
            );
      }
    }
    await showModalBottomSheet<void>(
      context: context,
      backgroundColor: AppColors.surface,
      showDragHandle: true,
      builder:
          (sheetContext) => _NotificationSheet(
            items: _items,
            fresh: fresh,
            now: widget.now(),
            onTap:
                widget.onOpenSession == null
                    ? null
                    : (n) {
                      Navigator.pop(sheetContext);
                      widget.onOpenSession!(context, n);
                    },
          ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final count = _unread.length;
    return IconButton(
      tooltip: count > 0 ? 'Notifications, $count unread' : 'Notifications',
      onPressed: _open,
      icon: Badge(
        isLabelVisible: count > 0,
        backgroundColor: AppColors.error,
        label: Text(count > 9 ? '9+' : '$count'),
        child: const Icon(Icons.notifications_none_rounded),
      ),
    );
  }
}

class _NotificationSheet extends StatelessWidget {
  const _NotificationSheet({
    required this.items,
    required this.fresh,
    required this.now,
    this.onTap,
  });

  final List<AdminNotification> items;
  final Set<String> fresh;
  final DateTime now;
  final void Function(AdminNotification n)? onTap;

  static const _months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  String _when(AdminNotification n) {
    final d = n.sessionDate?.toLocal();
    if (d == null) return 'Session time unknown';
    final hh = d.hour.toString().padLeft(2, '0');
    final mm = d.minute.toString().padLeft(2, '0');
    final past = n.isPast(now) ? ' · past' : '';
    return '${d.day} ${_months[d.month - 1]}, $hh:$mm$past';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Upcoming sessions',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w700,
                color: AppColors.navy,
              ),
            ),
            const SizedBox(height: 8),
            if (items.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 16),
                child: Text(
                  'No notifications yet.',
                  style: TextStyle(color: AppColors.textSecondary),
                ),
              )
            else
              Flexible(
                child: ListView(
                  shrinkWrap: true,
                  children: [
                    for (final n in items)
                      _NotificationRow(
                        title: n.patientName,
                        subtitle: _when(n),
                        isNew: fresh.contains(n.id),
                        isPast: n.isPast(now),
                        onTap:
                            (n.isPast(now) || onTap == null)
                                ? null
                                : () => onTap!(n),
                      ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _NotificationRow extends StatelessWidget {
  const _NotificationRow({
    required this.title,
    required this.subtitle,
    required this.isNew,
    required this.isPast,
    this.onTap,
  });

  final String title;
  final String subtitle;
  final bool isNew;
  final bool isPast;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final fg = isPast ? AppColors.textSecondary : AppColors.textPrimary;
    return Container(
      margin: const EdgeInsets.only(bottom: 6),
      decoration: BoxDecoration(
        color: isNew ? AppColors.tealLight : Colors.transparent,
        borderRadius: BorderRadius.circular(12),
      ),
      child: ListTile(
        onTap: onTap,
        title: Text(
          title,
          style: TextStyle(
            color: fg,
            fontWeight: isNew ? FontWeight.w700 : FontWeight.w500,
          ),
        ),
        subtitle: Text(
          subtitle,
          style: const TextStyle(color: AppColors.textSecondary),
        ),
        trailing:
            onTap == null ? null : const Icon(Icons.chevron_right_rounded),
      ),
    );
  }
}
