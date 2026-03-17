import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants/avatars.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../core/utils/formatters.dart';
import '../../../data/services/family_providers.dart';
import '../../../data/services/id_service.dart';
import '../../../data/services/session_controller.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final family = ref.watch(familyCollectionsStateProvider);

    return family.when(
      data: (data) => ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  l10n.t('dashboard'),
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
              ),
              FilledButton.icon(
                onPressed: () => showDialog(
                  context: context,
                  builder: (_) => const _KidDialog(),
                ),
                icon: const Icon(Icons.person_add_alt_1),
                label: Text(l10n.t('addKid')),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (data.kids.isEmpty)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Text(l10n.t('noKids')),
              ),
            )
          else
            ...data.kids.map(
              (kid) => Card(
                margin: const EdgeInsets.only(bottom: 12),
                child: ListTile(
                  contentPadding: const EdgeInsets.all(16),
                  leading: Text(kid.avatar, style: const TextStyle(fontSize: 28)),
                  title: Text(kid.label),
                  subtitle: Text(
                    '${kid.username != null ? '@${kid.username} | ' : ''}${formatMoney(kid.balance)}',
                  ),
                  trailing: Wrap(
                    spacing: 8,
                    children: [
                      IconButton(
                        onPressed: () => context.go('/parent/daily/${kid.id}'),
                        icon: const Icon(Icons.event_note),
                      ),
                      IconButton(
                        onPressed: () => context.go('/parent/ledger/${kid.id}'),
                        icon: const Icon(Icons.account_balance_wallet),
                      ),
                      IconButton(
                        onPressed: () => showDialog(
                          context: context,
                          builder: (_) => _KidDialog(existingKid: kid),
                        ),
                        icon: const Icon(Icons.edit),
                      ),
                      IconButton(
                        onPressed: () async {
                          final familyId =
                              ref.read(sessionStateProvider).valueOrNull!.profile!.familyId;
                          await ref.read(actionsRepositoryProvider).call(
                            'deleteKid',
                            {'familyId': familyId, 'kidId': kid.id},
                          );
                        },
                        icon: const Icon(Icons.delete_outline),
                      ),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
      error: (error, _) => Center(child: Text(error.toString())),
      loading: () => Center(child: Text(l10n.t('loading'))),
    );
  }
}

class _KidDialog extends ConsumerStatefulWidget {
  const _KidDialog({this.existingKid});

  final dynamic existingKid;

  @override
  ConsumerState<_KidDialog> createState() => _KidDialogState();
}

class _KidDialogState extends ConsumerState<_KidDialog> {
  late final _nameController = TextEditingController(
    text: widget.existingKid?.displayName ?? widget.existingKid?.name ?? '',
  );
  late final _usernameController = TextEditingController(
    text: widget.existingKid?.username ?? '',
  );
  final _passwordController = TextEditingController();
  late String _avatar = widget.existingKid?.avatar ?? kidAvatars.first;
  String? _error;
  bool _busy = false;

  bool get _isEdit => widget.existingKid != null;

  @override
  void dispose() {
    _nameController.dispose();
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return AlertDialog(
      title: Text(_isEdit ? 'Edit Kid' : l10n.t('addKid')),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (_error != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Text(_error!, style: const TextStyle(color: Colors.red)),
              ),
            TextField(
              controller: _nameController,
              decoration: InputDecoration(labelText: l10n.t('displayName')),
            ),
            if (!_isEdit) ...[
              const SizedBox(height: 12),
              TextField(
                controller: _usernameController,
                decoration: InputDecoration(labelText: l10n.t('username')),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _passwordController,
                obscureText: true,
                decoration: InputDecoration(labelText: l10n.t('password')),
              ),
            ],
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: kidAvatars
                  .map(
                    (avatar) => InkWell(
                      onTap: () => setState(() => _avatar = avatar),
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: _avatar == avatar
                                ? Theme.of(context).colorScheme.primary
                                : Colors.transparent,
                          ),
                        ),
                        child: Text(avatar, style: const TextStyle(fontSize: 28)),
                      ),
                    ),
                  )
                  .toList(),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: _busy ? null : () => Navigator.of(context).pop(),
          child: Text(l10n.t('cancel')),
        ),
        FilledButton(
          onPressed: _busy ? null : _save,
          child: Text(l10n.t('save')),
        ),
      ],
    );
  }

  Future<void> _save() async {
    setState(() {
      _busy = true;
      _error = null;
    });

    try {
      final session = ref.read(sessionStateProvider).valueOrNull;
      final familyId = session?.profile?.familyId;
      if (familyId == null) throw Exception('Missing family id');

      if (_isEdit) {
        await ref.read(authServiceProvider).updateKidDocument(
          familyId: familyId,
          kidId: widget.existingKid.id as String,
          data: {
            'displayName': _nameController.text.trim(),
            'name': _nameController.text.trim(),
            'avatar': _avatar,
          },
        );
      } else {
        const apiKey = String.fromEnvironment('FIREBASE_API_KEY');
        if (apiKey.isEmpty) {
          throw Exception('Missing FIREBASE_API_KEY dart define');
        }
        final username = _usernameController.text.trim().toLowerCase();
        final kidUid = await ref.read(authServiceProvider).createKidAuthAccount(
              username: username,
              password: _passwordController.text,
              familyId: familyId,
              apiKey: apiKey,
            );
        final kidId = IdService.generate();
        await ref.read(authServiceProvider).createKidProfile(
              familyId: familyId,
              kidUid: kidUid,
              kidId: kidId,
              displayName: _nameController.text.trim(),
              username: username,
              avatar: _avatar,
            );
      }
      if (mounted) Navigator.of(context).pop();
    } catch (error) {
      setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }
}
