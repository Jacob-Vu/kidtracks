import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants/default_packs.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../data/models/task_template.dart';
import '../../../data/services/family_providers.dart';
import '../../../data/services/session_controller.dart';

class TemplatesScreen extends ConsumerStatefulWidget {
  const TemplatesScreen({super.key});

  @override
  ConsumerState<TemplatesScreen> createState() => _TemplatesScreenState();
}

class _TemplatesScreenState extends ConsumerState<TemplatesScreen> {
  String _filterKidId = 'all';

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final family = ref.watch(familyCollectionsStateProvider);
    return family.when(
      data: (data) {
        final templates = data.templates.where((template) {
          if (_filterKidId == 'all') return true;
          return template.assignedKidIds.isEmpty ||
              template.assignedKidIds.contains(_filterKidId);
        }).toList();

        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    l10n.t('templates'),
                    style: Theme.of(context).textTheme.headlineMedium,
                  ),
                ),
                FilledButton(
                  onPressed: () => _openTemplateDialog(),
                  child: const Text('New'),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Text('Default Packs', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            ...defaultTaskPacks.map(
              (pack) => Card(
                margin: const EdgeInsets.only(bottom: 10),
                child: ListTile(
                  leading: Text(pack.icon, style: const TextStyle(fontSize: 28)),
                  title: Text(
                    Localizations.localeOf(context).languageCode == 'vi'
                        ? pack.nameVi
                        : pack.nameEn,
                  ),
                  subtitle: Text(
                    Localizations.localeOf(context).languageCode == 'vi'
                        ? pack.descriptionVi
                        : pack.descriptionEn,
                  ),
                  trailing: Wrap(
                    spacing: 8,
                    children: [
                      IconButton(
                        onPressed: () => _previewPack(pack),
                        icon: const Icon(Icons.visibility_outlined),
                      ),
                      FilledButton.tonal(
                        onPressed: () => _importPack(pack),
                        child: const Text('Import'),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
            if (data.kids.isNotEmpty)
              DropdownButtonFormField<String>(
                initialValue: _filterKidId,
                items: [
                  DropdownMenuItem(value: 'all', child: Text(l10n.t('allKids'))),
                  ...data.kids.map((kid) => DropdownMenuItem(
                        value: kid.id,
                        child: Text(kid.label),
                      )),
                ],
                onChanged: (value) => setState(() => _filterKidId = value ?? 'all'),
                decoration: const InputDecoration(labelText: 'Filter'),
              ),
            const SizedBox(height: 12),
            if (templates.isEmpty)
              const Card(
                child: Padding(
                  padding: EdgeInsets.all(24),
                  child: Text('No templates yet'),
                ),
              )
            else
              ...templates.map(
                (template) => Card(
                  margin: const EdgeInsets.only(bottom: 10),
                  child: ListTile(
                    title: Text(template.title),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (template.description.isNotEmpty) Text(template.description),
                        const SizedBox(height: 6),
                        Wrap(
                          spacing: 6,
                          children: template.assignedKidIds.isEmpty
                              ? const [Chip(label: Text('All kids'))]
                              : data.kids
                                  .where((kid) => template.assignedKidIds.contains(kid.id))
                                  .map((kid) => Chip(label: Text('${kid.avatar} ${kid.label}')))
                                  .toList(),
                        ),
                      ],
                    ),
                    trailing: Wrap(
                      spacing: 4,
                      children: [
                        IconButton(
                          onPressed: () => _assignTemplate(template),
                          icon: const Icon(Icons.people_outline),
                        ),
                        IconButton(
                          onPressed: () => _openTemplateDialog(template: template),
                          icon: const Icon(Icons.edit),
                        ),
                        IconButton(
                          onPressed: () async {
                            final familyId = ref
                                .read(sessionStateProvider)
                                .valueOrNull!
                                .profile!
                                .familyId;
                            await ref.read(actionsRepositoryProvider).call('deleteTemplate', {
                              'familyId': familyId,
                              'templateId': template.id,
                            });
                          },
                          icon: const Icon(Icons.delete_outline),
                        ),
                      ],
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

  Future<void> _previewPack(DefaultTaskPack pack) {
    final locale = Localizations.localeOf(context).languageCode;
    return showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(locale == 'vi' ? pack.nameVi : pack.nameEn),
        content: SizedBox(
          width: 420,
          child: ListView(
            shrinkWrap: true,
            children: pack.tasks
                .map(
                  (task) => ListTile(
                    title: Text(locale == 'vi' ? task.titleVi : task.titleEn),
                    subtitle: Text(
                      locale == 'vi' ? task.descriptionVi : task.descriptionEn,
                    ),
                  ),
                )
                .toList(),
          ),
        ),
      ),
    );
  }

  Future<void> _importPack(DefaultTaskPack pack) async {
    final locale = Localizations.localeOf(context).languageCode;
    final familyId = ref.read(sessionStateProvider).valueOrNull!.profile!.familyId;
    await ref.read(actionsRepositoryProvider).call('importDefaultPack', {
      'familyId': familyId,
      'pack': {
        'id': pack.id,
        'name': locale == 'vi' ? pack.nameVi : pack.nameEn,
        'tasks': pack.tasks
            .map(
              (task) => {
                'title': locale == 'vi' ? task.titleVi : task.titleEn,
                'description':
                    locale == 'vi' ? task.descriptionVi : task.descriptionEn,
              },
            )
            .toList(),
      },
    });
  }

  Future<void> _openTemplateDialog({TaskTemplate? template}) async {
    final title = TextEditingController(text: template?.title ?? '');
    final description = TextEditingController(text: template?.description ?? '');
    await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(template == null ? 'New Template' : 'Edit Template'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: title, decoration: const InputDecoration(labelText: 'Title')),
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
              if (template == null) {
                final payload = ref.read(actionsRepositoryProvider).buildTemplate(
                      title.text.trim(),
                      description.text.trim(),
                    );
                await ref.read(actionsRepositoryProvider).call('addTemplate', {
                  'familyId': familyId,
                  'template': payload,
                });
              } else {
                await ref.read(actionsRepositoryProvider).call('updateTemplate', {
                  'familyId': familyId,
                  'templateId': template.id,
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

  Future<void> _assignTemplate(TaskTemplate template) async {
    final family = ref.read(familyCollectionsStateProvider).valueOrNull;
    final selected = <String>{...template.assignedKidIds};
    await showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setLocalState) => AlertDialog(
          title: const Text('Assign to kids'),
          content: SizedBox(
            width: 360,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: family!.kids
                  .map(
                    (kid) => CheckboxListTile(
                      value: selected.contains(kid.id),
                      title: Text('${kid.avatar} ${kid.label}'),
                      onChanged: (value) {
                        setLocalState(() {
                          value == true ? selected.add(kid.id) : selected.remove(kid.id);
                        });
                      },
                    ),
                  )
                  .toList(),
            ),
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
                await ref.read(actionsRepositoryProvider).call('assignTemplateToKids', {
                  'familyId': familyId,
                  'templateId': template.id,
                  'kidIds': selected.toList(),
                });
                if (mounted) Navigator.of(context).pop();
              },
              child: Text(context.l10n.t('save')),
            ),
          ],
        ),
      ),
    );
  }
}
