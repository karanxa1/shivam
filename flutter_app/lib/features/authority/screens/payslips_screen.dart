import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../core/firebase/firestore_service.dart';
import '../../../core/models/employee.dart';
import '../../../core/models/payslip.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';
import '../../../routes/app_router.dart';

class PayslipsScreen extends StatefulWidget {
  const PayslipsScreen({super.key});

  @override
  State<PayslipsScreen> createState() => _PayslipsScreenState();
}

class _PayslipsScreenState extends State<PayslipsScreen> {
  String _selectedMonth = Formatters.currentMonth();
  String _searchQuery = '';

  @override
  Widget build(BuildContext context) {
    final firestoreService = context.read<FirestoreService>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Payslips'),
        actions: [
          IconButton(
            icon: const Icon(Icons.calendar_month),
            onPressed: _showMonthPicker,
          ),
        ],
      ),
      body: Column(
        children: [
          // Month selector
          Container(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: _showMonthPicker,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 12,
                      ),
                      decoration: BoxDecoration(
                        color: AppTheme.darkCard,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppTheme.darkDivider),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              Icon(
                                Icons.calendar_today,
                                size: 18,
                                color: AppTheme.primaryYellow,
                              ),
                              const SizedBox(width: 12),
                              Text(
                                _formatMonthDisplay(_selectedMonth),
                                style: const TextStyle(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 15,
                                ),
                              ),
                            ],
                          ),
                          Icon(
                            Icons.arrow_drop_down,
                            color: AppTheme.darkTextSecondary,
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Search bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: TextField(
              onChanged: (value) => setState(() => _searchQuery = value),
              decoration: InputDecoration(
                hintText: 'Search by employee name...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () => setState(() => _searchQuery = ''),
                      )
                    : null,
              ),
            ),
          ),

          const SizedBox(height: 16),

          // Payslips list
          Expanded(
            child: StreamBuilder<List<Employee>>(
              stream: firestoreService.employeesStream(),
              builder: (context, employeeSnapshot) {
                if (employeeSnapshot.connectionState ==
                    ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }

                final employees = employeeSnapshot.data ?? [];
                final employeeMap = {for (var e in employees) if (e.id != null) e.id!: e};

                return StreamBuilder<List<Payslip>>(
                  stream: firestoreService.allPayslipsStream(),
                  builder: (context, payslipSnapshot) {
                    if (payslipSnapshot.connectionState ==
                        ConnectionState.waiting) {
                      return const Center(child: CircularProgressIndicator());
                    }

                    if (payslipSnapshot.hasError) {
                      return Center(
                        child: Text('Error: ${payslipSnapshot.error}'),
                      );
                    }

                    var payslips = payslipSnapshot.data ?? [];

                    // Filter by selected month
                    payslips = payslips
                        .where((p) => p.month == _selectedMonth)
                        .toList();

                    // Filter by search query
                    if (_searchQuery.isNotEmpty) {
                      payslips = payslips.where((p) {
                        final employee = employeeMap[p.employeeId];
                        if (employee == null) return false;
                        return employee.name.toLowerCase().contains(
                          _searchQuery.toLowerCase(),
                        );
                      }).toList();
                    }

                    if (payslips.isEmpty) {
                      return _EmptyState(
                        icon: Icons.receipt_long_outlined,
                        message:
                            'No payslips for ${_formatMonthDisplay(_selectedMonth)}',
                        actionLabel: 'Generate Payslips',
                        onAction: () => context.go(AppRouter.generatePayslip),
                      );
                    }

                    // Calculate totals
                    final totalNetPay = payslips.fold<double>(
                      0,
                      (sum, p) => sum + p.netPay,
                    );

                    return Column(
                      children: [
                        // Summary card
                        Container(
                          margin: const EdgeInsets.symmetric(horizontal: 16),
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                AppTheme.primaryYellow.withValues(alpha: 0.2),
                                AppTheme.darkYellow.withValues(alpha: 0.1),
                              ],
                            ),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: AppTheme.primaryYellow.withValues(
                                alpha: 0.3,
                              ),
                            ),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceAround,
                            children: [
                              _SummaryItem(
                                label: 'Total Payslips',
                                value: '${payslips.length}',
                                icon: Icons.receipt_long,
                              ),
                              Container(
                                width: 1,
                                height: 40,
                                color: AppTheme.darkDivider,
                              ),
                              _SummaryItem(
                                label: 'Total Payout',
                                value: Formatters.currencyCompact(totalNetPay),
                                icon: Icons.currency_rupee,
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 16),

                        // Payslips list
                        Expanded(
                          child: ListView.builder(
                            padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
                            itemCount: payslips.length,
                            itemBuilder: (context, index) {
                              final payslip = payslips[index];
                              final employee = employeeMap[payslip.employeeId];

                              return _PayslipCard(
                                payslip: payslip,
                                employeeName: employee?.name ?? 'Unknown',
                                employeeDepartment:
                                    employee?.department ?? 'N/A',
                                onTap: () =>
                                    _showPayslipDetails(payslip, employee),
                                onDelete: () => _confirmDelete(payslip),
                              );
                            },
                          ),
                        ),
                      ],
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.go(AppRouter.generatePayslip),
        icon: const Icon(Icons.add),
        label: const Text('Generate'),
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

  void _showMonthPicker() {
    final now = DateTime.now();
    final months = List.generate(12, (i) {
      final date = DateTime(now.year, now.month - i);
      return Formatters.monthString(date);
    });

    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Select Month', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 16),
            SizedBox(
              height: 200,
              child: ListView.builder(
                itemCount: months.length,
                itemBuilder: (context, index) {
                  final month = months[index];
                  final isSelected = month == _selectedMonth;
                  return ListTile(
                    title: Text(_formatMonthDisplay(month)),
                    trailing: isSelected
                        ? const Icon(
                            Icons.check_circle,
                            color: AppTheme.primaryYellow,
                          )
                        : null,
                    selected: isSelected,
                    onTap: () {
                      setState(() => _selectedMonth = month);
                      Navigator.pop(context);
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showPayslipDetails(Payslip payslip, Employee? employee) {
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
                        employee?.name ?? 'Unknown Employee',
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
            _DetailRow(
              label: 'Basic Salary',
              value: Formatters.currency(payslip.basicSalary),
            ),
            _DetailRow(
              label: 'Overtime Pay',
              value: Formatters.currency(payslip.overtimePay),
            ),
            _DetailRow(
              label: 'Deductions',
              value: '- ${Formatters.currency(payslip.deductions)}',
              valueColor: AppTheme.errorColor,
            ),
            const Divider(height: 32),
            _DetailRow(
              label: 'Net Pay',
              value: Formatters.currency(payslip.netPay),
              isBold: true,
              valueColor: AppTheme.successColor,
            ),
            const SizedBox(height: 8),
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

  void _confirmDelete(Payslip payslip) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Payslip'),
        content: const Text(
          'Are you sure you want to delete this payslip? This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              final firestoreService = context.read<FirestoreService>();
              final messenger = ScaffoldMessenger.of(context);
              final nav = Navigator.of(context);
              try {
                await firestoreService.deletePayslip(payslip.id!);
                if (mounted) {
                  nav.pop();
                  messenger.showSnackBar(
                    const SnackBar(
                      content: Text('Payslip deleted'),
                      backgroundColor: AppTheme.successColor,
                    ),
                  );
                }
              } catch (e) {
                messenger.showSnackBar(
                  SnackBar(
                    content: Text('Error: $e'),
                    backgroundColor: AppTheme.errorColor,
                  ),
                );
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.errorColor,
            ),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
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
        Icon(icon, color: AppTheme.primaryYellow, size: 24),
        const SizedBox(height: 8),
        Text(
          value,
          style: const TextStyle(
            fontSize: 18,
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
  final String employeeName;
  final String employeeDepartment;
  final VoidCallback onTap;
  final VoidCallback onDelete;

  const _PayslipCard({
    required this.payslip,
    required this.employeeName,
    required this.employeeDepartment,
    required this.onTap,
    required this.onDelete,
  });

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
        child: Column(
          children: [
            ListTile(
              leading: Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: AppTheme.primaryYellow.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Center(
                  child: Text(
                    employeeName.isNotEmpty
                        ? employeeName[0].toUpperCase()
                        : 'E',
                    style: const TextStyle(
                      color: AppTheme.primaryYellow,
                      fontWeight: FontWeight.bold,
                      fontSize: 18,
                    ),
                  ),
                ),
              ),
              title: Text(
                employeeName,
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
              subtitle: Text(
                employeeDepartment,
                style: TextStyle(
                  color: AppTheme.darkTextSecondary,
                  fontSize: 13,
                ),
              ),
              trailing: PopupMenuButton(
                icon: const Icon(Icons.more_vert),
                itemBuilder: (context) => [
                  const PopupMenuItem(
                    value: 'view',
                    child: Row(
                      children: [
                        Icon(Icons.visibility_outlined, size: 20),
                        SizedBox(width: 12),
                        Text('View Details'),
                      ],
                    ),
                  ),
                  const PopupMenuItem(
                    value: 'delete',
                    child: Row(
                      children: [
                        Icon(
                          Icons.delete_outline,
                          size: 20,
                          color: AppTheme.errorColor,
                        ),
                        SizedBox(width: 12),
                        Text(
                          'Delete',
                          style: TextStyle(color: AppTheme.errorColor),
                        ),
                      ],
                    ),
                  ),
                ],
                onSelected: (value) {
                  if (value == 'view') onTap();
                  if (value == 'delete') onDelete();
                },
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _InfoChip(
                    icon: Icons.currency_rupee,
                    label: Formatters.currency(payslip.netPay),
                    color: AppTheme.successColor,
                  ),
                  Text(
                    Formatters.dateShort(payslip.generatedAt),
                    style: TextStyle(
                      color: AppTheme.darkTextTertiary,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;

  const _InfoChip({
    required this.icon,
    required this.label,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              color: color,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
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
      padding: const EdgeInsets.symmetric(vertical: 8),
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
              fontSize: isBold ? 16 : 14,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              color: valueColor ?? AppTheme.darkTextPrimary,
              fontWeight: isBold ? FontWeight.bold : FontWeight.w600,
              fontSize: isBold ? 18 : 14,
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  final IconData icon;
  final String message;
  final String actionLabel;
  final VoidCallback onAction;

  const _EmptyState({
    required this.icon,
    required this.message,
    required this.actionLabel,
    required this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 64, color: AppTheme.darkTextTertiary),
            const SizedBox(height: 16),
            Text(
              message,
              textAlign: TextAlign.center,
              style: TextStyle(color: AppTheme.darkTextSecondary, fontSize: 16),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: onAction,
              icon: const Icon(Icons.add),
              label: Text(actionLabel),
            ),
          ],
        ),
      ),
    );
  }
}
