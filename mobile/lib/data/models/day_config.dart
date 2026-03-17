class DayConfig {
  const DayConfig({
    required this.id,
    required this.kidId,
    required this.date,
    required this.rewardAmount,
    required this.penaltyAmount,
    required this.isFinalized,
  });

  final String id;
  final String kidId;
  final String date;
  final int rewardAmount;
  final int penaltyAmount;
  final bool isFinalized;

  factory DayConfig.fromMap(Map<String, dynamic> map) {
    return DayConfig(
      id: map['id'] as String? ?? '',
      kidId: map['kidId'] as String? ?? '',
      date: map['date'] as String? ?? '',
      rewardAmount: (map['rewardAmount'] as num?)?.toInt() ?? 0,
      penaltyAmount: (map['penaltyAmount'] as num?)?.toInt() ?? 0,
      isFinalized: map['isFinalized'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'kidId': kidId,
      'date': date,
      'rewardAmount': rewardAmount,
      'penaltyAmount': penaltyAmount,
      'isFinalized': isFinalized,
    };
  }

  DayConfig copyWith({
    String? id,
    String? kidId,
    String? date,
    int? rewardAmount,
    int? penaltyAmount,
    bool? isFinalized,
  }) {
    return DayConfig(
      id: id ?? this.id,
      kidId: kidId ?? this.kidId,
      date: date ?? this.date,
      rewardAmount: rewardAmount ?? this.rewardAmount,
      penaltyAmount: penaltyAmount ?? this.penaltyAmount,
      isFinalized: isFinalized ?? this.isFinalized,
    );
  }
}

