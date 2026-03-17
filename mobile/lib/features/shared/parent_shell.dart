import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/localization/app_localizations.dart';
import '../../core/localization/locale_controller.dart';
import '../../data/services/session_controller.dart';

class ParentShell extends ConsumerWidget {
  const ParentShell({required this.navigationShell, super.key});

  final StatefulNavigationShell navigationShell;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(sessionStateProvider).valueOrNull;
    final profile = session?.profile;
    final l10n = context.l10n;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.t('appName')),
        actions: [
          IconButton(
            onPressed: () => ref.read(localeControllerProvider.notifier).toggle(),
            icon: const Icon(Icons.language),
            tooltip: l10n.t('language'),
          ),
          IconButton(
            onPressed: () async {
              await ref.read(authServiceProvider).signOut();
            },
            icon: const Icon(Icons.logout),
            tooltip: l10n.t('signOut'),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            if (profile != null)
              Container(
                margin: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  children: [
                    const CircleAvatar(child: Icon(Icons.family_restroom)),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(profile.displayName ?? profile.email ?? 'Parent'),
                    ),
                  ],
                ),
              ),
            Expanded(child: navigationShell),
          ],
        ),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: navigationShell.currentIndex,
        onDestinationSelected: (index) {
          navigationShell.goBranch(index);
        },
        destinations: [
          NavigationDestination(
            icon: const Icon(Icons.dashboard_outlined),
            selectedIcon: const Icon(Icons.dashboard),
            label: l10n.t('dashboard'),
          ),
          NavigationDestination(
            icon: const Icon(Icons.library_books_outlined),
            selectedIcon: const Icon(Icons.library_books),
            label: l10n.t('templates'),
          ),
          NavigationDestination(
            icon: const Icon(Icons.event_note_outlined),
            selectedIcon: const Icon(Icons.event_note),
            label: l10n.t('dailyTasks'),
          ),
          NavigationDestination(
            icon: const Icon(Icons.account_balance_wallet_outlined),
            selectedIcon: const Icon(Icons.account_balance_wallet),
            label: l10n.t('ledger'),
          ),
        ],
      ),
    );
  }
}
