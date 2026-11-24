import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/src/features/admin/notifications/admin_notification_bell.dart';
import 'package:mobile_app/src/features/admin/notifications/admin_notifications.dart';

void main() {
  final now = DateTime(2026, 11, 24, 12);

  AdminNotification n(
    String id, {
    required bool read,
    required Duration offset,
  }) => AdminNotification(
    id: id,
    bookingId: 'b-$id',
    patientName: 'Patient $id',
    sessionDate: now.add(offset),
    read: read,
  );

  Future<
    (StreamController<List<AdminNotification>>, List<String>, List<String>)
  >
  pump(WidgetTester tester) async {
    final controller = StreamController<List<AdminNotification>>();
    final marked = <String>[];
    final opened = <String>[];
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          appBar: AppBar(
            actions: [
              AdminNotificationBell(
                notifications: controller.stream,
                markRead: (id) async => marked.add(id),
                onOpenSession: (_, n) => opened.add(n.bookingId),
                now: () => now,
              ),
            ],
          ),
        ),
      ),
    );
    return (controller, marked, opened);
  }

  testWidgets('opening the bell clears the badge, past sessions included', (
    tester,
  ) async {
    final (controller, marked, _) = await pump(tester);
    controller.add([
      n('past', read: false, offset: const Duration(days: -1)),
      n('next', read: false, offset: const Duration(hours: 1)),
      n('seen', read: true, offset: const Duration(days: -2)),
    ]);
    await tester.pump();

    expect(find.byTooltip('Notifications, 2 unread'), findsOneWidget);
    expect(find.text('2'), findsOneWidget);

    await tester.tap(find.byTooltip('Notifications, 2 unread'));
    await tester.pumpAndSettle();

    expect(marked, unorderedEquals(['past', 'next']));
    expect(find.text('Upcoming sessions'), findsOneWidget);
    expect(find.text('Patient past'), findsOneWidget);
    expect(find.byTooltip('Notifications'), findsOneWidget);
    expect(find.text('2'), findsNothing);
    await controller.close();
  });

  testWidgets('tapping an upcoming session opens it; past ones do nothing', (
    tester,
  ) async {
    final (controller, _, opened) = await pump(tester);
    controller.add([
      n('past', read: true, offset: const Duration(days: -1)),
      n('next', read: true, offset: const Duration(hours: 1)),
    ]);
    await tester.pump();

    await tester.tap(find.byTooltip('Notifications'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Patient past'));
    await tester.pumpAndSettle();
    expect(opened, isEmpty);

    await tester.tap(find.text('Patient next'));
    await tester.pumpAndSettle();
    expect(opened, ['b-next']);
    await controller.close();
  });
}
