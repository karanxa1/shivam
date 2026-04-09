import 'package:cloud_firestore/cloud_firestore.dart';

class Employee {
  final String? id;
  final String uid;
  final String name;
  final String email;
  final String department;
  final double salary;
  final int overtimeHours;

  Employee({
    this.id,
    required this.uid,
    required this.name,
    required this.email,
    required this.department,
    required this.salary,
    this.overtimeHours = 0,
  });

  // Convert from Firestore document
  factory Employee.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return Employee(
      id: doc.id,
      uid: data['uid'] ?? '',
      name: data['name'] ?? '',
      email: data['email'] ?? '',
      department: data['department'] ?? '',
      salary: (data['salary'] ?? 0).toDouble(),
      overtimeHours: data['overtimeHours'] ?? 0,
    );
  }

  // Convert to Firestore document
  Map<String, dynamic> toFirestore() {
    return {
      'uid': uid,
      'name': name,
      'email': email,
      'department': department,
      'salary': salary,
      'overtimeHours': overtimeHours,
    };
  }

  // CopyWith method
  Employee copyWith({
    String? id,
    String? uid,
    String? name,
    String? email,
    String? department,
    double? salary,
    int? overtimeHours,
  }) {
    return Employee(
      id: id ?? this.id,
      uid: uid ?? this.uid,
      name: name ?? this.name,
      email: email ?? this.email,
      department: department ?? this.department,
      salary: salary ?? this.salary,
      overtimeHours: overtimeHours ?? this.overtimeHours,
    );
  }
}

// Common departments
class Departments {
  static const List<String> all = [
    'Engineering',
    'Marketing',
    'Sales',
    'HR',
    'Finance',
    'Operations',
    'Support',
    'Other',
  ];
}
