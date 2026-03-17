class LedgerEntry {
  const LedgerEntry({
    required this.id,
    required this.kidId,
    required this.date,
    required this.type,
    required this.amount,
    required this.label,
  });

  final String id;
  final String kidId;
  final String date;
  final String type;
  final int amount;
  final String label;

  factory LedgerEntry.fromMap(Map<String, dynamic> map) {
    return LedgerEntry(
      id: map['id'] as String? ?? '',
      kidId: map['kidId'] as String? ?? '',
      date: map['date'] as String? ?? '',
      type: map['type'] as String? ?? '',
      amount: (map['amount'] as num?)?.toInt() ?? 0,
      label: map['label'] as String? ?? '',
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'kidId': kidId,
      'date': date,
      'type': type,
      'amount': amount,
      'label': label,
    };
  }
}

