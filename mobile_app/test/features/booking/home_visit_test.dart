import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/src/features/booking/models/book_service.dart';
import 'package:mobile_app/src/features/booking/models/home_visit.dart';

ResolvedService svc(BookServiceId id) => bookServiceFor(id);

void main() {
  // [video pence, home starting pence, home label].
  const cases = {
    BookServiceId.initialAssessment: [5000, 8000, 'Initial Assessment (home visit)'],
    BookServiceId.followUp: [4000, 7000, 'Follow-Up (home visit)'],
  };

  test('a home follow-up is 60 minutes, video stays 30', () {
    expect(sessionMinutes(svc(BookServiceId.followUp), VisitType.home), 60);
    expect(sessionMinutes(svc(BookServiceId.followUp), VisitType.video), 30);
    expect(sessionMinutes(svc(BookServiceId.initialAssessment), VisitType.home), 60);
  });

  test('a checked postcode price replaces the starting price', () {
    const price = HomeVisitPrice(initialPence: 11000, followUpPence: 10000);
    final initial = svc(BookServiceId.initialAssessment);
    expect(sessionPricePence(initial, VisitType.home, home: price), 11000);
    expect(sessionPricePence(svc(BookServiceId.followUp), VisitType.home, home: price), 10000);
    expect(sessionPricePence(initial, VisitType.video, home: price), 5000);
    expect(homeVisitPriceLabel(initial), 'from £80 home visit');
    expect(homeVisitPriceLabel(initial, home: price), '£110 home visit');
  });

  test('pricing for all services and visit types', () {
    cases.forEach((id, v) {
      final s = svc(id);
      expect(videoPricePence(s), v[0]);
      expect(sessionPricePence(s, VisitType.video), v[0]);
      expect(sessionPricePence(s, VisitType.home), v[1]);
    });
  });

  test('labels', () {
    cases.forEach((id, v) {
      final s = svc(id);
      expect(serviceLabelFor(s, VisitType.home), v[2]);
      expect(serviceLabelFor(s, VisitType.video), s.title);
    });
  });

  test('formatPounds', () {
    expect(formatPounds(8000), '£80');
    expect(formatPounds(5150), '£51.50');
  });

  test('normalisePostcode', () {
    expect(normalisePostcode('g31  4hs'), 'G31 4HS');
    expect(normalisePostcode('G314HS'), 'G31 4HS');
    expect(normalisePostcode(' g1 '), 'G1');
  });

  test('HomeVisitAddress.formatted', () {
    expect(const HomeVisitAddress(line: '1 Main St', postcode: 'G31 4HS').formatted, '1 Main St, G31 4HS');
  });


  test('isValidUkPostcode', () {
    expect(isValidUkPostcode('g31 4hs'), isTrue);
    expect(isValidUkPostcode('G314HS'), isTrue);
    expect(isValidUkPostcode('EH1 1AA'), isTrue);
    expect(isValidUkPostcode(''), isFalse);
    expect(isValidUkPostcode('G31'), isFalse);
    expect(isValidUkPostcode('NOT A POSTCODE'), isFalse);
    expect(isValidUkPostcode('G31 4HS          X'), isFalse);
  });
}
