import 'package:cloud_firestore/cloud_firestore.dart';

class Payslip {
  final String? id;
  final String employeeId;
  final String month;
  final double basicSalary;
  final double overtimePay;
  final double deductions;
  final double netPay;
  final DateTime generatedAt;

  Payslip({
    this.id,
    required this.employeeId,
    required this.month,
    required this.basicSalary,
    required this.overtimePay,
    required this.deductions,
    required this.netPay,
    required this.generatedAt,
  });

  // Convert from Firestore document
  factory Payslip.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return Payslip(
      id: doc.id,
      employeeId: data['employeeId'] ?? '',
      month: data['month'] ?? '',
      basicSalary: (data['basicSalary'] ?? 0).toDouble(),
      overtimePay: (data['overtimePay'] ?? 0).toDouble(),
      deductions: (data['deductions'] ?? 0).toDouble(),
      netPay: (data['netPay'] ?? 0).toDouble(),
      generatedAt:
          (data['generatedAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
    );
  }

  // Convert to Firestore document
  Map<String, dynamic> toFirestore() {
    return {
      'employeeId': employeeId,
      'month': month,
      'basicSalary': basicSalary,
      'overtimePay': overtimePay,
      'deductions': deductions,
      'netPay': netPay,
      'generatedAt': Timestamp.fromDate(generatedAt),
    };
  }

  // Calculate total earnings
  double get totalEarnings => basicSalary + overtimePay;

  // Static method to calculate net pay
  static double calculateNetPay(
    double basicSalary,
    int overtimeHours,
    double deductions,
  ) {
    final overtimePay = overtimeHours * 150.0;
    return basicSalary + overtimePay - deductions;
  }

  // Static method to create payslip from employee data
  static Payslip generate({
    required String employeeId,
    required String month,
    required double basicSalary,
    required int overtimeHours,
    required double deductions,
  }) {
    final overtimePay = overtimeHours * 150.0;
    final netPay = basicSalary + overtimePay - deductions;

    return Payslip(
      employeeId: employeeId,
      month: month,
      basicSalary: basicSalary,
      overtimePay: overtimePay,
      deductions: deductions,
      netPay: netPay,
      generatedAt: DateTime.now(),
    );
  }

  // CopyWith method
  Payslip copyWith({
    String? id,
    String? employeeId,
    String? month,
    double? basicSalary,
    double? overtimePay,
    double? deductions,
    double? netPay,
    DateTime? generatedAt,
  }) {
    return Payslip(
      id: id ?? this.id,
      employeeId: employeeId ?? this.employeeId,
      month: month ?? this.month,
      basicSalary: basicSalary ?? this.basicSalary,
      overtimePay: overtimePay ?? this.overtimePay,
      deductions: deductions ?? this.deductions,
      netPay: netPay ?? this.netPay,
      generatedAt: generatedAt ?? this.generatedAt,
    );
  }
}
