import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/src/features/booking/models/book_service.dart';
import 'package:mobile_app/src/features/booking/models/home_visit.dart';

ResolvedService svc(BookServiceId id) => bookServiceFor(id);

void main() {
  // [video pence, home pence, home label]. Home = video + £40 per visit.
  const cases = {
    BookServiceId.initialAssessment: [4000, 8000, 'Initial Assessment (home visit)'],
    BookServiceId.followUp: [3000, 7000, 'Follow-Up (home visit)'],
    BookServiceId.bundle4: [12000, 28000, '4 Session Bundle (home visit)'],
    BookServiceId.bundle8: [22500, 54500, '8 Session Bundle (home visit)'],
  };

  test('home extra is £40 per visit', () {
    expect(kHomeVisitExtraPence, 4000);
  });

  test('pricing for all services and visit types', () {
    cases.forEach((id, v) {
      final s = svc(id);
      expect(videoPricePence(s), v[0]);
      expect(sessionPricePence(s, VisitType.video), v[0]);
      expect(sessionPricePence(s, VisitType.home), v[1]);
      // Derived from the constant, not hardcoded.
      expect(sessionPricePence(s, VisitType.home),
          videoPricePence(s) + kHomeVisitExtraPence * s.sessions);
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

  test('home visit price label is one whole price, no separate fee', () {
    expect(homeVisitPriceLabel(svc(BookServiceId.initialAssessment)), '£80 home visit');
    expect(homeVisitPriceLabel(svc(BookServiceId.followUp)), '£70 home visit');
    expect(homeVisitPriceLabel(svc(BookServiceId.bundle4)), '£280 for 4 home visits');
    expect(homeVisitPriceLabel(svc(BookServiceId.bundle8)), '£545 for 8 home visits');
    for (final s in allBookServices()) {
      final label = homeVisitPriceLabel(s);
      expect(label.toLowerCase(), isNot(contains('travel')));
      expect(label, isNot(contains('+')));
    }
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
