import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../data/services/session_controller.dart';
import '../features/auth/login_screen.dart';
import '../features/kid/dashboard/kid_dashboard_screen.dart';
import '../features/kid/profile/kid_profile_screen.dart';
import '../features/parent/daily/daily_screen.dart';
import '../features/parent/dashboard/dashboard_screen.dart';
import '../features/parent/ledger/ledger_screen.dart';
import '../features/parent/templates/templates_screen.dart';
import '../features/shared/kid_shell.dart';
import '../features/shared/parent_shell.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(sessionControllerProvider);

  return GoRouter(
    initialLocation: '/login',
    refreshListenable: GoRouterRefreshStream(
      ref.watch(sessionControllerProvider.notifier).changes,
    ),
    redirect: (context, state) {
      if (authState.isLoading) {
        return null;
      }

      final session = authState.valueOrNull;
      final path = state.uri.path;
      final loggedIn = session?.user != null && session?.profile != null;

      if (!loggedIn) {
        return path == '/login' ? null : '/login';
      }

      if (path == '/login') {
        return session!.isKid ? '/kid/dashboard' : '/parent/dashboard';
      }

      if (session!.isKid && path.startsWith('/parent')) {
        return '/kid/dashboard';
      }

      if (session.isParent && path.startsWith('/kid')) {
        return '/parent/dashboard';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return ParentShell(navigationShell: navigationShell);
        },
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/parent/dashboard',
                builder: (context, state) => const DashboardScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/parent/templates',
                builder: (context, state) => const TemplatesScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/parent/daily/:kidId',
                builder: (context, state) => DailyScreen(
                  selectedKidId: state.pathParameters['kidId'],
                ),
              ),
              GoRoute(
                path: '/parent/daily',
                builder: (context, state) => const DailyScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/parent/ledger/:kidId',
                builder: (context, state) => LedgerScreen(
                  selectedKidId: state.pathParameters['kidId'],
                ),
              ),
              GoRoute(
                path: '/parent/ledger',
                builder: (context, state) => const LedgerScreen(),
              ),
            ],
          ),
        ],
      ),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return KidShell(navigationShell: navigationShell);
        },
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/kid/dashboard',
                builder: (context, state) => const KidDashboardScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/kid/profile',
                builder: (context, state) => const KidProfileScreen(),
              ),
            ],
          ),
        ],
      ),
    ],
  );
});

class GoRouterRefreshStream extends ChangeNotifier {
  GoRouterRefreshStream(Stream<dynamic> stream) {
    notifyListeners();
    _subscription = stream.asBroadcastStream().listen((_) => notifyListeners());
  }

  late final StreamSubscription<dynamic> _subscription;

  @override
  void dispose() {
    _subscription.cancel();
    super.dispose();
  }
}
