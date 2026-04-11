import 'package:cloud_firestore/cloud_firestore.dart';

enum TaskStatus { pending, inProgress, done }

class Task {
  final String? id;
  final String employeeId;
  final String title;
  final TaskStatus status;
  final DateTime dueDate;
  final String projectId;

  Task({
    this.id,
    required this.employeeId,
    required this.title,
    required this.status,
    required this.dueDate,
    required this.projectId,
  });

  // Convert from Firestore document
  factory Task.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return Task(
      id: doc.id,
      employeeId: data['employeeId'] ?? '',
      title: data['title'] ?? '',
      status: _statusFromString(data['status'] ?? 'pending'),
      dueDate: (data['dueDate'] as Timestamp?)?.toDate() ?? DateTime.now(),
      projectId: data['projectId'] ?? '',
    );
  }

  // Convert to Firestore document
  Map<String, dynamic> toFirestore() {
    return {
      'employeeId': employeeId,
      'title': title,
      'status': _statusToString(status),
      'dueDate': Timestamp.fromDate(dueDate),
      'projectId': projectId,
    };
  }

  // Helper to convert string to TaskStatus
  static TaskStatus _statusFromString(String status) {
    switch (status) {
      case 'inProgress':
      case 'in-progress': // legacy support
        return TaskStatus.inProgress;
      case 'done':
        return TaskStatus.done;
      case 'pending':
      default:
        return TaskStatus.pending;
    }
  }

  // Helper to convert TaskStatus to string
  static String _statusToString(TaskStatus status) {
    switch (status) {
      case TaskStatus.inProgress:
        return 'inProgress';
      case TaskStatus.done:
        return 'done';
      case TaskStatus.pending:
        return 'pending';
    }
  }

  // Check if task is overdue
  bool get isOverdue {
    return status != TaskStatus.done && dueDate.isBefore(DateTime.now());
  }

  // CopyWith method
  Task copyWith({
    String? id,
    String? employeeId,
    String? title,
    TaskStatus? status,
    DateTime? dueDate,
    String? projectId,
  }) {
    return Task(
      id: id ?? this.id,
      employeeId: employeeId ?? this.employeeId,
      title: title ?? this.title,
      status: status ?? this.status,
      dueDate: dueDate ?? this.dueDate,
      projectId: projectId ?? this.projectId,
    );
  }
}
