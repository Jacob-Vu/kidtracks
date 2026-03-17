class UserProfile {
  const UserProfile({
    required this.role,
    required this.familyId,
    this.kidId,
    this.username,
    this.displayName,
    this.email,
    this.linkedEmail,
  });

  final String role;
  final String familyId;
  final String? kidId;
  final String? username;
  final String? displayName;
  final String? email;
  final String? linkedEmail;

  bool get isParent => role == 'parent';
  bool get isKid => role == 'kid';

  factory UserProfile.fromMap(Map<String, dynamic> map) {
    return UserProfile(
      role: map['role'] as String? ?? 'parent',
      familyId: map['familyId'] as String? ?? '',
      kidId: map['kidId'] as String?,
      username: map['username'] as String?,
      displayName: map['displayName'] as String?,
      email: map['email'] as String?,
      linkedEmail: map['linkedEmail'] as String?,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'role': role,
      'familyId': familyId,
      'kidId': kidId,
      'username': username,
      'displayName': displayName,
      'email': email,
      'linkedEmail': linkedEmail,
    }..removeWhere((key, value) => value == null);
  }
}

