import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../core/firebase/firestore_service.dart';
import '../../../core/models/notification.dart';
import '../../../core/models/transaction.dart';
import '../../../core/models/budget.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';
import '../../../routes/app_router.dart';

class RegularDashboardScreen extends StatelessWidget {
  const RegularDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final firestoreService = context.read<FirestoreService>();
    final uid = authProvider.uid;

    if (uid == null) {
      return const Center(child: CircularProgressIndicator());
    }

    // Process recurring transactions on dashboard load (fire and forget)
    Future.microtask(
      () => firestoreService.processRecurringTransactions(uid),
    );

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Welcome back,',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: AppTheme.darkTextSecondary,
              ),
            ),
            Text(
              authProvider.appUser?.name ?? 'User',
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
            ),
          ],
        ),
        actions: [
          _NotificationBellButton(
            notificationsRoute: AppRouter.regularNotifications,
            uid: uid,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await authProvider.reloadUserData();
          await firestoreService.processRecurringTransactions(uid);
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Balance Card
              _BalanceCard(uid: uid, firestoreService: firestoreService),
              const SizedBox(height: 24),

              // Quick Actions
              _QuickActions(),
              const SizedBox(height: 24),

              // Budget Overview
              Text(
                'Budget Overview',
                style: Theme.of(
                  context,
                ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              _BudgetOverview(uid: uid, firestoreService: firestoreService),
              const SizedBox(height: 24),

              // Recent Transactions
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Recent Transactions',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  TextButton(
                    onPressed: () => context.go(AppRouter.transactions),
                    child: const Text('See All'),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              _RecentTransactions(uid: uid, firestoreService: firestoreService),
            ],
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.go(AppRouter.addTransaction),
        icon: const Icon(Icons.add),
        label: const Text('Add'),
      ),
    );
  }
}

class _BalanceCard extends StatelessWidget {
  final String uid;
  final FirestoreService firestoreService;

  const _BalanceCard({required this.uid, required this.firestoreService});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<List<Transaction>>(
      stream: firestoreService.getUserTransactions(uid),
      builder: (context, snapshot) {
        double totalIncome = 0;
        double totalExpense = 0;

        if (snapshot.hasData) {
          for (final txn in snapshot.data!) {
            if (txn.type == TransactionType.income) {
              totalIncome += txn.amount;
            } else {
              totalExpense += txn.amount;
            }
          }
        }

        final balance = totalIncome - totalExpense;

        return Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [AppTheme.primaryYellow, AppTheme.darkYellow],
            ),
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: AppTheme.primaryYellow.withValues(alpha: 0.3),
                blurRadius: 20,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Total Balance',
                    style: TextStyle(
                      color: AppTheme.darkTextSecondary,
                      fontSize: 14,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: AppTheme.amoledBlack.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      'This Month',
                      style: TextStyle(
                        color: AppTheme.darkTextSecondary,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                Formatters.currency(balance),
                style: const TextStyle(
                  color: AppTheme.amoledBlack,
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: _BalanceItem(
                      icon: Icons.arrow_downward,
                      label: 'Income',
                      amount: totalIncome,
                      color: AppTheme.darkYellow,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: _BalanceItem(
                      icon: Icons.arrow_upward,
                      label: 'Expense',
                      amount: totalExpense,
                      color: AppTheme.accentYellow,
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }
}

class _BalanceItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final double amount;
  final Color color;

  const _BalanceItem({
    required this.icon,
    required this.label,
    required this.amount,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppTheme.amoledBlack.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.2),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 16),
          ),
          const SizedBox(width: 8),
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
                Text(
                  Formatters.currencyCompact(amount),
                  style: const TextStyle(
                  color: AppTheme.darkTextPrimary,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _QuickActions extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _QuickActionButton(
            icon: Icons.add_circle_outline,
            label: 'Income',
            onTap: () => context.go(AppRouter.addTransaction),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _QuickActionButton(
            icon: Icons.remove_circle_outline,
            label: 'Expense',
            onTap: () => context.go(AppRouter.addTransaction),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _QuickActionButton(
            icon: Icons.pie_chart_outline,
            label: 'Budgets',
            onTap: () => context.go(AppRouter.budgets),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _QuickActionButton(
            icon: Icons.bar_chart,
            label: 'Reports',
            onTap: () {},
          ),
        ),
      ],
    );
  }
}

class _QuickActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _QuickActionButton({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: AppTheme.darkCard,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.darkDivider),
        ),
        child: Column(
          children: [
            Icon(icon, color: AppTheme.primaryYellow),
            const SizedBox(height: 8),
            Text(
              label,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: AppTheme.darkTextSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _BudgetOverview extends StatelessWidget {
  final String uid;
  final FirestoreService firestoreService;

  const _BudgetOverview({required this.uid, required this.firestoreService});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<List<Budget>>(
      stream: firestoreService.getUserBudgets(uid),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }

        if (!snapshot.hasData || snapshot.data!.isEmpty) {
          return Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: AppTheme.darkCard,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.darkDivider),
            ),
            child: Column(
              children: [
                Icon(
                  Icons.pie_chart_outline,
                  size: 48,
                  color: AppTheme.darkTextTertiary,
                ),
                const SizedBox(height: 12),
                Text(
                  'No budgets yet',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppTheme.darkTextSecondary,
                  ),
                ),
                const SizedBox(height: 8),
                TextButton(
                  onPressed: () => context.go(AppRouter.budgets),
                  child: const Text('Create Budget'),
                ),
              ],
            ),
          );
        }

        final budgets = snapshot.data!.take(3).toList();

        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppTheme.darkCard,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppTheme.darkDivider),
          ),
          child: Column(
            children: budgets.map((budget) {
              final percentage = (budget.spent / budget.limit) * 100;
              return Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          budget.category,
                          style: const TextStyle(fontWeight: FontWeight.w500),
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
                    const SizedBox(height: 8),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: (percentage / 100).clamp(0, 1),
                        backgroundColor: AppTheme.darkDivider,
                        color: AppTheme.getBudgetStatusColor(percentage),
                        minHeight: 6,
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
        );
      },
    );
  }
}

class _RecentTransactions extends StatelessWidget {
  final String uid;
  final FirestoreService firestoreService;

  const _RecentTransactions({
    required this.uid,
    required this.firestoreService,
  });

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<List<Transaction>>(
      stream: firestoreService.getUserTransactions(uid),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }

        if (!snapshot.hasData || snapshot.data!.isEmpty) {
          return Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: AppTheme.darkCard,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.darkDivider),
            ),
            child: Column(
              children: [
                Icon(
                  Icons.receipt_long_outlined,
                  size: 48,
                  color: AppTheme.darkTextTertiary,
                ),
                const SizedBox(height: 12),
                Text(
                  'No transactions yet',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppTheme.darkTextSecondary,
                  ),
                ),
              ],
            ),
          );
        }

        final transactions = snapshot.data!.take(5).toList();

        return Container(
          decoration: BoxDecoration(
            color: AppTheme.darkCard,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppTheme.darkDivider),
          ),
          child: ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: transactions.length,
            separatorBuilder: (_, i) =>
                Divider(color: AppTheme.darkDivider, height: 1),
            itemBuilder: (context, index) {
              final txn = transactions[index];
              final isIncome = txn.type == TransactionType.income;

              return ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color:
                        (isIncome ? AppTheme.successColor : AppTheme.errorColor)
                            .withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(
                    isIncome ? Icons.arrow_downward : Icons.arrow_upward,
                    color: isIncome
                        ? AppTheme.successColor
                        : AppTheme.errorColor,
                    size: 20,
                  ),
                ),
                title: Text(
                  txn.title,
                  style: const TextStyle(fontWeight: FontWeight.w500),
                ),
                subtitle: Text(
                  '${txn.category} • ${Formatters.dateShort(txn.date)}',
                  style: TextStyle(
                    color: AppTheme.darkTextTertiary,
                    fontSize: 12,
                  ),
                ),
                trailing: Text(
                  '${isIncome ? '+' : '-'}${Formatters.currency(txn.amount)}',
                  style: TextStyle(
                    color: isIncome
                        ? AppTheme.successColor
                        : AppTheme.errorColor,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              );
            },
          ),
        );
      },
    );
  }
}

/// Notification bell icon with unread count badge.
class _NotificationBellButton extends StatelessWidget {
  final String notificationsRoute;
  final String uid;

  const _NotificationBellButton({
    required this.notificationsRoute,
    required this.uid,
  });

  @override
  Widget build(BuildContext context) {
    final firestoreService = context.read<FirestoreService>();
    return StreamBuilder<List<AppNotification>>(
      stream: firestoreService.notificationsStream(uid),
      builder: (context, snapshot) {
        final unreadCount =
            (snapshot.data ?? []).where((n) => !n.read).length;
        return Stack(
          children: [
            IconButton(
              icon: const Icon(Icons.notifications_outlined),
              onPressed: () => context.go(notificationsRoute),
            ),
            if (unreadCount > 0)
              Positioned(
                right: 6,
                top: 6,
                child: Container(
                  padding: const EdgeInsets.all(3),
                  decoration: const BoxDecoration(
                    color: AppTheme.errorColor,
                    shape: BoxShape.circle,
                  ),
                  constraints:
                      const BoxConstraints(minWidth: 16, minHeight: 16),
                  child: Text(
                    unreadCount > 9 ? '9+' : '$unreadCount',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 9,
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
          ],
        );
      },
    );
  }
}
