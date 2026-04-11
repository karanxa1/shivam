import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../core/firebase/firestore_service.dart';
import '../../../core/models/employee.dart';
import '../../../core/models/payslip.dart';
import '../../../core/models/user.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';
import '../../../routes/app_router.dart';

class GeneratePayslipScreen extends StatefulWidget {
  const GeneratePayslipScreen({super.key});

  @override
  State<GeneratePayslipScreen> createState() => _GeneratePayslipScreenState();
}

class _GeneratePayslipScreenState extends State<GeneratePayslipScreen> {
  String _selectedMonth = Formatters.currentMonth();
  final Set<String> _selectedEmployees = {};
  bool _selectAll = false;
  bool _isGenerating = false;
  double _defaultDeduction = 1000;

  @override
  Widget build(BuildContext context) {
    final firestoreService = context.read<FirestoreService>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Generate Payslips'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            final role = context.read<AuthProvider>().appUser?.role ?? UserRole.admin;
            context.go(AppRouter.payslipsFor(role));
          },
        ),
      ),
      body: StreamBuilder<List<Employee>>(
        stream: firestoreService.employeesStream(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          }

          final employees = snapshot.data ?? [];

          if (employees.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.people_outline,
                      size: 64,
                      color: AppTheme.darkTextTertiary,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'No employees found',
                      style: TextStyle(
                        color: AppTheme.darkTextSecondary,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Add employees first to generate payslips',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: AppTheme.darkTextTertiary,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 24),
                    ElevatedButton.icon(
                      onPressed: () {
                        final role = context.read<AuthProvider>().appUser?.role ?? UserRole.admin;
                        context.go(AppRouter.addEmployeeFor(role));
                      },
                      icon: const Icon(Icons.person_add),
                      label: const Text('Add Employee'),
                    ),
                  ],
                ),
              ),
            );
          }

          return Column(
            children: [
              // Configuration section
              Container(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Month selector
                    Text(
                      'Payslip Month',
                      style: TextStyle(
                        color: AppTheme.darkTextSecondary,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    GestureDetector(
                      onTap: _showMonthPicker,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 14,
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

                    const SizedBox(height: 16),

                    // Default deduction
                    Text(
                      'Default Deduction',
                      style: TextStyle(
                        color: AppTheme.darkTextSecondary,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        prefixIcon: Icon(Icons.currency_rupee),
                        hintText: 'Enter default deduction amount',
                      ),
                      controller: TextEditingController(
                        text: _defaultDeduction.toStringAsFixed(0),
                      ),
                      onChanged: (value) {
                        _defaultDeduction = double.tryParse(value) ?? 1000;
                      },
                    ),
                  ],
                ),
              ),

              const Divider(),

              // Select all toggle
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Select Employees (${_selectedEmployees.length}/${employees.length})',
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                    ),
                    TextButton(
                      onPressed: () {
                        setState(() {
                          if (_selectAll) {
                            _selectedEmployees.clear();
                          } else {
                            _selectedEmployees.addAll(
                              employees.where((e) => e.id != null).map((e) => e.id!),
                            );
                          }
                          _selectAll = !_selectAll;
                        });
                      },
                      child: Text(_selectAll ? 'Deselect All' : 'Select All'),
                    ),
                  ],
                ),
              ),

              // Employee list
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
                  itemCount: employees.length,
                  itemBuilder: (context, index) {
                    final employee = employees[index];
                    final isSelected = _selectedEmployees.contains(
                      employee.id,
                    );
                    final estimatedPay = Payslip.calculateNetPay(
                      employee.salary,
                      employee.overtimeHours,
                      _defaultDeduction,
                    );

                    return _EmployeeSelectCard(
                      employee: employee,
                      isSelected: isSelected,
                      estimatedPay: estimatedPay,
                      onToggle: () {
                        if (employee.id == null) return;
                        setState(() {
                          if (isSelected) {
                            _selectedEmployees.remove(employee.id);
                            _selectAll = false;
                          } else {
                            _selectedEmployees.add(employee.id!);
                            if (_selectedEmployees.length == employees.length) {
                              _selectAll = true;
                            }
                          }
                        });
                      },
                    );
                  },
                ),
              ),
            ],
          );
        },
      ),
      bottomNavigationBar: _selectedEmployees.isNotEmpty
          ? Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.darkCard,
                border: Border(top: BorderSide(color: AppTheme.darkDivider)),
              ),
              child: SafeArea(
                child: ElevatedButton(
                  onPressed: _isGenerating ? null : _generatePayslips,
                  child: _isGenerating
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : Text(
                          'Generate ${_selectedEmployees.length} Payslip${_selectedEmployees.length > 1 ? 's' : ''}',
                        ),
                ),
              ),
            )
          : null,
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

  Future<void> _generatePayslips() async {
    setState(() => _isGenerating = true);

    try {
      final firestoreService = context.read<FirestoreService>();

      // Get all employees
      final employees = await firestoreService.employeesStream().first;

      // Filter selected employees (using Firestore doc ID)
      final selectedEmployeesList = employees
          .where((e) => e.id != null && _selectedEmployees.contains(e.id))
          .toList();

      int generatedCount = 0;
      int skippedCount = 0;

      for (final employee in selectedEmployeesList) {
        if (employee.id == null) continue;
        // Check if payslip already exists for this month (use Firestore doc ID)
        final existing = await firestoreService.getPayslipForMonth(
          employee.id!,
          _selectedMonth,
        );

        if (existing != null) {
          skippedCount++;
          continue;
        }

        // Generate payslip using Firestore document ID as employeeId
        final payslip = Payslip.generate(
          employeeId: employee.id!,
          month: _selectedMonth,
          basicSalary: employee.salary,
          overtimeHours: employee.overtimeHours,
          deductions: _defaultDeduction,
        );

        await firestoreService.addPayslip(payslip);
        generatedCount++;
      }

      if (mounted) {
        String message;
        if (skippedCount > 0) {
          message =
              'Generated $generatedCount payslip${generatedCount != 1 ? 's' : ''}, '
              'skipped $skippedCount (already exist)';
        } else {
          message =
              'Generated $generatedCount payslip${generatedCount != 1 ? 's' : ''}';
        }

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(message),
            backgroundColor: AppTheme.successColor,
          ),
        );

        final role = context.read<AuthProvider>().appUser?.role ?? UserRole.admin;
        context.go(AppRouter.payslipsFor(role));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isGenerating = false);
      }
    }
  }
}

class _EmployeeSelectCard extends StatelessWidget {
  final Employee employee;
  final bool isSelected;
  final double estimatedPay;
  final VoidCallback onToggle;

  const _EmployeeSelectCard({
    required this.employee,
    required this.isSelected,
    required this.estimatedPay,
    required this.onToggle,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onToggle,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: isSelected
              ? AppTheme.primaryYellow.withValues(alpha: 0.1)
              : AppTheme.darkCard,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? AppTheme.primaryYellow : AppTheme.darkDivider,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: ListTile(
          leading: Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: isSelected
                  ? AppTheme.primaryYellow.withValues(alpha: 0.2)
                  : AppTheme.primaryYellow.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Center(
              child: isSelected
                  ? const Icon(Icons.check, color: AppTheme.primaryYellow)
                  : Text(
                      employee.name.isNotEmpty
                          ? employee.name[0].toUpperCase()
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
            employee.name,
            style: TextStyle(
              fontWeight: FontWeight.w600,
              color: isSelected ? AppTheme.primaryYellow : null,
            ),
          ),
          subtitle: Text(
            employee.department,
            style: TextStyle(color: AppTheme.darkTextSecondary, fontSize: 13),
          ),
          trailing: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                Formatters.currency(estimatedPay),
                style: TextStyle(
                  fontWeight: FontWeight.w600,
                  color: AppTheme.successColor,
                  fontSize: 14,
                ),
              ),
              Text(
                'Est. Net Pay',
                style: TextStyle(
                  color: AppTheme.darkTextTertiary,
                  fontSize: 11,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
