import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../core/firebase/firestore_service.dart';
import '../../../core/models/employee.dart';
import '../../../core/models/user.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/validators.dart';
import '../../../routes/app_router.dart';

class AddEmployeeScreen extends StatefulWidget {
  const AddEmployeeScreen({super.key});

  @override
  State<AddEmployeeScreen> createState() => _AddEmployeeScreenState();
}

class _AddEmployeeScreenState extends State<AddEmployeeScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _salaryController = TextEditingController();
  final _overtimeController = TextEditingController(text: '0');

  String _selectedDepartment = Departments.all.first;
  bool _isLoading = false;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _salaryController.dispose();
    _overtimeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Add Employee'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () {
            final role = context.read<AuthProvider>().appUser?.role ?? UserRole.admin;
            context.go(AppRouter.employeesFor(role));
          },
        ),
      ),
      body: Form(
        key: _formKey,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Info banner
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.infoColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: AppTheme.infoColor.withValues(alpha: 0.3),
                  ),
                ),
                child: Row(
                  children: [
                    Icon(Icons.info_outline, color: AppTheme.infoColor),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Employee will be linked to their account when they register with the same email address.',
                        style: TextStyle(
                          color: AppTheme.infoColor,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Personal info section
              Text(
                'Personal Information',
                style: Theme.of(
                  context,
                ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),

              // Name field
              TextFormField(
                controller: _nameController,
                textCapitalization: TextCapitalization.words,
                decoration: const InputDecoration(
                  labelText: 'Full Name',
                  hintText: 'Enter employee name',
                  prefixIcon: Icon(Icons.person_outline),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Please enter employee name';
                  }
                  if (value.trim().length < 2) {
                    return 'Name must be at least 2 characters';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Email field
              TextFormField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(
                  labelText: 'Email Address',
                  hintText: 'Enter work email',
                  prefixIcon: Icon(Icons.email_outlined),
                ),
                validator: Validators.email,
              ),
              const SizedBox(height: 24),

              // Work info section
              Text(
                'Work Information',
                style: Theme.of(
                  context,
                ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),

              // Department dropdown
              DropdownButtonFormField<String>(
                initialValue: _selectedDepartment,
                decoration: const InputDecoration(
                  labelText: 'Department',
                  prefixIcon: Icon(Icons.business),
                ),
                items: Departments.all
                    .map((d) => DropdownMenuItem(value: d, child: Text(d)))
                    .toList(),
                onChanged: (value) {
                  if (value != null) {
                    setState(() => _selectedDepartment = value);
                  }
                },
              ),
              const SizedBox(height: 24),

              // Salary section
              Text(
                'Compensation',
                style: Theme.of(
                  context,
                ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),

              // Salary field
              TextFormField(
                controller: _salaryController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Monthly Salary',
                  hintText: 'Enter base salary',
                  prefixIcon: Icon(Icons.currency_rupee),
                  suffixText: '/month',
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter salary';
                  }
                  final salary = double.tryParse(value);
                  if (salary == null || salary <= 0) {
                    return 'Please enter a valid salary amount';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Overtime hours field
              TextFormField(
                controller: _overtimeController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Overtime Hours (Optional)',
                  hintText: 'Enter overtime hours',
                  prefixIcon: Icon(Icons.access_time),
                  suffixText: 'hours',
                  helperText: 'Overtime rate: ₹150/hour',
                ),
                validator: (value) {
                  if (value != null && value.isNotEmpty) {
                    final hours = int.tryParse(value);
                    if (hours == null || hours < 0) {
                      return 'Please enter valid hours';
                    }
                  }
                  return null;
                },
              ),
              const SizedBox(height: 32),

              // Salary preview
              _SalaryPreview(
                salary: double.tryParse(_salaryController.text) ?? 0,
                overtimeHours: int.tryParse(_overtimeController.text) ?? 0,
              ),
              const SizedBox(height: 32),

              // Submit button
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _addEmployee,
                  child: _isLoading
                      ? const SizedBox(
                          height: 24,
                          width: 24,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Add Employee'),
                ),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _addEmployee() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final firestoreService = context.read<FirestoreService>();

      // Create employee with email as temporary UID
      // When user registers, their UID will be linked
      final employee = Employee(
        uid: _emailController.text
            .trim(), // Will be replaced when user registers
        name: _nameController.text.trim(),
        email: _emailController.text.trim(),
        department: _selectedDepartment,
        salary: double.parse(_salaryController.text),
        overtimeHours: int.tryParse(_overtimeController.text) ?? 0,
      );

      await firestoreService.addEmployee(employee);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Employee added successfully'),
            backgroundColor: AppTheme.successColor,
          ),
        );
        final role = context.read<AuthProvider>().appUser?.role ?? UserRole.admin;
        context.go(AppRouter.employeesFor(role));
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
        setState(() => _isLoading = false);
      }
    }
  }
}

class _SalaryPreview extends StatelessWidget {
  final double salary;
  final int overtimeHours;

  const _SalaryPreview({required this.salary, required this.overtimeHours});

  @override
  Widget build(BuildContext context) {
    final overtimePay = overtimeHours * 150.0;
    final totalPay = salary + overtimePay;

    if (salary <= 0) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.darkCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.darkDivider),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Salary Preview',
            style: TextStyle(
              color: AppTheme.darkTextSecondary,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 12),
          _PreviewRow(
            label: 'Base Salary',
            value: '₹${salary.toStringAsFixed(0)}',
          ),
          if (overtimeHours > 0) ...[
            const SizedBox(height: 8),
            _PreviewRow(
              label: 'Overtime ($overtimeHours hrs × ₹150)',
              value: '₹${overtimePay.toStringAsFixed(0)}',
            ),
          ],
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 12),
            child: Divider(),
          ),
          _PreviewRow(
            label: 'Gross Monthly',
            value: '₹${totalPay.toStringAsFixed(0)}',
            isBold: true,
            color: AppTheme.primaryYellow,
          ),
        ],
      ),
    );
  }
}

class _PreviewRow extends StatelessWidget {
  final String label;
  final String value;
  final bool isBold;
  final Color? color;

  const _PreviewRow({
    required this.label,
    required this.value,
    this.isBold = false,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            color: color ?? AppTheme.darkTextSecondary,
            fontWeight: isBold ? FontWeight.w600 : FontWeight.normal,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            color: color ?? AppTheme.darkTextPrimary,
            fontWeight: isBold ? FontWeight.bold : FontWeight.w600,
            fontSize: isBold ? 18 : 14,
          ),
        ),
      ],
    );
  }
}
