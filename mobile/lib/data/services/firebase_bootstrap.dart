class FirebaseBootstrap {
  static bool _initialized = false;

  static Future<void> ensureInitialized(
    Future<void> Function() initializer,
  ) async {
    if (_initialized) return;
    await initializer();
    _initialized = true;
  }
}

