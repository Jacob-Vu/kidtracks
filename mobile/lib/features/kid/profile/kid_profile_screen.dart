import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants/avatars.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../data/services/family_providers.dart';
import '../../../data/services/session_controller.dart';

class KidProfileScreen extends ConsumerStatefulWidget {
  const KidProfileScreen({super.key});

  @override
  ConsumerState<KidProfileScreen> createState() => _KidProfileScreenState();
}

class _KidProfileScreenState extends ConsumerState<KidProfileScreen> {
  final _displayName = TextEditingController();
  final _currentPassword = TextEditingController();
  final _newPassword = TextEditingController();
  final _email = TextEditingController();
  final _emailPassword = TextEditingController();
  String _avatar = kidAvatars.first;
  String? _message;

  @override
  void dispose() {
    _displayName.dispose();
    _currentPassword.dispose();
    _newPassword.dispose();
    _email.dispose();
    _emailPassword.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final session = ref.watch(sessionStateProvider).valueOrNull;
    final family = ref.watch(familyCollectionsStateProvider);

    return family.when(
      data: (data) {
        final kidId = session?.profile?.kidId;
        final kid = data.kids.where((item) => item.id == kidId).firstOrNull;
        if (kid == null) return Center(child: Text(l10n.t('loading')));

        if (_displayName.text.isEmpty) {
          _displayName.text = kid.label;
          _avatar = kid.avatar;
        }

        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            if (_message != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Text(_message!),
              ),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      l10n.t('myProfile'),
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _displayName,
                      decoration: InputDecoration(labelText: l10n.t('displayName')),
                    ),
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
                                child: Text(
                                  avatar,
                                  style: const TextStyle(fontSize: 28),
                                ),
                              ),
                            ),
                          )
                          .toList(),
                    ),
                    const SizedBox(height: 12),
                    FilledButton(
                      onPressed: () => _saveProfile(kid.id),
                      child: Text(l10n.t('save')),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      l10n.t('changePassword'),
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _currentPassword,
                      obscureText: true,
                      decoration: InputDecoration(
                        labelText: 'Current ${l10n.t('password')}',
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _newPassword,
                      obscureText: true,
                      decoration: InputDecoration(
                        labelText: 'New ${l10n.t('password')}',
                      ),
                    ),
                    const SizedBox(height: 12),
                    FilledButton(
                      onPressed: _changePassword,
                      child: Text(l10n.t('changePassword')),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      l10n.t('linkEmail'),
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _emailPassword,
                      obscureText: true,
                      decoration: InputDecoration(
                        labelText: 'Current ${l10n.t('password')}',
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _email,
                      decoration: InputDecoration(labelText: l10n.t('email')),
                    ),
                    const SizedBox(height: 12),
                    FilledButton(
                      onPressed: _linkEmail,
                      child: Text(l10n.t('linkEmail')),
                    ),
                  ],
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

  Future<void> _saveProfile(String kidId) async {
    try {
      final familyId = ref.read(sessionStateProvider).valueOrNull!.profile!.familyId;
      await ref.read(authServiceProvider).updateKidDocument(
        familyId: familyId,
        kidId: kidId,
        data: {
          'displayName': _displayName.text.trim(),
          'name': _displayName.text.trim(),
          'avatar': _avatar,
        },
      );
      setState(() => _message = 'Profile saved');
    } catch (error) {
      setState(() => _message = error.toString());
    }
  }

  Future<void> _changePassword() async {
    try {
      await ref.read(authServiceProvider).changeKidPassword(
            _currentPassword.text,
            _newPassword.text,
          );
      setState(() => _message = 'Password updated');
    } catch (error) {
      setState(() => _message = error.toString());
    }
  }

  Future<void> _linkEmail() async {
    try {
      await ref.read(authServiceProvider).linkKidEmail(
            _emailPassword.text,
            _email.text.trim(),
          );
      setState(() => _message = 'Email linked');
    } catch (error) {
      setState(() => _message = error.toString());
    }
  }
}

extension<T> on Iterable<T> {
  T? get firstOrNull => isEmpty ? null : first;
}
