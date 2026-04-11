import 'package:cloud_firestore/cloud_firestore.dart';

enum TransactionType { income, expense }

class Transaction {
  final String? id;
  final String userId;
  final String title;
  final double amount;
  final TransactionType type;
  final String category;
  final DateTime date;
  final String note;
  final bool isRecurring;
  final String? recurrenceType; // 'daily', 'weekly', 'monthly', null

  Transaction({
    this.id,
    required this.userId,
    required this.title,
    required this.amount,
    required this.type,
    required this.category,
    required this.date,
    this.note = '',
    this.isRecurring = false,
    this.recurrenceType,
  });

  // Convert from Firestore document
  factory Transaction.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return Transaction(
      id: doc.id,
      userId: data['userId'] ?? '',
      title: data['title'] ?? '',
      amount: (data['amount'] ?? 0).toDouble(),
      type: data['type'] == 'income'
          ? TransactionType.income
          : TransactionType.expense,
      category: data['category'] ?? '',
      date: (data['date'] as Timestamp?)?.toDate() ?? DateTime.now(),
      note: data['note'] ?? '',
      isRecurring: data['isRecurring'] ?? false,
      recurrenceType: data['recurrenceType'],
    );
  }

  // Convert to Firestore document
  Map<String, dynamic> toFirestore() {
    final map = <String, dynamic>{
      'userId': userId,
      'title': title,
      'amount': amount,
      'type': type == TransactionType.income ? 'income' : 'expense',
      'category': category,
      'date': Timestamp.fromDate(date),
      'note': note,
      'isRecurring': isRecurring,
      'recurrenceType': recurrenceType,
    };
    return map;
  }

  // CopyWith method
  Transaction copyWith({
    String? id,
    String? userId,
    String? title,
    double? amount,
    TransactionType? type,
    String? category,
    DateTime? date,
    String? note,
    bool? isRecurring,
    String? recurrenceType,
  }) {
    return Transaction(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      title: title ?? this.title,
      amount: amount ?? this.amount,
      type: type ?? this.type,
      category: category ?? this.category,
      date: date ?? this.date,
      note: note ?? this.note,
      isRecurring: isRecurring ?? this.isRecurring,
      recurrenceType: recurrenceType ?? this.recurrenceType,
    );
  }
}

// Available categories
class TransactionCategories {
  static const List<String> all = [
    'Food',
    'Salary',
    'Travel',
    'Bills',
    'Other',
  ];
}
