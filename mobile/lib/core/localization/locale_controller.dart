import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

final localeControllerProvider =
    StateNotifierProvider<LocaleController, Locale>((ref) {
  return LocaleController()..load();
});

class LocaleController extends StateNotifier<Locale> {
  LocaleController() : super(const Locale('vi'));

  static const _prefsKey = 'kidstrack_locale';

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    final value = prefs.getString(_prefsKey);
    if (value == 'en' || value == 'vi') {
      state = Locale(value);
    }
  }

  Future<void> setLocale(Locale locale) async {
    state = locale;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_prefsKey, locale.languageCode);
  }

  Future<void> toggle() async {
    await setLocale(state.languageCode == 'vi'
        ? const Locale('en')
        : const Locale('vi'));
  }
}

