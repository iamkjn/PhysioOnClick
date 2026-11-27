import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/src/features/booking/models/book_service.dart';

void main() {
  test('only the two single sessions are on sale (packages withdrawn)', () {
    expect(allBookServices().map((s) => s.apiId).toList(), ['initial-assessment', 'follow-up']);
  });

  test('bookServiceFor resolves initial-assessment with correct fields', () {
    final svc = bookServiceFor(BookServiceId.initialAssessment);
    expect(svc.apiId, 'initial-assessment');
    expect(svc.calSlug, 'initial-online-assessment');
    expect(svc.minutes, 60);
    expect(svc.sessions, 1);
    expect(svc.price, 50);
  });

  test('bookServiceFor resolves bundle-8 reusing the initial-assessment cal slug', () {
    final svc = bookServiceFor(BookServiceId.bundle8);
    expect(svc.apiId, 'bundle-8');
    expect(svc.calSlug, 'initial-online-assessment');
    expect(svc.sessions, 8);
  });
}
