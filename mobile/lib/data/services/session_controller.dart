import 'dart:async';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/user_profile.dart';
import 'auth_service.dart';

final authServiceProvider = Provider<AuthService>((ref) {
  return AuthService(FirebaseAuth.instance, FirebaseFirestore.instance);
});

class SessionState {
  const SessionState({
    required this.user,
    required this.profile,
  });

  final User? user;
  final UserProfile? profile;

  bool get isParent => profile?.isParent == true;
  bool get isKid => profile?.isKid == true;
}

final sessionControllerProvider =
    AsyncNotifierProvider<SessionController, SessionState>(SessionController.new);

final sessionStateProvider = Provider<AsyncValue<SessionState>>((ref) {
  return ref.watch(sessionControllerProvider);
});

class SessionController extends AsyncNotifier<SessionState> {
  final _changes = StreamController<void>.broadcast();
  Stream<void> get changes => _changes.stream;

  StreamSubscription<User?>? _authSub;

  @override
  Future<SessionState> build() async {
    final service = ref.read(authServiceProvider);
    _authSub?.cancel();
    _authSub = service.authStateChanges().listen((_) => refresh());
    ref.onDispose(() {
      _authSub?.cancel();
      _changes.close();
    });
    return _load();
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(_load);
    _changes.add(null);
  }

  Future<SessionState> _load() async {
    final service = ref.read(authServiceProvider);
    final user = service.currentUser;
    if (user == null) {
      return const SessionState(user: null, profile: null);
    }
    final profile = await service.fetchProfile(user.uid);
    return SessionState(user: user, profile: profile);
  }
}
