import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/firebase/firestore_service.dart';
import '../../../core/models/budget.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/utils/validators.dart';

class BudgetsScreen extends StatefulWidget {
  const BudgetsScreen({super.key});

  @override
  State<BudgetsScreen> createState() => _BudgetsScreenState();
}

class _BudgetsScreenState extends State<BudgetsScreen> {
  String _selectedMonth = _getCurrentMonth();

  static String _getCurrentMonth() {
    final now = DateTime.now();
    return '${now.year}-${now.month.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final firestoreService = context.read<FirestoreService>();
    final uid = authProvider.uid;

    if (uid == null) {
      return const Center(child: CircularProgressIndicator());
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Budgets'),
        actions: [
          IconButton(
            icon: const Icon(Icons.calendar_month),
            onPressed: () => _selectMonth(context),
            tooltip: 'Select Month',
          ),
        ],
      ),
      body: Column(
        children: [
          // Month selector chip
          Container(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Icon(
                  Icons.calendar_today,
                  size: 18,
                  color: AppTheme.darkTextSecondary,
                ),
                const SizedBox(width: 8),
                Text(
                  _formatMonth(_selectedMonth),
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: AppTheme.primaryYellow,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                TextButton.icon(
                  onPressed: () => _selectMonth(context),
                  icon: const Icon(Icons.edit_calendar, size: 18),
                  label: const Text('Change'),
                ),
              ],
            ),
          ),

          // Budgets list
          Expanded(
            child: StreamBuilder<List<Budget>>(
              stream: firestoreService.budgetsStream(uid, _selectedMonth),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }

                if (snapshot.hasError) {
                  return Center(child: Text('Error: ${snapshot.error}'));
                }

                final budgets = snapshot.data ?? [];

                if (budgets.isEmpty) {
                  return _buildEmptyState(context);
                }

                // Calculate totals
                final totalLimit = budgets.fold<double>(
                  0,
                  (sum, b) => sum + b.limit,
                );
                final totalSpent = budgets.fold<double>(
                  0,
                  (sum, b) => sum + b.spent,
                );

                return ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    // Summary card
                    _SummaryCard(
                      totalLimit: totalLimit,
                      totalSpent: totalSpent,
                    ),
                    const SizedBox(height: 24),

                    // Category budgets
                    Text(
                      'Category Budgets',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    ...budgets.map(
                      (budget) => _BudgetCard(
                        budget: budget,
                        onEdit: () =>
                            _showBudgetDialog(context, budget: budget),
                        onDelete: () => _deleteBudget(budget),
                      ),
                    ),
                  ],
                );
              },
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showBudgetDialog(context),
        icon: const Icon(Icons.add),
        label: const Text('Add Budget'),
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.pie_chart_outline,
            size: 64,
            color: AppTheme.darkTextTertiary,
          ),
          const SizedBox(height: 16),
          Text(
            'No budgets for this month',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              color: AppTheme.darkTextSecondary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Create a budget to track your spending',
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(color: AppTheme.darkTextTertiary),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () => _showBudgetDialog(context),
            icon: const Icon(Icons.add),
            label: const Text('Create Budget'),
          ),
        ],
      ),
    );
  }

  String _formatMonth(String month) {
    final parts = month.split('-');
    final year = parts[0];
    final monthNum = int.parse(parts[1]);
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return '${months[monthNum - 1]} $year';
  }

  Future<void> _selectMonth(BuildContext context) async {
    final now = DateTime.now();
    final parts = _selectedMonth.split('-');
    final currentYear = int.parse(parts[0]);
    final currentMonth = int.parse(parts[1]);

    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime(currentYear, currentMonth),
      firstDate: DateTime(2020),
      lastDate: DateTime(now.year, now.month + 6),
      initialDatePickerMode: DatePickerMode.year,
    );

    if (picked != null) {
      setState(() {
        _selectedMonth =
            '${picked.year}-${picked.month.toString().padLeft(2, '0')}';
      });
    }
  }

  Future<void> _showBudgetDialog(BuildContext context, {Budget? budget}) async {
    final isEditing = budget != null;
    final authProvider = context.read<AuthProvider>();
    final firestoreService = context.read<FirestoreService>();
    final messenger = ScaffoldMessenger.of(context);
    final limitController = TextEditingController(
      text: budget?.limit.toString() ?? '',
    );
    final formKey = GlobalKey<FormState>();

    final categories = [
      'Food',
      'Transport',
      'Shopping',
      'Bills',
      'Entertainment',
      'Health',
      'Education',
      'Other',
    ];

    String selectedCategory = budget?.category ?? categories.first;

    final result = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: Text(isEditing ? 'Edit Budget' : 'New Budget'),
          content: Form(
            key: formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                DropdownButtonFormField<String>(
                  initialValue: selectedCategory,
                  decoration: const InputDecoration(
                    labelText: 'Category',
                    prefixIcon: Icon(Icons.category_outlined),
                  ),
                  dropdownColor: AppTheme.darkCard,
                  items: categories.map((cat) {
                    return DropdownMenuItem(value: cat, child: Text(cat));
                  }).toList(),
                  onChanged: (value) {
                    if (value != null) {
                      setDialogState(() => selectedCategory = value);
                    }
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: limitController,
                  keyboardType: const TextInputType.numberWithOptions(
                    decimal: true,
                  ),
                  validator: Validators.amount,
                  decoration: const InputDecoration(
                    labelText: 'Budget Limit',
                    prefixIcon: Icon(Icons.currency_rupee),
                    prefixText: '₹ ',
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                if (formKey.currentState!.validate()) {
                  Navigator.pop(context, {
                    'category': selectedCategory,
                    'limit': double.parse(limitController.text),
                  });
                }
              },
              child: Text(isEditing ? 'Update' : 'Create'),
            ),
          ],
        ),
      ),
    );

    if (result != null) {
      final newBudget = Budget(
        id: budget?.id,
        userId: authProvider.uid!,
        category: result['category'],
        limit: result['limit'],
        spent: budget?.spent ?? 0,
        month: _selectedMonth,
      );

      await firestoreService.saveBudget(newBudget);

      if (mounted) {
        messenger.showSnackBar(
          SnackBar(
            content: Text(isEditing ? 'Budget updated' : 'Budget created'),
            backgroundColor: AppTheme.successColor,
          ),
        );
      }
    }
  }

  Future<void> _deleteBudget(Budget budget) async {
    final firestoreService = context.read<FirestoreService>();
    final messenger = ScaffoldMessenger.of(context);
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Budget'),
        content: Text(
          'Are you sure you want to delete the ${budget.category} budget?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.errorColor,
            ),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await firestoreService.deleteBudget(budget.id!);
      if (mounted) {
        messenger.showSnackBar(const SnackBar(content: Text('Budget deleted')));
      }
    }
  }
}

class _SummaryCard extends StatelessWidget {
  final double totalLimit;
  final double totalSpent;

  const _SummaryCard({required this.totalLimit, required this.totalSpent});

  @override
  Widget build(BuildContext context) {
    final remaining = totalLimit - totalSpent;
    final percentage = totalLimit > 0 ? (totalSpent / totalLimit) : 0.0;
    final isOverBudget = remaining < 0;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppTheme.primaryYellow.withValues(alpha: 0.2),
            AppTheme.primaryYellow.withValues(alpha: 0.05),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: AppTheme.primaryYellow.withValues(alpha: 0.3),
        ),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Total Budget',
                    style: TextStyle(
                      color: AppTheme.darkTextSecondary,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    Formatters.currency(totalLimit),
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.primaryYellow.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  Icons.account_balance_wallet,
                  color: AppTheme.primaryYellow,
                  size: 28,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Progress bar
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: percentage.clamp(0.0, 1.0),
              minHeight: 10,
              backgroundColor: AppTheme.darkDivider,
              valueColor: AlwaysStoppedAnimation<Color>(
                isOverBudget
                    ? AppTheme.errorColor
                    : percentage > 0.9
                    ? AppTheme.errorColor
                    : percentage > 0.7
                    ? AppTheme.warningColor
                    : AppTheme.successColor,
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Stats row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _StatItem(
                label: 'Spent',
                value: Formatters.currency(totalSpent),
                color: AppTheme.errorColor,
              ),
              _StatItem(
                label: 'Remaining',
                value: Formatters.currency(remaining.abs()),
                color: isOverBudget
                    ? AppTheme.errorColor
                    : AppTheme.successColor,
                prefix: isOverBudget ? '-' : '',
              ),
              _StatItem(
                label: 'Used',
                value: '${(percentage * 100).toStringAsFixed(0)}%',
                color: AppTheme.primaryYellow,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _StatItem extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  final String prefix;

  const _StatItem({
    required this.label,
    required this.value,
    required this.color,
    this.prefix = '',
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          label,
          style: TextStyle(color: AppTheme.darkTextTertiary, fontSize: 12),
        ),
        const SizedBox(height: 4),
        Text(
          '$prefix$value',
          style: TextStyle(
            color: color,
            fontWeight: FontWeight.bold,
            fontSize: 14,
          ),
        ),
      ],
    );
  }
}

class _BudgetCard extends StatelessWidget {
  final Budget budget;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const _BudgetCard({
    required this.budget,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final percentage = budget.percentageUsed / 100;
    final status = budget.status;

    Color statusColor;
    switch (status) {
      case BudgetStatus.safe:
        statusColor = AppTheme.successColor;
        break;
      case BudgetStatus.warning:
        statusColor = AppTheme.warningColor;
        break;
      case BudgetStatus.danger:
        statusColor = AppTheme.errorColor;
        break;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppTheme.darkCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.darkDivider),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: onEdit,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: statusColor.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Icon(
                        _getCategoryIcon(budget.category),
                        color: statusColor,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            budget.category,
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                          Text(
                            '${Formatters.currency(budget.spent)} of ${Formatters.currency(budget.limit)}',
                            style: TextStyle(
                              color: AppTheme.darkTextSecondary,
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                    ),
                    PopupMenuButton<String>(
                      onSelected: (value) {
                        if (value == 'edit') onEdit();
                        if (value == 'delete') onDelete();
                      },
                      itemBuilder: (context) => [
                        const PopupMenuItem(
                          value: 'edit',
                          child: Row(
                            children: [
                              Icon(Icons.edit, size: 18),
                              SizedBox(width: 8),
                              Text('Edit'),
                            ],
                          ),
                        ),
                        const PopupMenuItem(
                          value: 'delete',
                          child: Row(
                            children: [
                              Icon(
                                Icons.delete,
                                size: 18,
                                color: AppTheme.errorColor,
                              ),
                              SizedBox(width: 8),
                              Text(
                                'Delete',
                                style: TextStyle(color: AppTheme.errorColor),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: percentage.clamp(0.0, 1.0),
                    minHeight: 6,
                    backgroundColor: AppTheme.darkDivider,
                    valueColor: AlwaysStoppedAnimation<Color>(statusColor),
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '${budget.percentageUsed.toStringAsFixed(0)}% used',
                      style: TextStyle(
                        color: statusColor,
                        fontWeight: FontWeight.w500,
                        fontSize: 12,
                      ),
                    ),
                    Text(
                      '${Formatters.currency(budget.limit - budget.spent)} left',
                      style: TextStyle(
                        color: AppTheme.darkTextSecondary,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  IconData _getCategoryIcon(String category) {
    switch (category.toLowerCase()) {
      case 'food':
        return Icons.restaurant;
      case 'transport':
        return Icons.directions_car;
      case 'shopping':
        return Icons.shopping_bag;
      case 'bills':
        return Icons.receipt;
      case 'entertainment':
        return Icons.movie;
      case 'health':
        return Icons.medical_services;
      case 'education':
        return Icons.school;
      default:
        return Icons.category;
    }
  }
}
