import 'package:cloud_firestore/cloud_firestore.dart';

enum ProjectStatus { pending, active, completed }

class Project {
  final String? id;
  final String title;
  final String description;
  final ProjectStatus status;
  final double kpiPercent;
  final List<String> assignedEmployeeIds;
  final DateTime deadline;
  final String createdBy;

  Project({
    this.id,
    required this.title,
    this.description = '',
    required this.status,
    required this.kpiPercent,
    required this.assignedEmployeeIds,
    required this.deadline,
    required this.createdBy,
  });

  // Convert from Firestore document
  factory Project.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return Project(
      id: doc.id,
      title: data['title'] ?? '',
      description: data['description'] ?? '',
      status: _statusFromString(data['status'] ?? 'pending'),
      kpiPercent: (data['kpiPercent'] ?? 0).toDouble(),
      assignedEmployeeIds: List<String>.from(data['assignedEmployeeIds'] ?? []),
      deadline: (data['deadline'] as Timestamp?)?.toDate() ?? DateTime.now(),
      createdBy: data['createdBy'] ?? '',
    );
  }

  // Convert to Firestore document
  Map<String, dynamic> toFirestore() {
    return {
      'title': title,
      'description': description,
      'status': _statusToString(status),
      'kpiPercent': kpiPercent,
      'assignedEmployeeIds': assignedEmployeeIds,
      'deadline': Timestamp.fromDate(deadline),
      'createdBy': createdBy,
    };
  }

  // Helper to convert string to ProjectStatus
  static ProjectStatus _statusFromString(String status) {
    switch (status) {
      case 'active':
        return ProjectStatus.active;
      case 'completed':
        return ProjectStatus.completed;
      case 'pending':
      default:
        return ProjectStatus.pending;
    }
  }

  // Helper to convert ProjectStatus to string
  static String _statusToString(ProjectStatus status) {
    switch (status) {
      case ProjectStatus.active:
        return 'active';
      case ProjectStatus.completed:
        return 'completed';
      case ProjectStatus.pending:
        return 'pending';
    }
  }

  // CopyWith method
  Project copyWith({
    String? id,
    String? title,
    String? description,
    ProjectStatus? status,
    double? kpiPercent,
    List<String>? assignedEmployeeIds,
    DateTime? deadline,
    String? createdBy,
  }) {
    return Project(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      status: status ?? this.status,
      kpiPercent: kpiPercent ?? this.kpiPercent,
      assignedEmployeeIds: assignedEmployeeIds ?? this.assignedEmployeeIds,
      deadline: deadline ?? this.deadline,
      createdBy: createdBy ?? this.createdBy,
    );
  }
}
