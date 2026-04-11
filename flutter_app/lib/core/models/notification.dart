import 'package:cloud_firestore/cloud_firestore.dart';

class AppNotification {
  final String? id;
  final String targetUid;
  final String type; // 'task_assigned', 'payslip_generated', 'task_status_changed', 'task_overdue'
  final String title;
  final String body;
  final bool read;
  final DateTime createdAt;

  AppNotification({
    this.id,
    required this.targetUid,
    required this.type,
    required this.title,
    required this.body,
    this.read = false,
    required this.createdAt,
  });

  factory AppNotification.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return AppNotification(
      id: doc.id,
      targetUid: data['targetUid'] ?? '',
      type: data['type'] ?? '',
      title: data['title'] ?? '',
      body: data['body'] ?? '',
      read: data['read'] ?? false,
      createdAt: (data['createdAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'targetUid': targetUid,
      'type': type,
      'title': title,
      'body': body,
      'read': read,
      'createdAt': Timestamp.fromDate(createdAt),
    };
  }

  AppNotification copyWith({
    String? id,
    String? targetUid,
    String? type,
    String? title,
    String? body,
    bool? read,
    DateTime? createdAt,
  }) {
    return AppNotification(
      id: id ?? this.id,
      targetUid: targetUid ?? this.targetUid,
      type: type ?? this.type,
      title: title ?? this.title,
      body: body ?? this.body,
      read: read ?? this.read,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
