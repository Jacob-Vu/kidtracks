import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../core/localization/app_localizations.dart';
import '../../../core/utils/formatters.dart';
import '../../../data/models/daily_task.dart';
import '../../../data/services/family_providers.dart';
import '../../../data/services/session_controller.dart';

class KidDashboardScreen extends ConsumerWidget {
  const KidDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final session = ref.watch(sessionStateProvider).valueOrNull;
    final family = ref.watch(familyCollectionsStateProvider);
    final today = DateFormat('yyyy-MM-dd').format(DateTime.now());

    return family.when(
      data: (data) {
        final kidId = session?.profile?.kidId;
        final kid = data.kids.where((item) => item.id == kidId).firstOrNull;
        if (kid == null) {
          return Center(child: Text(l10n.t('loading')));
        }
        final tasks = data.dailyTasks
            .where((task) => task.kidId == kid.id && task.date == today)
            .toList();
        final ledger = data.ledger.where((entry) => entry.kidId == kid.id).toList()
          ..sort((a, b) => b.id.compareTo(a.id));

        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Card(
              color: const Color(0xFF0F766E),
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Row(
                  children: [
                    Text(kid.avatar, style: const TextStyle(fontSize: 40)),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            kid.label,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 20,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          Text(
                            formatMoney(kid.balance),
                            style: const TextStyle(
                              color: Color(0xFFFDE68A),
                              fontSize: 16,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: Text(
                    l10n.t('myDashboard'),
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                ),
                FilledButton(
                  onPressed: () => _openTaskDialog(context, ref, kid.id, today),
                  child: Text(l10n.t('addTask')),
                ),
              ],
            ),
            const SizedBox(height: 12),
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
                      onChanged: (_) => _toggleTask(ref, task),
                    ),
                    title: Text(task.title),
                    subtitle: Text(task.description),
                    trailing: IconButton(
                      onPressed: () => _openTaskDialog(
                        context,
                        ref,
                        kid.id,
                        today,
                        task: task,
                      ),
                      icon: const Icon(Icons.edit),
                    ),
                  ),
                ),
              ),
            const SizedBox(height: 16),
            Text(
              l10n.t('recentHistory'),
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            ...ledger.take(8).map(
              (entry) => Card(
                margin: const EdgeInsets.only(bottom: 10),
                child: ListTile(
                  title: Text(entry.label),
                  subtitle: Text(entry.date),
                  trailing: Text(
                    '${entry.amount >= 0 ? '+' : ''}${formatMoney(entry.amount)}',
                  ),
                ),
              ),
            ),
          ],
        );
      },
      error: (error, _) => Center(child: Text(error.toString())),
      loading: () => Center(child: Text(l10n.t('loading'))),
    );
  }

  Future<void> _toggleTask(WidgetRef ref, DailyTask task) async {
    final repo = ref.read(actionsRepositoryProvider);
    final familyId = ref.read(sessionStateProvider).valueOrNull!.profile!.familyId;
    final updated = repo.toggleTaskStatus(task);
    await repo.call('updateDailyTask', {
      'familyId': familyId,
      'taskId': task.id,
      'updates': updated.toMap(),
    });
  }

  Future<void> _openTaskDialog(
    BuildContext context,
    WidgetRef ref,
    String kidId,
    String date, {
    DailyTask? task,
  }) async {
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
              final familyId =
                  ref.read(sessionStateProvider).valueOrNull!.profile!.familyId;
              final repo = ref.read(actionsRepositoryProvider);
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
              if (context.mounted) Navigator.of(context).pop();
            },
            child: Text(context.l10n.t('save')),
          ),
        ],
      ),
    );
    title.dispose();
    description.dispose();
  }
}

extension<T> on Iterable<T> {
  T? get firstOrNull => isEmpty ? null : first;
}
