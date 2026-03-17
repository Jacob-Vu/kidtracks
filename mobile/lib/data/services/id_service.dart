import 'dart:math';

class IdService {
  static final Random _random = Random();

  static String generate() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    final buffer = StringBuffer();
    for (var i = 0; i < 9; i++) {
      buffer.write(chars[_random.nextInt(chars.length)]);
    }
    buffer.write(DateTime.now().millisecondsSinceEpoch.toRadixString(36));
    return buffer.toString();
  }
}

