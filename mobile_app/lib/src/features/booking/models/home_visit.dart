import 'book_service.dart';

/// Mirrors lib/home-visit.ts + lib/home-visit-pricing.ts on the web app.
enum VisitType { video, home }

/// A home visit's price for one postcode (owner, 2026-11-27). The server owns
/// the bands (web lib/home-visit-pricing.ts) and sends the price with the
/// coverage check; the app never works it out itself. Patients only see the
/// whole price, never a separate fee.
class HomeVisitPrice {
  final int initialPence;
  final int followUpPence;
  const HomeVisitPrice({required this.initialPence, required this.followUpPence});
}

/// The nearest band, shown as "from" until the postcode has been checked.
const HomeVisitPrice kHomeVisitStartingPrice =
    HomeVisitPrice(initialPence: 8000, followUpPence: 7000);

/// Only for describing packages bought before they were withdrawn.
const int kRetiredPackageHomeExtraPence = 3000;

/// Length of one session of [s] for visit type [v], in minutes. A home
/// follow-up is 60 minutes (owner, 2026-11-15; the Cal.com home follow-up
/// event was changed to match); video follow-ups stay 30. Mirrors
/// minutesFor() in the web app's lib/cal-services.ts.
int sessionMinutes(ResolvedService s, VisitType v) =>
    v == VisitType.home && s.id == BookServiceId.followUp ? 60 : s.minutes;

/// The video (online) price of [s] in pence.
int videoPricePence(ResolvedService s) => (s.price * 100).round();

/// The whole price of [s] in pence: the video price, or for a home visit the
/// price for the checked postcode ([home]), falling back to the starting price.
int sessionPricePence(ResolvedService s, VisitType v, {HomeVisitPrice? home}) {
  if (v != VisitType.home) return videoPricePence(s);
  final price = home ?? kHomeVisitStartingPrice;
  return switch (s.id) {
    BookServiceId.initialAssessment => price.initialPence,
    BookServiceId.followUp => price.followUpPence,
    _ => videoPricePence(s) + kRetiredPackageHomeExtraPence * s.sessions,
  };
}

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

/// "from £80 home visit" before the postcode is checked, "£95 home visit" after.
String homeVisitPriceLabel(ResolvedService s, {HomeVisitPrice? home}) {
  final price = formatPounds(sessionPricePence(s, VisitType.home, home: home));
  return '${home == null ? 'from ' : ''}$price home visit';
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
