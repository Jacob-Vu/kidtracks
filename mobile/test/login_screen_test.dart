import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:kidstrack_mobile/features/auth/login_screen.dart';
import 'package:kidstrack_mobile/data/services/session_controller.dart';

import 'test_app.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('login screen shows parent and kid auth flows', (tester) async {
    SharedPreferences.setMockInitialValues({});

    await tester.pumpWidget(
      buildTestApp(
        child: const LoginScreen(),
        session: const AsyncData(SessionState(user: null, profile: null)),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('KidsTrack'), findsOneWidget);
    expect(find.text('Phu huynh'), findsOneWidget);
    expect(find.text('Con'), findsOneWidget);

    await tester.tap(find.text('Con'));
    await tester.pumpAndSettle();

    expect(find.text('Ten dang nhap'), findsOneWidget);
    expect(find.text('Mat khau'), findsWidgets);
  });
}
