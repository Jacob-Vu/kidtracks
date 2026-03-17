class TaskTemplate {
  const TaskTemplate({
    required this.id,
    required this.title,
    required this.description,
    required this.assignedKidIds,
    this.importedFrom,
  });

  final String id;
  final String title;
  final String description;
  final List<String> assignedKidIds;
  final String? importedFrom;

  factory TaskTemplate.fromMap(Map<String, dynamic> map) {
    return TaskTemplate(
      id: map['id'] as String? ?? '',
      title: map['title'] as String? ?? '',
      description: map['description'] as String? ?? '',
      assignedKidIds: List<String>.from(map['assignedKidIds'] as List? ?? const []),
      importedFrom: map['importedFrom'] as String?,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'assignedKidIds': assignedKidIds,
      'importedFrom': importedFrom,
    }..removeWhere((key, value) => value == null);
  }
}

