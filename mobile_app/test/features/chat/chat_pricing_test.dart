import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/src/features/chat/chat_page.dart';

void main() {
  test('chat pricing lists online and Glasgow home-visit prices as whole prices', () {
    final text = chatPricingText();
    expect(text, contains('Initial Online Assessment (60 min) — £50'));
    expect(text, contains('Online Follow-Up (30 min) — £40'));
    expect(text, contains('price depends on your postcode'));
    expect(text, contains('Initial Assessment at home (60 min) — from £80'));
    expect(text, contains('Follow-Up at home (60 min) — from £70'));
    expect(text, isNot(contains('Bundle')));
    expect(text, contains('cash'));
    expect(text.toLowerCase(), isNot(contains('travel')));
    expect(text, isNot(contains('+')));
  });
}
