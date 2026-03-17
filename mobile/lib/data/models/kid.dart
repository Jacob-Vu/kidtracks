class Kid {
  const Kid({
    required this.id,
    required this.name,
    required this.displayName,
    required this.avatar,
    required this.balance,
    this.username,
  });

  final String id;
  final String name;
  final String displayName;
  final String avatar;
  final int balance;
  final String? username;

  String get label => displayName.isNotEmpty ? displayName : name;

  factory Kid.fromMap(Map<String, dynamic> map) {
    return Kid(
      id: map['id'] as String? ?? '',
      name: map['name'] as String? ?? '',
      displayName: map['displayName'] as String? ?? map['name'] as String? ?? '',
      avatar: map['avatar'] as String? ?? '🧒',
      balance: (map['balance'] as num?)?.toInt() ?? 0,
      username: map['username'] as String?,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'displayName': displayName,
      'avatar': avatar,
      'balance': balance,
      'username': username,
    }..removeWhere((key, value) => value == null);
  }

  Kid copyWith({
    String? id,
    String? name,
    String? displayName,
    String? avatar,
    int? balance,
    String? username,
  }) {
    return Kid(
      id: id ?? this.id,
      name: name ?? this.name,
      displayName: displayName ?? this.displayName,
      avatar: avatar ?? this.avatar,
      balance: balance ?? this.balance,
      username: username ?? this.username,
    );
  }
}

