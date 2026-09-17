import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/src/features/services/services_screen.dart';

void main() {
  test('serviceImageUrl builds the service-covers PNG path with the slug', () {
    final url = serviceImageUrl('musculoskeletal-physiotherapy');
    expect(url, endsWith('/images/service-covers/service-musculoskeletal-physiotherapy.png'));
  });

  testWidgets('lists all six real services from the web catalogue', (tester) async {
    // Cards are tall (16:9 cover image + expandable content), so the
    // default test surface only fits the first one or two without
    // scrolling — size the surface generously rather than scrolling
    // through six cards one at a time.
    tester.view.physicalSize = const Size(1200, 6000);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(const MaterialApp(home: ServicesScreen()));
    await tester.pump();
    expect(find.text('Musculoskeletal Physiotherapy'), findsOneWidget);
    expect(find.text('Post-Surgical Rehabilitation'), findsOneWidget);
    expect(find.text('Neurological Rehabilitation'), findsOneWidget);
    expect(find.text('Paediatric Physiotherapy'), findsOneWidget);
    expect(find.text('Gait & Mobility Assessment'), findsOneWidget);
    expect(find.text('Online Rehab Programmes'), findsOneWidget);
  });
}
