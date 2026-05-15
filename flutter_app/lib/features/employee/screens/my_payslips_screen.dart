import 'dart:io';

import 'package:csv/csv.dart';
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';

import '../../../core/firebase/firestore_service.dart';
import '../../../core/models/payslip.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/services/pdf_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';

class MyPayslipsScreen extends StatefulWidget {
  const MyPayslipsScreen({super.key});

  @override
  State<MyPayslipsScreen> createState() => _MyPayslipsScreenState();
}

class _MyPayslipsScreenState extends State<MyPayslipsScreen> {
  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final firestoreService = context.read<FirestoreService>();
    final user = authProvider.appUser;

    if (user == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Payslips'),
        actions: [
          IconButton(
            icon: const Icon(Icons.picture_as_pdf_outlined),
            tooltip: 'Export PDF',
            onPressed: () => _exportPayslipsPdf(context, user.uid),
          ),
          IconButton(
            icon: const Icon(Icons.download_outlined),
            tooltip: 'Export CSV',
            onPressed: () => _exportPayslipsCsv(context, user.uid),
          ),
        ],
      ),
      body: StreamBuilder<List<Payslip>>(
        stream: firestoreService.payslipsStreamByUserUid(user.uid),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          }

          final payslips = snapshot.data ?? [];

          if (payslips.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.receipt_long_outlined,
                      size: 64,
                      color: AppTheme.darkTextTertiary,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'No payslips yet',
                      style: TextStyle(
                        color: AppTheme.darkTextSecondary,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Your payslips will appear here once generated',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: AppTheme.darkTextTertiary,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }

          // Calculate total earnings
          final totalEarnings = payslips.fold<double>(
            0,
            (sum, p) => sum + p.netPay,
          );

          return Column(
            children: [
              // Summary card
              Container(
                margin: const EdgeInsets.all(16),
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      AppTheme.primaryYellow.withValues(alpha: 0.2),
                      AppTheme.darkYellow.withValues(alpha: 0.1),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: AppTheme.primaryYellow.withValues(alpha: 0.3),
                  ),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _SummaryItem(
                          label: 'Total Payslips',
                          value: '${payslips.length}',
                          icon: Icons.receipt_long,
                        ),
                        Container(
                          width: 1,
                          height: 50,
                          color: AppTheme.darkDivider,
                        ),
                        _SummaryItem(
                          label: 'Total Earnings',
                          value: Formatters.currencyCompact(totalEarnings),
                          icon: Icons.currency_rupee,
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              // Payslips list
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
                  itemCount: payslips.length,
                  itemBuilder: (context, index) {
                    final payslip = payslips[index];
                    return _PayslipCard(
                      payslip: payslip,
                      onTap: () => _showPayslipDetails(payslip),
                    );
                  },
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Future<void> _exportPayslipsPdf(BuildContext context, String uid) async {
    final messenger = ScaffoldMessenger.of(context);
    try {
      final firestoreService = context.read<FirestoreService>();
      final employeeId = await firestoreService.getEmployeeDocIdByUid(uid);
      if (employeeId == null) {
        messenger.showSnackBar(
          const SnackBar(
            content: Text('Employee record not found'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
        return;
      }

      final payslips = await firestoreService.getAllPayslipsForEmployee(employeeId);
      if (payslips.isEmpty) {
        messenger.showSnackBar(
          const SnackBar(content: Text('No payslips to export')),
        );
        return;
      }

      final user = context.read<AuthProvider>().appUser;
      await PdfService().generatePayslipHistoryReport(user?.name ?? 'Employee', payslips);

      if (context.mounted) {
        messenger.showSnackBar(
          const SnackBar(
            content: Text('Payslip report downloaded'),
            backgroundColor: AppTheme.successColor,
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        messenger.showSnackBar(
          SnackBar(
            content: Text('Export failed: $e'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    }
  }

  Future<void> _exportPayslipsCsv(BuildContext context, String uid) async {
    final messenger = ScaffoldMessenger.of(context);
    try {
      final firestoreService = context.read<FirestoreService>();
      final employeeId = await firestoreService.getEmployeeDocIdByUid(uid);
      if (employeeId == null) {
        messenger.showSnackBar(
          const SnackBar(
            content: Text('Employee record not found'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
        return;
      }

      final payslips = await firestoreService
          .getAllPayslipsForEmployee(employeeId);

      if (payslips.isEmpty) {
        messenger.showSnackBar(
          const SnackBar(content: Text('No payslips to export')),
        );
        return;
      }

      final rows = <List<dynamic>>[
        [
          'Month',
          'Basic Salary',
          'Overtime Pay',
          'Total Earnings',
          'Deductions',
          'Net Pay',
        ],
        ...payslips.map(
          (p) => [
            p.month,
            p.basicSalary.toStringAsFixed(2),
            p.overtimePay.toStringAsFixed(2),
            p.totalEarnings.toStringAsFixed(2),
            p.deductions.toStringAsFixed(2),
            p.netPay.toStringAsFixed(2),
          ],
        ),
      ];

      final csv = const ListToCsvConverter().convert(rows);
      final dir = await getTemporaryDirectory();
      final file = File(
        '${dir.path}/payslips_${DateTime.now().millisecondsSinceEpoch}.csv',
      );
      await file.writeAsString(csv);

      await Share.shareXFiles(
        [XFile(file.path)],
        subject: 'My Payslips Export',
      );

      if (context.mounted) {
        messenger.showSnackBar(
          const SnackBar(
            content: Text('Payslips exported successfully'),
            backgroundColor: AppTheme.successColor,
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        messenger.showSnackBar(
          SnackBar(
            content: Text('Export failed: $e'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    }
  }

  void _showPayslipDetails(Payslip payslip) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: AppTheme.primaryYellow.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.receipt_long,
                    color: AppTheme.primaryYellow,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Payslip',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        _formatMonthDisplay(payslip.month),
                        style: TextStyle(
                          color: AppTheme.darkTextSecondary,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            const Divider(),
            const SizedBox(height: 16),

            // Earnings section
            Text(
              'EARNINGS',
              style: TextStyle(
                color: AppTheme.darkTextSecondary,
                fontSize: 12,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.5,
              ),
            ),
            const SizedBox(height: 12),
            _DetailRow(
              label: 'Basic Salary',
              value: Formatters.currency(payslip.basicSalary),
            ),
            _DetailRow(
              label: 'Overtime Pay',
              value: Formatters.currency(payslip.overtimePay),
              valueColor: payslip.overtimePay > 0
                  ? AppTheme.successColor
                  : null,
            ),
            const Divider(height: 24),
            _DetailRow(
              label: 'Gross Earnings',
              value: Formatters.currency(payslip.totalEarnings),
              isBold: true,
            ),

            const SizedBox(height: 24),

            // Deductions section
            Text(
              'DEDUCTIONS',
              style: TextStyle(
                color: AppTheme.darkTextSecondary,
                fontSize: 12,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.5,
              ),
            ),
            const SizedBox(height: 12),
            _DetailRow(
              label: 'Total Deductions',
              value: '- ${Formatters.currency(payslip.deductions)}',
              valueColor: AppTheme.errorColor,
            ),

            const Divider(height: 32),

            // Net pay
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.successColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: AppTheme.successColor.withValues(alpha: 0.3),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Net Pay',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  Text(
                    Formatters.currency(payslip.netPay),
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.successColor,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),
            Text(
              'Generated on ${Formatters.dateTime(payslip.generatedAt)}',
              style: TextStyle(color: AppTheme.darkTextTertiary, fontSize: 12),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Close'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatMonthDisplay(String monthStr) {
    try {
      final parts = monthStr.split('-');
      final year = int.parse(parts[0]);
      final month = int.parse(parts[1]);
      final date = DateTime(year, month);
      return Formatters.monthYear(date);
    } catch (e) {
      return monthStr;
    }
  }
}

class _SummaryItem extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;

  const _SummaryItem({
    required this.label,
    required this.value,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, color: AppTheme.primaryYellow, size: 28),
        const SizedBox(height: 8),
        Text(
          value,
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: AppTheme.primaryYellow,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(fontSize: 12, color: AppTheme.darkTextSecondary),
        ),
      ],
    );
  }
}

class _PayslipCard extends StatelessWidget {
  final Payslip payslip;
  final VoidCallback onTap;

  const _PayslipCard({required this.payslip, required this.onTap});

  String _formatMonthDisplay(String monthStr) {
    try {
      final parts = monthStr.split('-');
      final year = int.parse(parts[0]);
      final month = int.parse(parts[1]);
      final date = DateTime(year, month);
      return Formatters.monthYear(date);
    } catch (e) {
      return monthStr;
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: AppTheme.darkCard,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.darkDivider),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: AppTheme.primaryYellow.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      _getMonthAbbr(payslip.month),
                      style: const TextStyle(
                        color: AppTheme.primaryYellow,
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                    Text(
                      _getYear(payslip.month),
                      style: TextStyle(
                        color: AppTheme.primaryYellow.withValues(alpha: 0.7),
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _formatMonthDisplay(payslip.month),
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 15,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        _MiniStat(
                          label: 'Basic',
                          value: Formatters.currencyCompact(
                            payslip.basicSalary,
                          ),
                        ),
                        const SizedBox(width: 12),
                        _MiniStat(
                          label: 'OT',
                          value: Formatters.currencyCompact(
                            payslip.overtimePay,
                          ),
                          color: AppTheme.successColor,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    Formatters.currency(payslip.netPay),
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      color: AppTheme.successColor,
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Net Pay',
                    style: TextStyle(
                      color: AppTheme.darkTextTertiary,
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 8),
              Icon(Icons.chevron_right, color: AppTheme.darkTextTertiary),
            ],
          ),
        ),
      ),
    );
  }

  String _getMonthAbbr(String monthStr) {
    try {
      final month = int.parse(monthStr.split('-')[1]);
      const months = [
        'JAN',
        'FEB',
        'MAR',
        'APR',
        'MAY',
        'JUN',
        'JUL',
        'AUG',
        'SEP',
        'OCT',
        'NOV',
        'DEC',
      ];
      return months[month - 1];
    } catch (e) {
      return '---';
    }
  }

  String _getYear(String monthStr) {
    try {
      return monthStr.split('-')[0];
    } catch (e) {
      return '----';
    }
  }
}

class _MiniStat extends StatelessWidget {
  final String label;
  final String value;
  final Color? color;

  const _MiniStat({required this.label, required this.value, this.color});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(
          '$label: ',
          style: TextStyle(color: AppTheme.darkTextTertiary, fontSize: 11),
        ),
        Text(
          value,
          style: TextStyle(
            color: color ?? AppTheme.darkTextSecondary,
            fontSize: 11,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;
  final bool isBold;
  final Color? valueColor;

  const _DetailRow({
    required this.label,
    required this.value,
    this.isBold = false,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              color: isBold
                  ? AppTheme.darkTextPrimary
                  : AppTheme.darkTextSecondary,
              fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
              fontSize: isBold ? 15 : 14,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              color: valueColor ?? AppTheme.darkTextPrimary,
              fontWeight: isBold ? FontWeight.bold : FontWeight.w600,
              fontSize: isBold ? 16 : 14,
            ),
          ),
        ],
      ),
    );
  }
}
