import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:kidstrack_mobile/data/models/family_collections.dart';
import 'package:kidstrack_mobile/data/models/kid.dart';
import 'package:kidstrack_mobile/data/models/user_profile.dart';
import 'package:kidstrack_mobile/data/services/session_controller.dart';
import 'package:kidstrack_mobile/features/parent/dashboard/dashboard_screen.dart';

import 'test_app.dart';

void main() {
  testWidgets('dashboard shows kid cards and balances', (tester) async {
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
                name: 'Tom',
                displayName: 'Tom',
                avatar: '🧒',
                balance: 20000,
                username: 'tommy',
              ),
            ],
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Tom'), findsOneWidget);
    expect(find.textContaining('@tommy'), findsOneWidget);
    expect(find.text('20k'), findsOneWidget);
  });
}
