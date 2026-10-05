import 'book_service.dart';

/// Mirrors lib/home-visit.ts + lib/home-visit-pricing.ts on the web app.
enum VisitType { video, home }

const int kHomeVisitTravelFeePence = 1500;

int sessionPricePence(ResolvedService s) => (s.price * 100).round();

int travelFeePence(ResolvedService s, VisitType v) =>
    v == VisitType.home ? kHomeVisitTravelFeePence * s.sessions : 0;

/// Session + travel. Discounts apply to the session price only, elsewhere.
int totalPence(ResolvedService s, VisitType v) =>
    sessionPricePence(s) + travelFeePence(s, v);

/// "£55" for whole pounds, "£51.50" otherwise.
String formatPounds(int pence) =>
    pence % 100 == 0 ? '£${pence ~/ 100}' : '£${(pence / 100).toStringAsFixed(2)}';

String serviceLabelFor(ResolvedService s, VisitType v) {
  if (v != VisitType.home) return s.title;
  return switch (s.id) {
    BookServiceId.initialAssessment => 'Initial Assessment (home visit)',
    BookServiceId.followUp => 'Follow-Up (home visit)',
    _ => '${s.title} (home visit)',
  };
}

String travelFeeLabel(ResolvedService s) =>
    'Travel fee (${s.sessions} home visit${s.sessions == 1 ? '' : 's'} × ${formatPounds(kHomeVisitTravelFeePence)})';

/// "£40 session + £15 travel" (bundles: "£120 sessions + £60 travel").
String homePriceSummary(ResolvedService s) =>
    '${formatPounds(sessionPricePence(s))} session${s.sessions == 1 ? '' : 's'}'
    ' + ${formatPounds(travelFeePence(s, VisitType.home))} travel';

/// "g31  4hs" -> "G31 4HS". Too-short input is only trimmed/upper-cased.
String normalisePostcode(String raw) {
  final compact = raw.replaceAll(RegExp(r'\s+'), '').toUpperCase();
  if (compact.length < 5) return compact;
  return '${compact.substring(0, compact.length - 3)} ${compact.substring(compact.length - 3)}';
}

const int kPostcodeMaxLength = 10;
final _ukPostcodeShape = RegExp(r'^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$');

/// True when [raw] (any case/spacing) has the shape of a UK postcode.
bool isValidUkPostcode(String raw) {
  final t = raw.trim();
  return t.isNotEmpty &&
      t.length <= kPostcodeMaxLength &&
      _ukPostcodeShape.hasMatch(normalisePostcode(t));
}

/// Personal data: never log, put in analytics, or put in a URL.
class HomeVisitAddress {
  final String line;
  final String postcode;
  const HomeVisitAddress({required this.line, required this.postcode});
  String get formatted => '$line, $postcode';
}
