import 'daily_task.dart';
import 'day_config.dart';
import 'kid.dart';
import 'ledger_entry.dart';
import 'task_template.dart';

class FamilyCollections {
  const FamilyCollections({
    this.kids = const [],
    this.templates = const [],
    this.dailyTasks = const [],
    this.dayConfigs = const [],
    this.ledger = const [],
  });

  final List<Kid> kids;
  final List<TaskTemplate> templates;
  final List<DailyTask> dailyTasks;
  final List<DayConfig> dayConfigs;
  final List<LedgerEntry> ledger;

  FamilyCollections copyWith({
    List<Kid>? kids,
    List<TaskTemplate>? templates,
    List<DailyTask>? dailyTasks,
    List<DayConfig>? dayConfigs,
    List<LedgerEntry>? ledger,
  }) {
    return FamilyCollections(
      kids: kids ?? this.kids,
      templates: templates ?? this.templates,
      dailyTasks: dailyTasks ?? this.dailyTasks,
      dayConfigs: dayConfigs ?? this.dayConfigs,
      ledger: ledger ?? this.ledger,
    );
  }
}

