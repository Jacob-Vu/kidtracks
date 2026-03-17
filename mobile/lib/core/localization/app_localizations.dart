import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

class AppLocalizations {
  AppLocalizations(this.locale);

  final Locale locale;

  static AppLocalizations of(BuildContext context) {
    final value = Localizations.of<AppLocalizations>(context, AppLocalizations);
    assert(value != null, 'No AppLocalizations found in context');
    return value!;
  }

  static const localizationsDelegates = [
    _AppLocalizationsDelegate(),
    GlobalWidgetsLocalizations.delegate,
    GlobalMaterialLocalizations.delegate,
    GlobalCupertinoLocalizations.delegate,
  ];

  static const _en = {
    'appName': 'KidsTrack',
    'loading': 'Loading your family...',
    'dashboard': 'Dashboard',
    'templates': 'Task Templates',
    'dailyTasks': 'Daily Tasks',
    'ledger': 'Pocket Ledger',
    'myDashboard': 'My Dashboard',
    'myProfile': 'My Profile',
    'signOut': 'Sign Out',
    'parent': 'Parent',
    'kid': 'Kid',
    'continueWithGoogle': 'Continue with Google',
    'signInWithEmail': 'Sign in with Email',
    'createFamily': 'Create Family',
    'familyName': 'Family Name',
    'email': 'Email',
    'password': 'Password',
    'username': 'Username',
    'displayName': 'Display Name',
    'save': 'Save',
    'cancel': 'Cancel',
    'close': 'Close',
    'today': 'Today',
    'noKids': 'No kids yet',
    'addKid': 'Add Kid',
    'addTask': 'Add Task',
    'setRewards': 'Set Rewards',
    'finalizeDay': 'Finalize Day',
    'finalized': 'Finalized',
    'loadTemplates': 'Load Templates',
    'noTasks': 'No tasks for this day',
    'manualTransaction': 'Manual Transaction',
    'amount': 'Amount',
    'label': 'Label',
    'allKids': 'All kids',
    'recentHistory': 'Recent History',
    'changePassword': 'Change Password',
    'linkEmail': 'Link Email',
    'language': 'Language',
    'english': 'English',
    'vietnamese': 'Vietnamese',
  };

  static const _vi = {
    'appName': 'KidsTrack',
    'loading': 'Dang tai du lieu gia dinh...',
    'dashboard': 'Tong quan',
    'templates': 'Mau cong viec',
    'dailyTasks': 'Viec hang ngay',
    'ledger': 'So tien tieu vat',
    'myDashboard': 'Trang cua con',
    'myProfile': 'Ho so cua con',
    'signOut': 'Dang xuat',
    'parent': 'Phu huynh',
    'kid': 'Con',
    'continueWithGoogle': 'Dang nhap bang Google',
    'signInWithEmail': 'Dang nhap bang Email',
    'createFamily': 'Tao gia dinh',
    'familyName': 'Ten gia dinh',
    'email': 'Email',
    'password': 'Mat khau',
    'username': 'Ten dang nhap',
    'displayName': 'Ten hien thi',
    'save': 'Luu',
    'cancel': 'Huy',
    'close': 'Dong',
    'today': 'Hom nay',
    'noKids': 'Chua co con nao',
    'addKid': 'Them con',
    'addTask': 'Them viec',
    'setRewards': 'Dat thuong',
    'finalizeDay': 'Chot ngay',
    'finalized': 'Da chot',
    'loadTemplates': 'Tai mau',
    'noTasks': 'Chua co viec cho ngay nay',
    'manualTransaction': 'Giao dich thu cong',
    'amount': 'So tien',
    'label': 'Ghi chu',
    'allKids': 'Tat ca cac con',
    'recentHistory': 'Lich su gan day',
    'changePassword': 'Doi mat khau',
    'linkEmail': 'Lien ket email',
    'language': 'Ngon ngu',
    'english': 'Tieng Anh',
    'vietnamese': 'Tieng Viet',
  };

  String t(String key) {
    final map = locale.languageCode == 'en' ? _en : _vi;
    return map[key] ?? key;
  }
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) => ['en', 'vi'].contains(locale.languageCode);

  @override
  Future<AppLocalizations> load(Locale locale) async {
    return AppLocalizations(locale);
  }

  @override
  bool shouldReload(covariant LocalizationsDelegate<AppLocalizations> old) {
    return false;
  }
}

extension AppLocalizationsX on BuildContext {
  AppLocalizations get l10n => AppLocalizations.of(this);
}
