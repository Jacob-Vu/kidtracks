import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

import 'package:kidstrack_mobile/data/models/family_collections.dart';
import 'package:kidstrack_mobile/data/models/kid.dart';
import 'package:kidstrack_mobile/data/models/user_profile.dart';
import 'package:kidstrack_mobile/data/services/session_controller.dart';
import 'package:kidstrack_mobile/features/auth/login_screen.dart';
import 'package:kidstrack_mobile/features/parent/dashboard/dashboard_screen.dart';

import '../test/test_app.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('mobile smoke flow renders login and dashboard states', (tester) async {
    await tester.pumpWidget(
      buildTestApp(
        child: const LoginScreen(),
        session: const AsyncData(SessionState(user: null, profile: null)),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('KidsTrack'), findsOneWidget);

    await tester.pumpWidget(
      buildTestApp(
        child: const DashboardScreen(),
        session: const AsyncData(
          SessionState(
            user: null,
            profile: UserProfile(role: 'parent', familyId: 'fam_1'),
          ),
        ),
        family: const AsyncData(
          FamilyCollections(
            kids: [
              Kid(
                id: 'kid_1',
                name: 'Ava',
                displayName: 'Ava',
                avatar: '👧',
                balance: 30000,
              ),
            ],
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Ava'), findsOneWidget);
    expect(find.text('30k'), findsOneWidget);
  });
}
