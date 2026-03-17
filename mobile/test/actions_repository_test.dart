import 'package:flutter_test/flutter_test.dart';

import 'package:kidstrack_mobile/data/models/daily_task.dart';
import 'package:kidstrack_mobile/data/models/day_config.dart';
import 'package:kidstrack_mobile/data/models/kid.dart';
import 'package:kidstrack_mobile/data/services/actions_repository.dart';

void main() {
  test('computeFinalize rewards completed day and clamps balances at zero', () {
    final repository = ActionsRepository(
      null,
      callHandler: (_, __) async {},
    );

    final result = repository.computeFinalize(
      kidId: 'kid_1',
      date: '2026-03-15',
      allTasks: const [
        DailyTask(
          id: 'task_1',
          kidId: 'kid_1',
          date: '2026-03-15',
          title: 'Task 1',
          description: '',
          status: 'completed',
        ),
        DailyTask(
          id: 'task_2',
          kidId: 'kid_1',
          date: '2026-03-15',
          title: 'Task 2',
          description: '',
          status: 'completed',
        ),
      ],
      allConfigs: const [
        DayConfig(
          id: 'kid_1_2026-03-15',
          kidId: 'kid_1',
          date: '2026-03-15',
          rewardAmount: 20000,
          penaltyAmount: 5000,
          isFinalized: false,
        ),
      ],
      kids: const [
        Kid(
          id: 'kid_1',
          name: 'Kid',
          displayName: 'Kid',
          avatar: '🧒',
          balance: 0,
        ),
      ],
    );

    expect(result.success, isTrue);
    expect(result.allCompleted, isTrue);
    expect(result.delta, 20000);
    expect(result.updatedKid?.balance, 20000);
    expect(result.updatedConfig?.isFinalized, isTrue);
    expect(result.ledgerEntries, hasLength(1));
  });
}

