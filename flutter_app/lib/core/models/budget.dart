import 'package:cloud_firestore/cloud_firestore.dart';

class Budget {
  final String? id;
  final String userId;
  final String category;
  final double limit;
  final double spent;
  final String month;

  Budget({
    this.id,
    required this.userId,
    required this.category,
    required this.limit,
    required this.spent,
    required this.month,
  });

  // Convert from Firestore document
  factory Budget.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return Budget(
      id: doc.id,
      userId: data['userId'] ?? '',
      category: data['category'] ?? '',
      limit: (data['limit'] ?? 0).toDouble(),
      spent: (data['spent'] ?? 0).toDouble(),
      month: data['month'] ?? '',
    );
  }

  // Convert to Firestore document
  Map<String, dynamic> toFirestore() {
    return {
      'userId': userId,
      'category': category,
      'limit': limit,
      'spent': spent,
      'month': month,
    };
  }

  // Calculate percentage used
  double get percentageUsed {
    if (limit == 0) return 0;
    return (spent / limit) * 100;
  }

  // Get status color based on percentage
  BudgetStatus get status {
    final percentage = percentageUsed;
    if (percentage < 70) return BudgetStatus.safe;
    if (percentage < 90) return BudgetStatus.warning;
    return BudgetStatus.danger;
  }

  // CopyWith method
  Budget copyWith({
    String? id,
    String? userId,
    String? category,
    double? limit,
    double? spent,
    String? month,
  }) {
    return Budget(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      category: category ?? this.category,
      limit: limit ?? this.limit,
      spent: spent ?? this.spent,
      month: month ?? this.month,
    );
  }
}

enum BudgetStatus {
  safe, // < 70%
  warning, // 70-90%
  danger, // > 90%
}
