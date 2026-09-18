import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/src/features/assessment/assessment_model.dart';
import 'package:mobile_app/src/features/assessment/body_regions.dart';

void main() {
  group('regionLabel', () {
    test('resolves a known region key', () {
      expect(regionLabel('lower-back'), 'Lower back');
    });

    test('resolves somewhereElse to its label', () {
      expect(regionLabel(somewhereElse), 'Somewhere else / not sure');
    });

    test('falls back to the raw key for an unknown region', () {
      expect(regionLabel('not-a-real-key'), 'not-a-real-key');
    });
  });

  group('deriveClinicalArea', () {
    test('returns general for an empty list', () {
      expect(deriveClinicalArea([]), ClinicalArea.general);
    });

    test('returns spine when any spine region is picked', () {
      expect(deriveClinicalArea(['shoulder-left', 'neck']), ClinicalArea.spine);
    });

    test('returns the single non-general area when unambiguous', () {
      expect(deriveClinicalArea(['knee-left', 'thigh-right']), ClinicalArea.lowerLimb);
    });

    test('returns general when regions span multiple non-spine areas', () {
      expect(deriveClinicalArea(['knee-left', 'shoulder-left']), ClinicalArea.general);
    });
  });

  group('describeRegions', () {
    test('returns empty string for no regions', () {
      expect(describeRegions([]), '');
    });

    test('describes somewhereElse alone', () {
      expect(describeRegions([somewhereElse]), 'Somewhere else / not sure');
    });

    test('joins multiple region labels', () {
      expect(describeRegions(['neck', 'lower-back']), 'Neck, Lower back');
    });
  });

  group('deriveSymptomStartDate / deriveOnsetPattern', () {
    test('days maps to sudden onset', () {
      expect(deriveOnsetPattern(HowLong.days), OnsetPattern.sudden);
      expect(deriveSymptomStartDate(HowLong.days), isNotEmpty);
    });

    test('weeks and months map to gradual onset', () {
      expect(deriveOnsetPattern(HowLong.weeks), OnsetPattern.gradual);
      expect(deriveOnsetPattern(HowLong.months), OnsetPattern.gradual);
    });

    test('since-op maps to post_surgery with no derived date', () {
      expect(deriveOnsetPattern(HowLong.sinceOp), OnsetPattern.postSurgery);
      expect(deriveSymptomStartDate(HowLong.sinceOp), '');
    });

    test('not-sure maps to not_sure with no derived date', () {
      expect(deriveOnsetPattern(HowLong.notSure), OnsetPattern.notSure);
      expect(deriveSymptomStartDate(HowLong.notSure), '');
    });
  });

  group('isValidUKPhone', () {
    test('accepts a UK mobile number with a leading 0', () {
      expect(isValidUKPhone('07123456789'), isTrue);
    });

    test('accepts a +44 formatted number', () {
      expect(isValidUKPhone('+44 7123 456789'), isTrue);
    });

    test('treats an empty string as valid (optional field)', () {
      expect(isValidUKPhone(''), isTrue);
    });

    test('rejects a non-UK-shaped number', () {
      expect(isValidUKPhone('12345'), isFalse);
    });
  });
}
