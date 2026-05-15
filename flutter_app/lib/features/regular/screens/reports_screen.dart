import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/firebase/firestore_service.dart';
import '../../../core/models/transaction.dart';
import '../../../core/models/budget.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/services/pdf_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> {
  bool _generatingReport = false;

  Future<void> _downloadReport(
    String uid,
    String name,
    List<Transaction> transactions,
    List<Budget> budgets,
  ) async {
    setState(() => _generatingReport = true);

    try {
      final now = DateTime.now();
      final monthStr = '${now.year}-${now.month.toString().padLeft(2, '0')}';

      final monthTransactions = transactions.where((t) {
        final d = t.date;
        return '${d.year}-${d.month.toString().padLeft(2, '0')}' == monthStr;
      }).toList();

      final monthBudgets = budgets.where((b) => b.month == monthStr).toList();

      if (monthTransactions.isEmpty) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('No transactions to include in report')),
          );
        }
        return;
      }

      await PdfService().generateMonthlyFinanceReport(
        name,
        monthStr,
        monthTransactions,
        monthBudgets,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Report downloaded'),
            backgroundColor: AppTheme.successColor,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to generate report: $e'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _generatingReport = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final firestoreService = context.read<FirestoreService>();
    final uid = authProvider.uid;
    final name = authProvider.appUser?.name ?? 'User';

    if (uid == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final now = DateTime.now();
    final monthStr = '${now.year}-${now.month.toString().padLeft(2, '0')}';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Reports'),
      ),
      body: StreamBuilder<List<Transaction>>(
        stream: firestoreService.getUserTransactions(uid),
        builder: (context, txnSnapshot) {
          return StreamBuilder<List<Budget>>(
            stream: firestoreService.getUserBudgets(uid),
            builder: (context, budgetSnapshot) {
              final transactions = txnSnapshot.data ?? [];
              final budgets = budgetSnapshot.data ?? [];

              final monthTransactions = transactions.where((t) {
                final d = t.date;
                return '${d.year}-${d.month.toString().padLeft(2, '0')}' == monthStr;
              }).toList();

              final monthBudgets = budgets.where((b) => b.month == monthStr).toList();

              final income = monthTransactions
                  .where((t) => t.type == TransactionType.income)
                  .fold<double>(0, (s, t) => s + t.amount);
              final expenses = monthTransactions
                  .where((t) => t.type == TransactionType.expense)
                  .fold<double>(0, (s, t) => s + t.amount);

              final expenseByCategory = <String, double>{};
              for (final t in monthTransactions.where((t) => t.type == TransactionType.expense)) {
                expenseByCategory[t.category] = (expenseByCategory[t.category] ?? 0) + t.amount;
              }

              return RefreshIndicator(
                onRefresh: () async {
                  await authProvider.reloadUserData();
                },
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Month header
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: [AppTheme.primaryYellow, AppTheme.darkYellow],
                          ),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Monthly Report',
                              style: TextStyle(
                                color: AppTheme.darkTextSecondary,
                                fontSize: 14,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              Formatters.monthYear(now),
                              style: const TextStyle(
                                color: AppTheme.amoledBlack,
                                fontSize: 24,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),

                      // Summary cards
                      Row(
                        children: [
                          Expanded(
                            child: _SummaryCard(
                              label: 'Income',
                              value: Formatters.currencyCompact(income),
                              icon: Icons.arrow_downward,
                              color: AppTheme.successColor,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _SummaryCard(
                              label: 'Expenses',
                              value: Formatters.currencyCompact(expenses),
                              icon: Icons.arrow_upward,
                              color: AppTheme.errorColor,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      _SummaryCard(
                        label: 'Net Savings',
                        value: Formatters.currencyCompact(income - expenses),
                        icon: Icons.account_balance_wallet,
                        color: AppTheme.primaryYellow,
                        fullWidth: true,
                      ),
                      const SizedBox(height: 24),

                      // Transaction count
                      Text(
                        'Transactions',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppTheme.darkCard,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppTheme.darkDivider),
                        ),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: AppTheme.primaryYellow.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Icon(
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
                                    '${monthTransactions.length} transactions',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w600,
                                      fontSize: 16,
                                    ),
                                  ),
                                  Text(
                                    'For ${Formatters.monthYear(now)}',
                                    style: TextStyle(
                                      color: AppTheme.darkTextSecondary,
                                      fontSize: 13,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Budgets
                      Text(
                        'Budgets',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 12),
                      if (monthBudgets.isEmpty)
                        Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: AppTheme.darkCard,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppTheme.darkDivider),
                          ),
                          child: Row(
                            children: [
                              Icon(
                                Icons.pie_chart_outline,
                                color: AppTheme.darkTextTertiary,
                              ),
                              const SizedBox(width: 12),
                              Text(
                                'No budgets for this month',
                                style: TextStyle(
                                  color: AppTheme.darkTextSecondary,
                                ),
                              ),
                            ],
                          ),
                        )
                      else
                        ...monthBudgets.map((budget) {
                          final percentage = (budget.spent / budget.limit) * 100;
                          return Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: AppTheme.darkCard,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: AppTheme.darkDivider),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      budget.category,
                                      style: const TextStyle(fontWeight: FontWeight.w600),
                                    ),
                                    Text(
                                      '${Formatters.currencyCompact(budget.spent)} / ${Formatters.currencyCompact(budget.limit)}',
                                      style: TextStyle(
                                        color: AppTheme.darkTextSecondary,
                                        fontSize: 12,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 10),
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(4),
                                  child: LinearProgressIndicator(
                                    value: (percentage / 100).clamp(0, 1),
                                    backgroundColor: AppTheme.darkDivider,
                                    color: AppTheme.getBudgetStatusColor(percentage),
                                    minHeight: 8,
                                  ),
                                ),
                              ],
                            ),
                          );
                        }),

                      const SizedBox(height: 24),

                      // Category breakdown
                      if (expenseByCategory.isNotEmpty) ...[
                        Text(
                          'Expense Categories',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: AppTheme.darkCard,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppTheme.darkDivider),
                          ),
                          child: Column(
                            children: expenseByCategory.entries.map((entry) {
                              return Padding(
                                padding: const EdgeInsets.only(bottom: 10),
                                child: Row(
                                  children: [
                                    Container(
                                      width: 10,
                                      height: 10,
                                      decoration: BoxDecoration(
                                        color: AppTheme.primaryYellow,
                                        borderRadius: BorderRadius.circular(3),
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Text(entry.key),
                                    ),
                                    Text(
                                      Formatters.currency(entry.value),
                                      style: const TextStyle(fontWeight: FontWeight.w600),
                                    ),
                                  ],
                                ),
                              );
                            }).toList(),
                          ),
                        ),
                        const SizedBox(height: 24),
                      ],

                      // Download button
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          onPressed: _generatingReport || monthTransactions.isEmpty
                              ? null
                              : () => _downloadReport(uid, name, transactions, budgets),
                          icon: _generatingReport
                              ? const SizedBox(
                                  width: 18,
                                  height: 18,
                                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                )
                              : const Icon(Icons.download),
                          label: Text(_generatingReport ? 'Generating...' : 'Download Report'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.primaryYellow,
                            foregroundColor: AppTheme.amoledBlack,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            textStyle: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 32),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

class _SummaryCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;
  final bool fullWidth;

  const _SummaryCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
    this.fullWidth = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: fullWidth ? double.infinity : null,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.darkCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.darkDivider),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    color: AppTheme.darkTextSecondary,
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
