import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:kidstrack_mobile/app/theme.dart';
import 'package:kidstrack_mobile/core/localization/app_localizations.dart';
import 'package:kidstrack_mobile/core/localization/locale_controller.dart';
import 'package:kidstrack_mobile/data/models/family_collections.dart';
import 'package:kidstrack_mobile/data/services/actions_repository.dart';
import 'package:kidstrack_mobile/data/services/family_providers.dart';
import 'package:kidstrack_mobile/data/services/session_controller.dart';

Widget buildTestApp({
  required Widget child,
  AsyncValue<SessionState>? session,
  AsyncValue<FamilyCollections>? family,
  LocaleController? localeController,
  ActionsRepository? actionsRepository,
}) {
  return ProviderScope(
    overrides: [
      if (session != null) sessionStateProvider.overrideWithValue(session),
      if (family != null)
        familyCollectionsStateProvider.overrideWithValue(family),
      if (localeController != null)
        localeControllerProvider.overrideWith(() => localeController),
      if (actionsRepository != null)
        actionsRepositoryProvider.overrideWithValue(actionsRepository),
    ],
    child: Consumer(
      builder: (context, ref, _) {
        final locale = ref.watch(localeControllerProvider);
        return MaterialApp(
          theme: buildAppTheme(),
          locale: locale,
          supportedLocales: const [Locale('vi'), Locale('en')],
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          home: child,
        );
      },
    ),
  );
}
