import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/localization/app_localizations.dart';
import '../../core/localization/locale_controller.dart';
import '../../data/services/family_providers.dart';
import '../../data/services/session_controller.dart';
import '../../core/utils/formatters.dart';

class KidShell extends ConsumerWidget {
  const KidShell({required this.navigationShell, super.key});

  final StatefulNavigationShell navigationShell;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(sessionStateProvider).valueOrNull;
    final familyData = ref.watch(familyCollectionsStateProvider).valueOrNull;
    final kidId = session?.profile?.kidId;
    final kid =
        familyData?.kids.where((item) => item.id == kidId).firstOrNull;
    final l10n = context.l10n;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.t('appName')),
        actions: [
          IconButton(
            onPressed: () => ref.read(localeControllerProvider.notifier).toggle(),
            icon: const Icon(Icons.language),
          ),
          IconButton(
            onPressed: () async => ref.read(authServiceProvider).signOut(),
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            if (kid != null)
              Container(
                margin: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF0F766E),
                  borderRadius: BorderRadius.circular(24),
                ),
                child: Row(
                  children: [
                    Text(kid.avatar, style: const TextStyle(fontSize: 32)),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            kid.label,
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          Text(
                            formatMoney(kid.balance),
                            style: const TextStyle(color: Color(0xFFFDE68A)),
                          ),
                        ],
                      ),
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
        onDestinationSelected: navigationShell.goBranch,
        destinations: [
          NavigationDestination(
            icon: const Icon(Icons.auto_awesome_outlined),
            selectedIcon: const Icon(Icons.auto_awesome),
            label: l10n.t('myDashboard'),
          ),
          NavigationDestination(
            icon: const Icon(Icons.person_outline),
            selectedIcon: const Icon(Icons.person),
            label: l10n.t('myProfile'),
          ),
        ],
      ),
    );
  }
}

extension<T> on Iterable<T> {
  T? get firstOrNull => isEmpty ? null : first;
}
