import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../core/localization/app_localizations.dart';
import '../../../core/utils/formatters.dart';
import '../../../data/models/daily_task.dart';
import '../../../data/models/day_config.dart';
import '../../../data/models/kid.dart';
import '../../../data/services/family_providers.dart';
import '../../../data/services/session_controller.dart';

class DailyScreen extends ConsumerStatefulWidget {
  const DailyScreen({this.selectedKidId, super.key});

  final String? selectedKidId;

  @override
  ConsumerState<DailyScreen> createState() => _DailyScreenState();
}

class _DailyScreenState extends ConsumerState<DailyScreen> {
  String? _selectedKidId;
  late DateTime _date = DateTime.now();

  @override
  void initState() {
    super.initState();
    _selectedKidId = widget.selectedKidId;
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final family = ref.watch(familyCollectionsStateProvider);

    return family.when(
      data: (data) {
        final kidId = _selectedKidId ?? (data.kids.isNotEmpty ? data.kids.first.id : null);
        final kid = data.kids.where((item) => item.id == kidId).firstOrNull;
        final day = DateFormat('yyyy-MM-dd').format(_date);
        final tasks = data.dailyTasks
            .where((item) => item.kidId == kidId && item.date == day)
            .toList();
        final config = data.dayConfigs
            .where((item) => item.kidId == kidId && item.date == day)
            .firstOrNull;
        final completed = tasks.where((item) => item.status == 'completed').length;
        final failed = tasks.where((item) => item.status == 'failed').length;
        final pending = tasks.where((item) => item.status == 'pending').length;
        final total = tasks.length;

        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text(
              l10n.t('dailyTasks'),
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: 12),
            if (data.kids.isEmpty)
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Text(l10n.t('noKids')),
                ),
              )
            else ...[
              DropdownButtonFormField<String>(
                initialValue: kidId,
                items: data.kids
                    .map((kid) => DropdownMenuItem(
                          value: kid.id,
                          child: Text('${kid.avatar} ${kid.label}'),
                        ))
                    .toList(),
                onChanged: (value) => setState(() => _selectedKidId = value),
                decoration: const InputDecoration(labelText: 'Kid'),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  IconButton(
                    onPressed: () => setState(() {
                      _date = _date.subtract(const Duration(days: 1));
                    }),
                    icon: const Icon(Icons.chevron_left),
                  ),
                  Expanded(
                    child: Text(
                      DateFormat.yMMMd().format(_date),
                      textAlign: TextAlign.center,
                    ),
                  ),
                  IconButton(
                    onPressed: () => setState(() {
                      _date = _date.add(const Duration(days: 1));
                    }),
                    icon: const Icon(Icons.chevron_right),
                  ),
                ],
              ),
              if (kid != null) ...[
                const SizedBox(height: 12),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('${kid.avatar} ${kid.label}',
                            style: Theme.of(context).textTheme.titleLarge),
                        const SizedBox(height: 6),
                        Text('Balance: ${formatMoney(kid.balance)}'),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 8,
                          children: [
                            Chip(label: Text('Done $completed')),
                            Chip(label: Text('Failed $failed')),
                            Chip(label: Text('Pending $pending')),
                            Chip(label: Text('Total $total')),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    FilledButton.tonal(
                      onPressed: () => _loadTemplatesForDay(
                        kid.id,
                        day,
                        data.templates,
                        tasks,
                      ),
                      child: Text(l10n.t('loadTemplates')),
                    ),
                    FilledButton(
                      onPressed: () => _openTaskDialog(kid.id, day),
                      child: Text(l10n.t('addTask')),
                    ),
                    FilledButton.tonal(
                      onPressed: () => _openConfigDialog(kid.id, day, config),
                      child: Text(l10n.t('setRewards')),
                    ),
                    FilledButton(
                      onPressed: total == 0 || config?.isFinalized == true
                          ? null
                          : () => _finalizeDay(
                                kid,
                                day,
                                data.dailyTasks,
                                data.dayConfigs,
                                data.kids,
                              ),
                      child: Text(config?.isFinalized == true
                          ? l10n.t('finalized')
                          : l10n.t('finalizeDay')),
                    ),
                  ],
                ),
              ],
              const SizedBox(height: 16),
              if (tasks.isEmpty)
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Text(l10n.t('noTasks')),
                  ),
                )
              else
                ...tasks.map(
                  (task) => Card(
                    margin: const EdgeInsets.only(bottom: 10),
                    child: ListTile(
                      leading: Checkbox(
                        value: task.status == 'completed',
                        onChanged: config?.isFinalized == true
                            ? null
                            : (_) => _updateTask(task, toggle: true),
                      ),
                      title: Text(task.title),
                      subtitle: Text(task.description),
                      trailing: Wrap(
                        spacing: 4,
                        children: [
                          IconButton(
                            onPressed: config?.isFinalized == true
                                ? null
                                : () => _updateTask(task, fail: true),
                            icon: const Icon(Icons.close),
                          ),
                          IconButton(
                            onPressed: config?.isFinalized == true || kid == null
                                ? null
                                : () => _openTaskDialog(kid.id, day, task: task),
                            icon: const Icon(Icons.edit),
                          ),
                          IconButton(
                            onPressed: config?.isFinalized == true
                                ? null
                                : () => _deleteTask(task),
                            icon: const Icon(Icons.delete_outline),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
            ],
          ],
        );
      },
      error: (error, _) => Center(child: Text(error.toString())),
      loading: () => Center(child: Text(l10n.t('loading'))),
    );
  }

  Future<void> _loadTemplatesForDay(
    String kidId,
    String date,
    List templates,
    List<DailyTask> existingTasks,
  ) async {
    final repo = ref.read(actionsRepositoryProvider);
    final familyId =
        ref.read(sessionStateProvider).valueOrNull!.profile!.familyId;
    final existingTitles = existingTasks.map((task) => task.title).toSet();
    final tasksToCreate = templates
        .where((template) {
          final assigned = template.assignedKidIds as List<String>;
          if (assigned.isNotEmpty && !assigned.contains(kidId)) return false;
          return !existingTitles.contains(template.title);
        })
        .map((template) => repo
            .buildDailyTask(
              kidId,
              date,
              template.title as String,
              template.description as String,
            )
            .toMap())
        .toList();

    if (tasksToCreate.isEmpty) return;
    await repo.call('loadTemplatesForDay', {
      'familyId': familyId,
      'tasksToCreate': tasksToCreate,
    });
  }

  Future<void> _openTaskDialog(String kidId, String date, {DailyTask? task}) async {
    final title = TextEditingController(text: task?.title ?? '');
    final description = TextEditingController(text: task?.description ?? '');
    await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(task == null ? 'Task' : 'Edit Task'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: title,
              decoration: const InputDecoration(labelText: 'Title'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: description,
              decoration: const InputDecoration(labelText: 'Description'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text(context.l10n.t('cancel')),
          ),
          FilledButton(
            onPressed: () async {
              final repo = ref.read(actionsRepositoryProvider);
              final familyId =
                  ref.read(sessionStateProvider).valueOrNull!.profile!.familyId;
              if (task == null) {
                final newTask = repo.buildDailyTask(
                  kidId,
                  date,
                  title.text.trim(),
                  description.text.trim(),
                );
                await repo.call('addDailyTask', {
                  'familyId': familyId,
                  'task': newTask.toMap(),
                });
              } else {
                await repo.call('updateDailyTask', {
                  'familyId': familyId,
                  'taskId': task.id,
                  'updates': {
                    'title': title.text.trim(),
                    'description': description.text.trim(),
                  },
                });
              }
              if (mounted) Navigator.of(context).pop();
            },
            child: Text(context.l10n.t('save')),
          ),
        ],
      ),
    );
    title.dispose();
    description.dispose();
  }

  Future<void> _openConfigDialog(
    String kidId,
    String date,
    DayConfig? existing,
  ) async {
    final reward = TextEditingController(
      text: ((existing?.rewardAmount ?? 20000) / 1000).round().toString(),
    );
    final penalty = TextEditingController(
      text: ((existing?.penaltyAmount ?? 10000) / 1000).round().toString(),
    );
    await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(context.l10n.t('setRewards')),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: reward,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Reward (thousands)'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: penalty,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Penalty (thousands)'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text(context.l10n.t('cancel')),
          ),
          FilledButton(
            onPressed: () async {
              final familyId =
                  ref.read(sessionStateProvider).valueOrNull!.profile!.familyId;
              final config = ref.read(actionsRepositoryProvider).buildDayConfig(
                    kidId,
                    date,
                    int.parse(reward.text) * 1000,
                    int.parse(penalty.text) * 1000,
                    existing: existing,
                  );
              await ref.read(actionsRepositoryProvider).call('setDayConfig', {
                'familyId': familyId,
                'config': config.toMap(),
              });
              if (mounted) Navigator.of(context).pop();
            },
            child: Text(context.l10n.t('save')),
          ),
        ],
      ),
    );
    reward.dispose();
    penalty.dispose();
  }

  Future<void> _updateTask(DailyTask task, {bool toggle = false, bool fail = false}) async {
    final familyId = ref.read(sessionStateProvider).valueOrNull!.profile!.familyId;
    final repo = ref.read(actionsRepositoryProvider);
    final updated = toggle ? repo.toggleTaskStatus(task) : repo.markTaskFailed(task);
    await repo.call('updateDailyTask', {
      'familyId': familyId,
      'taskId': task.id,
      'updates': updated.toMap(),
    });
  }

  Future<void> _deleteTask(DailyTask task) async {
    final familyId = ref.read(sessionStateProvider).valueOrNull!.profile!.familyId;
    await ref.read(actionsRepositoryProvider).call('deleteDailyTask', {
      'familyId': familyId,
      'taskId': task.id,
    });
  }

  Future<void> _finalizeDay(
    Kid kid,
    String date,
    List<DailyTask> allTasks,
    List<DayConfig> allConfigs,
    List<Kid> kids,
  ) async {
    final repo = ref.read(actionsRepositoryProvider);
    final familyId = ref.read(sessionStateProvider).valueOrNull!.profile!.familyId;
    final result = repo.computeFinalize(
      kidId: kid.id,
      date: date,
      allTasks: allTasks,
      allConfigs: allConfigs,
      kids: kids,
    );
    if (!result.success) return;
    await repo.call('finalizeDay', {
      'familyId': familyId,
      'updatedKid': result.updatedKid!.toMap(),
      'updatedConfig': result.updatedConfig!.toMap(),
      'ledgerEntries': result.ledgerEntries.map((item) => item.toMap()).toList(),
    });
  }
}

extension<T> on Iterable<T> {
  T? get firstOrNull => isEmpty ? null : first;
}
