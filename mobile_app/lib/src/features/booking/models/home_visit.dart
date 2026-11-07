import 'book_service.dart';

/// Mirrors lib/home-visit.ts + lib/home-visit-pricing.ts on the web app.
enum VisitType { video, home }

/// What a home visit adds to the video price, per visit (owner decision
/// 2026-11-07). Patients only ever see the whole price, never this figure on
/// its own, and there is no separate "travel fee". This is the only place the
/// amount is defined: every home price is derived from it plus the video
/// price in book_service.dart. Mirrors the web app's home-visit pricing.
const int kHomeVisitExtraPence = 4000;

/// The video (online) price of [s] in pence.
int videoPricePence(ResolvedService s) => (s.price * 100).round();

/// The whole price of [s] in pence for visit type [v]: the video price, or
/// for a home visit the video price plus [kHomeVisitExtraPence] for every
/// visit in the service (bundles pay for all their visits upfront). Discount
/// codes apply to this whole amount; the server computes the discounted one.
int sessionPricePence(ResolvedService s, VisitType v) =>
    videoPricePence(s) +
    (v == VisitType.home ? kHomeVisitExtraPence * s.sessions : 0);

/// "£80" for whole pounds, "£51.50" otherwise.
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

/// The whole home-visit price as one figure: "£80 home visit", or for
/// bundles "£280 for 4 home visits".
String homeVisitPriceLabel(ResolvedService s) {
  final price = formatPounds(sessionPricePence(s, VisitType.home));
  return s.sessions == 1
      ? '$price home visit'
      : '$price for ${s.sessions} home visits';
}

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
