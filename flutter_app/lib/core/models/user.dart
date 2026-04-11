import 'package:cloud_firestore/cloud_firestore.dart';

enum UserRole { admin, hr, employee, regular }

class AppUser {
  final String uid;
  final String name;
  final String email;
  final UserRole role;
  final DateTime createdAt;
  final String avatarUrl;

  AppUser({
    required this.uid,
    required this.name,
    required this.email,
    required this.role,
    required this.createdAt,
    this.avatarUrl = '',
  });

  // Convert from Firestore document
  factory AppUser.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return AppUser(
      uid: doc.id,
      name: data['name'] ?? '',
      email: data['email'] ?? '',
      role: _roleFromString(data['role'] ?? 'regular'),
      createdAt: (data['createdAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
      avatarUrl: data['avatarUrl'] ?? '',
    );
  }

  // Convert to Firestore document
  Map<String, dynamic> toFirestore() {
    return {
      'name': name,
      'email': email,
      'role': _roleToString(role),
      'createdAt': Timestamp.fromDate(createdAt),
      'avatarUrl': avatarUrl,
    };
  }

  // Helper to convert string to UserRole enum
  static UserRole _roleFromString(String role) {
    switch (role) {
      case 'admin':
        return UserRole.admin;
      case 'authority': // backward compat
        return UserRole.admin;
      case 'hr':
        return UserRole.hr;
      case 'employee':
        return UserRole.employee;
      case 'regular':
      default:
        return UserRole.regular;
    }
  }

  // Helper to convert UserRole enum to string
  static String _roleToString(UserRole role) {
    switch (role) {
      case UserRole.admin:
        return 'admin';
      case UserRole.hr:
        return 'hr';
      case UserRole.employee:
        return 'employee';
      case UserRole.regular:
        return 'regular';
    }
  }

  // CopyWith method for updating
  AppUser copyWith({
    String? uid,
    String? name,
    String? email,
    UserRole? role,
    DateTime? createdAt,
    String? avatarUrl,
  }) {
    return AppUser(
      uid: uid ?? this.uid,
      name: name ?? this.name,
      email: email ?? this.email,
      role: role ?? this.role,
      createdAt: createdAt ?? this.createdAt,
      avatarUrl: avatarUrl ?? this.avatarUrl,
    );
  }
}
