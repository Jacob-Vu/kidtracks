class DailyTask {
  const DailyTask({
    required this.id,
    required this.kidId,
    required this.date,
    required this.title,
    required this.description,
    required this.status,
  });

  final String id;
  final String kidId;
  final String date;
  final String title;
  final String description;
  final String status;

  bool get isCompleted => status == 'completed';
  bool get isFailed => status == 'failed';
  bool get isPending => status == 'pending';

  factory DailyTask.fromMap(Map<String, dynamic> map) {
    return DailyTask(
      id: map['id'] as String? ?? '',
      kidId: map['kidId'] as String? ?? '',
      date: map['date'] as String? ?? '',
      title: map['title'] as String? ?? '',
      description: map['description'] as String? ?? '',
      status: map['status'] as String? ?? 'pending',
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'kidId': kidId,
      'date': date,
      'title': title,
      'description': description,
      'status': status,
    };
  }

  DailyTask copyWith({
    String? id,
    String? kidId,
    String? date,
    String? title,
    String? description,
    String? status,
  }) {
    return DailyTask(
      id: id ?? this.id,
      kidId: kidId ?? this.kidId,
      date: date ?? this.date,
      title: title ?? this.title,
      description: description ?? this.description,
      status: status ?? this.status,
    );
  }
}

