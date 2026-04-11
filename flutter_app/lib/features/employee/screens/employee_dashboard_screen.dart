import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../core/firebase/firestore_service.dart';
import '../../../core/models/employee.dart';
import '../../../core/models/notification.dart';
import '../../../core/models/payslip.dart';
import '../../../core/models/task.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';
import '../../../routes/app_router.dart';

class EmployeeDashboardScreen extends StatelessWidget {
  const EmployeeDashboardScreen({super.key});

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
        title: const Text('Dashboard'),
        actions: [
          _NotificationBellButton(
            notificationsRoute: AppRouter.employeeNotifications,
            uid: user.uid,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          // Refresh data
          await Future.delayed(const Duration(milliseconds: 500));
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Welcome header
              _WelcomeHeader(userName: user.name),

              const SizedBox(height: 24),

              // Employee info card
              FutureBuilder<Employee?>(
                future: firestoreService.getEmployeeByUid(user.uid),
                builder: (context, snapshot) {
                  final employee = snapshot.data;

                  return _EmployeeInfoCard(
                    employee: employee,
                    isLoading:
                        snapshot.connectionState == ConnectionState.waiting,
                  );
                },
              ),

              const SizedBox(height: 24),

              // Tasks summary
              Text(
                'My Tasks',
                style: Theme.of(
                  context,
                ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),

              StreamBuilder<List<Task>>(
                stream: firestoreService.tasksStreamByUserUid(user.uid),
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const _LoadingCard();
                  }

                  final tasks = snapshot.data ?? [];
                  final pendingTasks = tasks
                      .where((t) => t.status == TaskStatus.pending)
                      .length;
                  final inProgressTasks = tasks
                      .where((t) => t.status == TaskStatus.inProgress)
                      .length;
                  final completedTasks = tasks
                      .where((t) => t.status == TaskStatus.done)
                      .length;

                  return Column(
                    children: [
                      // Task stats row
                      Row(
                        children: [
                          Expanded(
                            child: _StatCard(
                              title: 'Pending',
                              value: '$pendingTasks',
                              icon: Icons.pending_actions,
                              color: AppTheme.warningColor,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _StatCard(
                              title: 'In Progress',
                              value: '$inProgressTasks',
                              icon: Icons.timelapse,
                              color: AppTheme.primaryYellow,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _StatCard(
                              title: 'Done',
                              value: '$completedTasks',
                              icon: Icons.check_circle_outline,
                              color: AppTheme.successColor,
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 16),

                      // Recent tasks
                      if (tasks.isNotEmpty) ...[
                        ...tasks.take(3).map((task) => _TaskCard(task: task)),
                        if (tasks.length > 3)
                          Padding(
                            padding: const EdgeInsets.only(top: 8),
                            child: TextButton(
                              onPressed: () => context.go(AppRouter.myTasks),
                              child: Text('View All ${tasks.length} Tasks'),
                            ),
                          ),
                      ] else
                        _EmptyState(
                          icon: Icons.task_alt,
                          message: 'No tasks assigned yet',
                        ),
                    ],
                  );
                },
              ),

              const SizedBox(height: 24),

              // Recent payslips
              Text(
                'Recent Payslips',
                style: Theme.of(
                  context,
                ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),

              StreamBuilder<List<Payslip>>(
                stream: firestoreService.payslipsStreamByUserUid(user.uid),
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const _LoadingCard();
                  }

                  final payslips = snapshot.data ?? [];

                  if (payslips.isEmpty) {
                    return _EmptyState(
                      icon: Icons.receipt_long_outlined,
                      message: 'No payslips yet',
                    );
                  }

                  return Column(
                    children: [
                      ...payslips
                          .take(2)
                          .map((payslip) => _PayslipCard(payslip: payslip)),
                      if (payslips.length > 2)
                        Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: TextButton(
                            onPressed: () => context.go(AppRouter.myPayslips),
                            child: Text('View All ${payslips.length} Payslips'),
                          ),
                        ),
                    ],
                  );
                },
              ),

              const SizedBox(height: 100),
            ],
          ),
        ),
      ),
    );
  }
}

class _WelcomeHeader extends StatelessWidget {
  final String userName;

  const _WelcomeHeader({required this.userName});

  @override
  Widget build(BuildContext context) {
    final hour = DateTime.now().hour;
    String greeting;
    if (hour < 12) {
      greeting = 'Good Morning';
    } else if (hour < 17) {
      greeting = 'Good Afternoon';
    } else {
      greeting = 'Good Evening';
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          greeting,
          style: TextStyle(color: AppTheme.darkTextSecondary, fontSize: 14),
        ),
        const SizedBox(height: 4),
        Text(
          userName,
          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
        ),
      ],
    );
  }
}

class _EmployeeInfoCard extends StatelessWidget {
  final Employee? employee;
  final bool isLoading;

  const _EmployeeInfoCard({required this.employee, required this.isLoading});

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const _LoadingCard();
    }

    if (employee == null) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppTheme.warningColor.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: AppTheme.warningColor.withValues(alpha: 0.3),
          ),
        ),
        child: Row(
          children: [
            Icon(Icons.info_outline, color: AppTheme.warningColor),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                'Your employee profile is not set up yet. Please contact your administrator.',
                style: TextStyle(color: AppTheme.warningColor, fontSize: 13),
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppTheme.primaryYellow.withValues(alpha: 0.15),
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
            children: [
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: AppTheme.primaryYellow.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Center(
                  child: Text(
                    employee!.name.isNotEmpty
                        ? employee!.name[0].toUpperCase()
                        : 'E',
                    style: const TextStyle(
                      color: AppTheme.primaryYellow,
                      fontWeight: FontWeight.bold,
                      fontSize: 24,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      employee!.department,
                      style: TextStyle(
                        color: AppTheme.primaryYellow,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      Formatters.currency(employee!.salary),
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      'Monthly Salary',
                      style: TextStyle(
                        color: AppTheme.darkTextSecondary,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (employee!.overtimeHours > 0) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: AppTheme.successColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.access_time,
                    size: 16,
                    color: AppTheme.successColor,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    '${employee!.overtimeHours} overtime hours this month',
                    style: TextStyle(
                      color: AppTheme.successColor,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;

  const _StatCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.darkCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.darkDivider),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: TextStyle(fontSize: 11, color: AppTheme.darkTextSecondary),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

class _TaskCard extends StatelessWidget {
  final Task task;

  const _TaskCard({required this.task});

  @override
  Widget build(BuildContext context) {
    Color statusColor;
    String statusText;

    switch (task.status) {
      case TaskStatus.pending:
        statusColor = AppTheme.warningColor;
        statusText = 'Pending';
        break;
      case TaskStatus.inProgress:
        statusColor = AppTheme.primaryYellow;
        statusText = 'In Progress';
        break;
      case TaskStatus.done:
        statusColor = AppTheme.successColor;
        statusText = 'Done';
        break;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.darkCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.darkDivider),
      ),
      child: Row(
        children: [
          Container(
            width: 4,
            height: 40,
            decoration: BoxDecoration(
              color: statusColor,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  task.title,
                  style: const TextStyle(fontWeight: FontWeight.w600),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  'Due: ${Formatters.dateShort(task.dueDate)}',
                  style: TextStyle(
                    color: AppTheme.darkTextSecondary,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: statusColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              statusText,
              style: TextStyle(
                color: statusColor,
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _PayslipCard extends StatelessWidget {
  final Payslip payslip;

  const _PayslipCard({required this.payslip});

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
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.darkCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.darkDivider),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: AppTheme.successColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.receipt_long, color: AppTheme.successColor),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _formatMonthDisplay(payslip.month),
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 4),
                Text(
                  'Generated: ${Formatters.dateShort(payslip.generatedAt)}',
                  style: TextStyle(
                    color: AppTheme.darkTextSecondary,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          Text(
            Formatters.currency(payslip.netPay),
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              color: AppTheme.successColor,
              fontSize: 16,
            ),
          ),
        ],
      ),
    );
  }
}

class _LoadingCard extends StatelessWidget {
  const _LoadingCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: AppTheme.darkCard,
        borderRadius: BorderRadius.circular(12),
      ),
      child: const Center(child: CircularProgressIndicator()),
    );
  }
}

class _EmptyState extends StatelessWidget {
  final IconData icon;
  final String message;

  const _EmptyState({required this.icon, required this.message});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppTheme.darkCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.darkDivider),
      ),
      child: Column(
        children: [
          Icon(icon, size: 40, color: AppTheme.darkTextTertiary),
          const SizedBox(height: 12),
          Text(message, style: TextStyle(color: AppTheme.darkTextSecondary)),
        ],
      ),
    );
  }
}

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
