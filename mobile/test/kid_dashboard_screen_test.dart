import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:intl/intl.dart';

import 'package:kidstrack_mobile/data/models/daily_task.dart';
import 'package:kidstrack_mobile/data/models/family_collections.dart';
import 'package:kidstrack_mobile/data/models/kid.dart';
import 'package:kidstrack_mobile/data/models/ledger_entry.dart';
import 'package:kidstrack_mobile/data/models/user_profile.dart';
import 'package:kidstrack_mobile/data/services/session_controller.dart';
import 'package:kidstrack_mobile/features/kid/dashboard/kid_dashboard_screen.dart';

import 'test_app.dart';

void main() {
  testWidgets('kid dashboard shows tasks and recent history', (tester) async {
    final today = DateFormat('yyyy-MM-dd').format(DateTime.now());

    await tester.pumpWidget(
      buildTestApp(
        child: const KidDashboardScreen(),
        session: const AsyncData(
          SessionState(
            user: null,
            profile: UserProfile(role: 'kid', familyId: 'fam_1', kidId: 'kid_1'),
          ),
        ),
        family: const AsyncData(
          FamilyCollections(
            kids: [
              Kid(
                id: 'kid_1',
                name: 'Mina',
                displayName: 'Mina',
                avatar: '👧',
                balance: 50000,
              ),
            ],
            dailyTasks: [
              DailyTask(
                id: 'task_1',
                kidId: 'kid_1',
                date: today,
                title: 'Read for 15 minutes',
                description: 'Choose any story',
                status: 'pending',
              ),
            ],
            ledger: [
              LedgerEntry(
                id: 'entry_1',
                kidId: 'kid_1',
                date: '2026-03-14',
                type: 'reward',
                amount: 10000,
                label: 'Great job',
              ),
            ],
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Mina'), findsOneWidget);
    expect(find.text('Read for 15 minutes'), findsOneWidget);
    expect(find.text('Great job'), findsOneWidget);
  });
}
