import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/src/features/chat/chat_page.dart';

void main() {
  test('chat pricing lists online and Glasgow home-visit prices as whole prices', () {
    final text = chatPricingText();
    expect(text, contains('Initial Online Assessment (60 min) — £40'));
    expect(text, contains('Online Follow-Up (30 min) — £30'));
    expect(text, contains('Home visits (Glasgow area):'));
    expect(text, contains('Initial Assessment at home (60 min) — £80'));
    expect(text, contains('Follow-Up at home (30 min) — £70'));
    expect(text, contains('4-Session Bundle — £120 online, £280 at home'));
    expect(text, contains('8-Session Bundle — £225 online, £545 at home'));
    expect(text.toLowerCase(), isNot(contains('travel')));
    expect(text, isNot(contains('+')));
  });
}
