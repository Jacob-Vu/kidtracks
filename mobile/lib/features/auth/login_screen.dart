import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/localization/app_localizations.dart';
import '../../core/localization/locale_controller.dart';
import '../../data/services/session_controller.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabs = TabController(length: 2, vsync: this);
  late final ProviderSubscription<AsyncValue<SessionState>> _sessionSubscription;

  final _familyNameController = TextEditingController();
  final _parentEmailController = TextEditingController();
  final _parentPasswordController = TextEditingController();
  final _kidParentEmailController = TextEditingController();
  final _kidUsernameController = TextEditingController();
  final _kidPasswordController = TextEditingController();

  String _parentMode = 'choose';
  String? _error;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _sessionSubscription = ref.listenManual<AsyncValue<SessionState>>(
      sessionStateProvider,
      (previous, next) {
        final session = next.valueOrNull;
        if (!mounted) return;
        if (session?.isKid == true) context.go('/kid/dashboard');
        if (session?.isParent == true) context.go('/parent/dashboard');
      },
    );
  }

  @override
  void dispose() {
    _sessionSubscription.close();
    _tabs.dispose();
    _familyNameController.dispose();
    _parentEmailController.dispose();
    _parentPasswordController.dispose();
    _kidParentEmailController.dispose();
    _kidUsernameController.dispose();
    _kidPasswordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final locale = ref.watch(localeControllerProvider);

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 480),
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Align(
                        alignment: Alignment.topRight,
                        child: FilledButton.tonalIcon(
                          onPressed: () => ref
                              .read(localeControllerProvider.notifier)
                              .toggle(),
                          icon: const Icon(Icons.language),
                          label: Text(
                            locale.languageCode == 'vi'
                                ? l10n.t('english')
                                : l10n.t('vietnamese'),
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      const Icon(Icons.star_rounded, size: 64, color: Color(0xFF0F766E)),
                      const SizedBox(height: 12),
                      Text(
                        l10n.t('appName'),
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.headlineMedium,
                      ),
                      const SizedBox(height: 24),
                      TabBar(
                        controller: _tabs,
                        tabs: [
                          Tab(text: l10n.t('parent')),
                          Tab(text: l10n.t('kid')),
                        ],
                      ),
                      const SizedBox(height: 16),
                      if (_error != null)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: Text(
                            _error!,
                            style: const TextStyle(color: Colors.red),
                          ),
                        ),
                      SizedBox(
                        height: 420,
                        child: TabBarView(
                          controller: _tabs,
                          children: [
                            _buildParentTab(context),
                            _buildKidTab(context),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildParentTab(BuildContext context) {
    final l10n = context.l10n;
    if (_parentMode == 'setup') {
      return Column(
        children: [
          TextField(
            controller: _familyNameController,
            decoration: InputDecoration(labelText: l10n.t('familyName')),
          ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: _busy ? null : _createFamily,
            child: Text(l10n.t('createFamily')),
          ),
        ],
      );
    }

    if (_parentMode == 'choose') {
      return Column(
        children: [
          FilledButton.icon(
            onPressed: _busy ? null : _signInGoogle,
            icon: const Icon(Icons.g_mobiledata),
            label: Text(l10n.t('continueWithGoogle')),
          ),
          const SizedBox(height: 12),
          OutlinedButton(
            onPressed: () => setState(() => _parentMode = 'email-login'),
            child: Text(l10n.t('signInWithEmail')),
          ),
        ],
      );
    }

    final signUp = _parentMode == 'email-signup';
    return Column(
      children: [
        TextField(
          controller: _parentEmailController,
          decoration: InputDecoration(labelText: l10n.t('email')),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _parentPasswordController,
          obscureText: true,
          decoration: InputDecoration(labelText: l10n.t('password')),
        ),
        const SizedBox(height: 16),
        FilledButton(
          onPressed: _busy ? null : (signUp ? _signUpEmail : _signInEmail),
          child: Text(signUp ? l10n.t('createFamily') : l10n.t('signInWithEmail')),
        ),
        TextButton(
          onPressed: () => setState(
            () => _parentMode = signUp ? 'email-login' : 'email-signup',
          ),
          child: Text(signUp ? 'Sign in instead' : 'Create account instead'),
        ),
        TextButton(
          onPressed: () => setState(() => _parentMode = 'choose'),
          child: const Text('Back'),
        ),
      ],
    );
  }

  Widget _buildKidTab(BuildContext context) {
    final l10n = context.l10n;
    return Column(
      children: [
        TextField(
          controller: _kidParentEmailController,
          decoration: InputDecoration(labelText: l10n.t('email')),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _kidUsernameController,
          decoration: InputDecoration(labelText: l10n.t('username')),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _kidPasswordController,
          obscureText: true,
          decoration: InputDecoration(labelText: l10n.t('password')),
        ),
        const SizedBox(height: 16),
        FilledButton(
          onPressed: _busy ? null : _signInKid,
          child: Text(l10n.t('kid')),
        ),
      ],
    );
  }

  Future<void> _withBusy(Future<void> Function() action) async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await action();
      await ref.read(sessionControllerProvider.notifier).refresh();
    } catch (error) {
      setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _signInGoogle() {
    return _withBusy(() async {
      final result = await ref.read(authServiceProvider).signInWithGoogle();
      if (result.isNew) {
        setState(() => _parentMode = 'setup');
      }
    });
  }

  Future<void> _signInEmail() {
    return _withBusy(() async {
      final result = await ref.read(authServiceProvider).signInParentEmail(
            _parentEmailController.text.trim(),
            _parentPasswordController.text,
          );
      if (result.isNew) {
        setState(() => _parentMode = 'setup');
      }
    });
  }

  Future<void> _signUpEmail() {
    return _withBusy(() async {
      await ref.read(authServiceProvider).signUpParentEmail(
            _parentEmailController.text.trim(),
            _parentPasswordController.text,
          );
      setState(() => _parentMode = 'setup');
    });
  }

  Future<void> _createFamily() {
    return _withBusy(() async {
      final user = ref.read(authServiceProvider).currentUser;
      if (user == null) throw Exception('No authenticated parent');
      await ref
          .read(authServiceProvider)
          .createFamily(user, _familyNameController.text.trim());
    });
  }

  Future<void> _signInKid() {
    return _withBusy(() async {
      final lookup = await ref.read(authServiceProvider).lookupFamilyByParentEmail(
            _kidParentEmailController.text.trim(),
          );
      final familyId = lookup['familyId'] as String;
      await ref.read(authServiceProvider).signInKid(
            _kidUsernameController.text.trim().toLowerCase(),
            _kidPasswordController.text,
            familyId,
          );
    });
  }
}
