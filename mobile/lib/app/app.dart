import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/localization/app_localizations.dart';
import '../core/localization/locale_controller.dart';
import '../data/services/firebase_bootstrap.dart';
import '../firebase_options.dart';
import 'router.dart';
import 'theme.dart';

class KidsTrackApp extends ConsumerWidget {
  const KidsTrackApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final locale = ref.watch(localeControllerProvider);
    final router = ref.watch(appRouterProvider);

    return FutureBuilder(
      future: FirebaseBootstrap.ensureInitialized(
        () => Firebase.initializeApp(
          options: DefaultFirebaseOptions.currentPlatform,
        ),
      ),
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return MaterialApp(
            debugShowCheckedModeBanner: false,
            title: 'KidsTrack',
            theme: buildAppTheme(),
            locale: locale,
            supportedLocales: const [
              Locale('vi'),
              Locale('en'),
            ],
            localizationsDelegates: AppLocalizations.localizationsDelegates,
            home: Scaffold(
              body: Center(
                child: Text(AppLocalizations(locale).t('loading')),
              ),
            ),
          );
        }

        if (snapshot.hasError) {
          return MaterialApp(
            debugShowCheckedModeBanner: false,
            title: 'KidsTrack',
            theme: buildAppTheme(),
            locale: locale,
            supportedLocales: const [
              Locale('vi'),
              Locale('en'),
            ],
            localizationsDelegates: AppLocalizations.localizationsDelegates,
            home: Scaffold(
              body: Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Text(
                    'Firebase init failed:\n${snapshot.error}',
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
            ),
          );
        }

        return MaterialApp.router(
          debugShowCheckedModeBanner: false,
          title: 'KidsTrack',
          theme: buildAppTheme(),
          locale: locale,
          supportedLocales: const [
            Locale('vi'),
            Locale('en'),
          ],
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          routerConfig: router,
        );
      },
    );
  }
}
