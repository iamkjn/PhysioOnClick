import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/src/features/booking/models/book_service.dart';
import 'package:mobile_app/src/features/booking/models/home_visit.dart';

ResolvedService svc(BookServiceId id) => bookServiceFor(id);

void main() {
  const cases = {
    BookServiceId.initialAssessment: [4000, 1500, 'Initial Assessment (home visit)'],
    BookServiceId.followUp: [3000, 1500, 'Follow-Up (home visit)'],
    BookServiceId.bundle4: [12000, 6000, '4 Session Bundle (home visit)'],
    BookServiceId.bundle8: [22500, 12000, '8 Session Bundle (home visit)'],
  };

  test('pricing for all services and visit types', () {
    expect(kHomeVisitTravelFeePence, 1500);
    cases.forEach((id, v) {
      final s = svc(id);
      expect(sessionPricePence(s), v[0]);
      expect(travelFeePence(s, VisitType.video), 0);
      expect(travelFeePence(s, VisitType.home), v[1]);
      expect(totalPence(s, VisitType.video), v[0]);
      expect(totalPence(s, VisitType.home), (v[0] as int) + (v[1] as int));
    });
  });

  test('labels', () {
    cases.forEach((id, v) {
      final s = svc(id);
      expect(serviceLabelFor(s, VisitType.home), v[2]);
      expect(serviceLabelFor(s, VisitType.video), s.title);
    });
    expect(travelFeeLabel(svc(BookServiceId.followUp)), 'Travel fee (1 home visit × £15)');
    expect(travelFeeLabel(svc(BookServiceId.bundle4)), 'Travel fee (4 home visits × £15)');
  });

  test('formatPounds', () {
    expect(formatPounds(5500), '£55');
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

  test('home price summary reads "£40 session + £15 travel"', () {
    expect(homePriceSummary(svc(BookServiceId.initialAssessment)), '£40 session + £15 travel');
    expect(homePriceSummary(svc(BookServiceId.bundle4)), '£120 sessions + £60 travel');
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
