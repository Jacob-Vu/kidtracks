import 'package:cloud_functions/cloud_functions.dart';
import 'package:intl/intl.dart';

import '../models/daily_task.dart';
import '../models/day_config.dart';
import '../models/kid.dart';
import '../models/ledger_entry.dart';
import 'id_service.dart';

class FinalizeResult {
  const FinalizeResult({
    required this.success,
    required this.allCompleted,
    required this.delta,
    this.updatedKid,
    this.updatedConfig,
    this.ledgerEntries = const [],
    this.reason,
  });

  final bool success;
  final bool allCompleted;
  final int delta;
  final Kid? updatedKid;
  final DayConfig? updatedConfig;
  final List<LedgerEntry> ledgerEntries;
  final String? reason;
}

class ManualTransactionResult {
  const ManualTransactionResult({
    required this.entry,
    required this.updatedKid,
  });

  final LedgerEntry entry;
  final Kid updatedKid;
}

class ActionsRepository {
  ActionsRepository(
    this._functions, {
    Future<void> Function(String name, Map<String, dynamic> payload)? callHandler,
  }) : _callHandler = callHandler;

  final FirebaseFunctions? _functions;
  final Future<void> Function(String name, Map<String, dynamic> payload)?
      _callHandler;

  static FirebaseFunctions buildDefault() =>
      FirebaseFunctions.instanceFor(region: 'asia-southeast1');

  Future<void> call(String name, Map<String, dynamic> payload) async {
    if (_callHandler != null) {
      await _callHandler(name, payload);
      return;
    }
    final functions = _functions;
    if (functions == null) {
      throw StateError('No FirebaseFunctions instance configured.');
    }
    final callable = functions.httpsCallable(name);
    await callable.call(payload);
  }

  Map<String, dynamic> buildTemplate(String title, String description) {
    return {
      'id': IdService.generate(),
      'title': title,
      'description': description,
    };
  }

  DailyTask buildDailyTask(
    String kidId,
    String date,
    String title,
    String description,
  ) {
    return DailyTask(
      id: IdService.generate(),
      kidId: kidId,
      date: date,
      title: title,
      description: description,
      status: 'pending',
    );
  }

  DayConfig buildDayConfig(
    String kidId,
    String date,
    int rewardAmount,
    int penaltyAmount, {
    DayConfig? existing,
  }) {
    if (existing != null) {
      return existing.copyWith(
        rewardAmount: rewardAmount,
        penaltyAmount: penaltyAmount,
      );
    }
    return DayConfig(
      id: '${kidId}_$date',
      kidId: kidId,
      date: date,
      rewardAmount: rewardAmount,
      penaltyAmount: penaltyAmount,
      isFinalized: false,
    );
  }

  DailyTask toggleTaskStatus(DailyTask task) {
    return task.copyWith(
      status: task.status == 'completed' ? 'pending' : 'completed',
    );
  }

  DailyTask markTaskFailed(DailyTask task) {
    return task.copyWith(
      status: task.status == 'failed' ? 'pending' : 'failed',
    );
  }

  FinalizeResult computeFinalize({
    required String kidId,
    required String date,
    required List<DailyTask> allTasks,
    required List<DayConfig> allConfigs,
    required List<Kid> kids,
  }) {
    final tasks =
        allTasks.where((task) => task.kidId == kidId && task.date == date).toList();
    final config = allConfigs
        .where((item) => item.kidId == kidId && item.date == date)
        .firstOrNull;
    if (config == null || config.isFinalized) {
      return const FinalizeResult(
        success: false,
        allCompleted: false,
        delta: 0,
        reason: 'already_finalized',
      );
    }
    if (tasks.isEmpty) {
      return const FinalizeResult(
        success: false,
        allCompleted: false,
        delta: 0,
        reason: 'no_tasks',
      );
    }

    final kid = kids.where((item) => item.id == kidId).firstOrNull;
    if (kid == null) {
      return const FinalizeResult(
        success: false,
        allCompleted: false,
        delta: 0,
        reason: 'kid_not_found',
      );
    }

    final allCompleted = tasks.every((task) => task.status == 'completed');
    final completedCount = tasks.where((task) => task.status == 'completed').length;
    final failedCount = tasks.where((task) => task.status == 'failed').length;
    final pendingCount = tasks.where((task) => task.status == 'pending').length;

    var delta = 0;
    final ledgerEntries = <LedgerEntry>[];

    if (allCompleted) {
      delta += config.rewardAmount;
      ledgerEntries.add(
        LedgerEntry(
          id: IdService.generate(),
          kidId: kidId,
          date: date,
          type: 'reward',
          amount: config.rewardAmount,
          label: 'All $completedCount tasks completed!',
        ),
      );
    } else {
      if (failedCount > 0) {
        final penalty = config.penaltyAmount * failedCount;
        delta -= penalty;
        ledgerEntries.add(
          LedgerEntry(
            id: IdService.generate(),
            kidId: kidId,
            date: date,
            type: 'penalty',
            amount: -penalty,
            label: '$failedCount task(s) failed',
          ),
        );
      }
      if (pendingCount > 0) {
        final penalty = config.penaltyAmount * pendingCount;
        delta -= penalty;
        ledgerEntries.add(
          LedgerEntry(
            id: IdService.generate(),
            kidId: kidId,
            date: date,
            type: 'penalty',
            amount: -penalty,
            label: '$pendingCount task(s) not completed',
          ),
        );
      }
    }

    return FinalizeResult(
      success: true,
      allCompleted: allCompleted,
      delta: delta,
      updatedKid: kid.copyWith(
        balance: (kid.balance + delta).clamp(0, 1 << 31).toInt(),
      ),
      updatedConfig: config.copyWith(isFinalized: true),
      ledgerEntries: ledgerEntries,
    );
  }

  ManualTransactionResult? buildManualTransaction(
    Kid kid,
    int amount,
    String? label,
  ) {
    return ManualTransactionResult(
      entry: LedgerEntry(
        id: IdService.generate(),
        kidId: kid.id,
        date: DateFormat('yyyy-MM-dd').format(DateTime.now()),
        type: amount >= 0 ? 'manual_reward' : 'manual_penalty',
        amount: amount,
        label: label?.trim().isNotEmpty == true
            ? label!.trim()
            : (amount >= 0 ? 'Manual reward' : 'Manual deduction'),
      ),
      updatedKid: kid.copyWith(
        balance: (kid.balance + amount).clamp(0, 1 << 31).toInt(),
      ),
    );
  }
}

extension<T> on Iterable<T> {
  T? get firstOrNull => isEmpty ? null : first;
}
