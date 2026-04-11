import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../core/firebase/firestore_service.dart';
import '../../../core/models/employee.dart';
import '../../../core/models/notification.dart';
import '../../../core/models/project.dart';
import '../../../core/models/payslip.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';
import '../../../routes/app_router.dart';

class AuthorityDashboardScreen extends StatelessWidget {
  const AuthorityDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final firestoreService = context.read<FirestoreService>();
    final user = authProvider.appUser;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        actions: [
          if (user != null)
            _NotificationBellButton(
              notificationsRoute: AppRouter.authorityNotifications,
              uid: user.uid,
            ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              final confirmed = await showDialog<bool>(
                context: context,
                builder: (context) => AlertDialog(
                  title: const Text('Log Out'),
                  content: const Text('Are you sure you want to log out?'),
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
                      child: const Text('Log Out'),
                    ),
                  ],
                ),
              );
              if (confirmed == true) {
                await authProvider.signOut();
                if (context.mounted) {
                  context.go(AppRouter.login);
                }
              }
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Welcome header
            _WelcomeHeader(userName: user?.name ?? 'Authority'),
            const SizedBox(height: 24),

            // Stats overview
            StreamBuilder<List<Employee>>(
              stream: firestoreService.employeesStream(),
              builder: (context, employeeSnapshot) {
                return StreamBuilder<List<Project>>(
                  stream: firestoreService.projectsStream(),
                  builder: (context, projectSnapshot) {
                    return StreamBuilder<List<Payslip>>(
                      stream: firestoreService.allPayslipsStream(),
                      builder: (context, payslipSnapshot) {
                        final employees = employeeSnapshot.data ?? [];
                        final projects = projectSnapshot.data ?? [];
                        final payslips = payslipSnapshot.data ?? [];

                        final activeProjects = projects
                            .where((p) => p.status == ProjectStatus.active)
                            .length;
                        final pendingPayslips = payslips.length;
                        final totalSalary = employees.fold<double>(
                          0,
                          (sum, e) => sum + e.salary,
                        );

                        return Column(
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: _StatCard(
                                    icon: Icons.people,
                                    label: 'Employees',
                                    value: employees.length.toString(),
                                    color: AppTheme.infoColor,
                                    onTap: () =>
                                        context.go(AppRouter.employees),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: _StatCard(
                                    icon: Icons.work,
                                    label: 'Active Projects',
                                    value: activeProjects.toString(),
                                    color: AppTheme.successColor,
                                    onTap: () => context.go(AppRouter.projects),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                Expanded(
                                  child: _StatCard(
                                    icon: Icons.payment,
                                    label: 'Payslips',
                                    value: pendingPayslips.toString(),
                                    color: AppTheme.warningColor,
                                    onTap: () => context.go(AppRouter.payslips),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: _StatCard(
                                    icon: Icons.account_balance_wallet,
                                    label: 'Total Payroll',
                                    value: Formatters.currencyCompact(
                                      totalSalary,
                                    ),
                                    color: AppTheme.primaryYellow,
                                    onTap: () => context.go(AppRouter.payslips),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        );
                      },
                    );
                  },
                );
              },
            ),
            const SizedBox(height: 24),

            // Quick actions
            Text(
              'Quick Actions',
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _QuickActionCard(
                    icon: Icons.person_add,
                    label: 'Add Employee',
                    onTap: () => context.go(AppRouter.addEmployee),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _QuickActionCard(
                    icon: Icons.add_task,
                    label: 'New Project',
                    onTap: () => context.go(AppRouter.addProject),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _QuickActionCard(
                    icon: Icons.receipt_long,
                    label: 'Payslips',
                    onTap: () => context.go(AppRouter.generatePayslip),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Recent projects
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Recent Projects',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                TextButton(
                  onPressed: () => context.go(AppRouter.projects),
                  child: const Text('View All'),
                ),
              ],
            ),
            const SizedBox(height: 8),
            StreamBuilder<List<Project>>(
              stream: firestoreService.projectsStream(),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(
                    child: Padding(
                      padding: EdgeInsets.all(24),
                      child: CircularProgressIndicator(),
                    ),
                  );
                }

                final projects = snapshot.data ?? [];
                if (projects.isEmpty) {
                  return _EmptyState(
                    icon: Icons.work_outline,
                    message: 'No projects yet',
                    actionLabel: 'Create Project',
                    onAction: () => context.go(AppRouter.addProject),
                  );
                }

                // Show only first 3 projects
                final recentProjects = projects.take(3).toList();

                return Column(
                  children: recentProjects.map((project) {
                    return _ProjectCard(
                      project: project,
                      onTap: () =>
                          context.go('/authority/projects/${project.id}'),
                    );
                  }).toList(),
                );
              },
            ),
            const SizedBox(height: 24),

            // Recent employees
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Recent Employees',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                TextButton(
                  onPressed: () => context.go(AppRouter.employees),
                  child: const Text('View All'),
                ),
              ],
            ),
            const SizedBox(height: 8),
            StreamBuilder<List<Employee>>(
              stream: firestoreService.employeesStream(),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(
                    child: Padding(
                      padding: EdgeInsets.all(24),
                      child: CircularProgressIndicator(),
                    ),
                  );
                }

                final employees = snapshot.data ?? [];
                if (employees.isEmpty) {
                  return _EmptyState(
                    icon: Icons.people_outline,
                    message: 'No employees yet',
                    actionLabel: 'Add Employee',
                    onAction: () => context.go(AppRouter.addEmployee),
                  );
                }

                // Show only first 5 employees
                final recentEmployees = employees.take(5).toList();

                return Column(
                  children: recentEmployees.map((employee) {
                    return _EmployeeListTile(employee: employee);
                  }).toList(),
                );
              },
            ),
            const SizedBox(height: 32),
          ],
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
    final greeting = _getGreeting();

    return Container(
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
        border: Border.all(color: AppTheme.primaryYellow.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppTheme.primaryYellow.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.admin_panel_settings,
              color: AppTheme.primaryYellow,
              size: 32,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  greeting,
                  style: TextStyle(
                    color: AppTheme.darkTextSecondary,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  userName,
                  style: Theme.of(
                    context,
                  ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 2),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryYellow.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Text(
                    'Company Authority',
                    style: TextStyle(
                      color: AppTheme.primaryYellow,
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;
  final VoidCallback onTap;

  const _StatCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppTheme.darkCard,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppTheme.darkDivider),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(height: 12),
            Text(
              value,
              style: Theme.of(
                context,
              ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: TextStyle(color: AppTheme.darkTextSecondary, fontSize: 12),
            ),
          ],
        ),
      ),
    );
  }
}

class _QuickActionCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _QuickActionCard({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
        decoration: BoxDecoration(
          color: AppTheme.darkCard,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.darkDivider),
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppTheme.primaryYellow.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: AppTheme.primaryYellow, size: 22),
            ),
            const SizedBox(height: 8),
            Text(
              label,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 12),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProjectCard extends StatelessWidget {
  final Project project;
  final VoidCallback onTap;

  const _ProjectCard({required this.project, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final statusColor = _getStatusColor(project.status);

    return GestureDetector(
      onTap: onTap,
      child: Container(
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
              children: [
                Expanded(
                  child: Text(
                    project.title,
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 15,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    _getStatusLabel(project.status),
                    style: TextStyle(
                      color: statusColor,
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Icon(
                  Icons.people_outline,
                  size: 14,
                  color: AppTheme.darkTextTertiary,
                ),
                const SizedBox(width: 4),
                Text(
                  '${project.assignedEmployeeIds.length} assigned',
                  style: TextStyle(
                    color: AppTheme.darkTextSecondary,
                    fontSize: 12,
                  ),
                ),
                const SizedBox(width: 16),
                Icon(
                  Icons.calendar_today,
                  size: 14,
                  color: AppTheme.darkTextTertiary,
                ),
                const SizedBox(width: 4),
                Text(
                  Formatters.dateShort(project.deadline),
                  style: TextStyle(
                    color: AppTheme.darkTextSecondary,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: project.kpiPercent / 100,
                backgroundColor: AppTheme.darkDivider,
                valueColor: AlwaysStoppedAnimation<Color>(
                  AppTheme.getBudgetStatusColor(project.kpiPercent),
                ),
                minHeight: 6,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              '${project.kpiPercent.toStringAsFixed(0)}% complete',
              style: TextStyle(color: AppTheme.darkTextTertiary, fontSize: 11),
            ),
          ],
        ),
      ),
    );
  }

  Color _getStatusColor(ProjectStatus status) {
    switch (status) {
      case ProjectStatus.pending:
        return AppTheme.warningColor;
      case ProjectStatus.active:
        return AppTheme.infoColor;
      case ProjectStatus.completed:
        return AppTheme.successColor;
    }
  }

  String _getStatusLabel(ProjectStatus status) {
    switch (status) {
      case ProjectStatus.pending:
        return 'Pending';
      case ProjectStatus.active:
        return 'Active';
      case ProjectStatus.completed:
        return 'Completed';
    }
  }
}

class _EmployeeListTile extends StatelessWidget {
  final Employee employee;

  const _EmployeeListTile({required this.employee});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppTheme.darkCard,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppTheme.darkDivider),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AppTheme.primaryYellow.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Center(
              child: Text(
                employee.name.isNotEmpty ? employee.name[0].toUpperCase() : 'E',
                style: const TextStyle(
                  color: AppTheme.primaryYellow,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  employee.name,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
                Text(
                  employee.department,
                  style: TextStyle(
                    color: AppTheme.darkTextSecondary,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          Text(
            Formatters.currencyCompact(employee.salary),
            style: const TextStyle(
              fontWeight: FontWeight.w600,
              color: AppTheme.primaryYellow,
              fontSize: 13,
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
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: AppTheme.darkCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.darkDivider),
      ),
      child: Column(
        children: [
          Icon(icon, size: 48, color: AppTheme.darkTextTertiary),
          const SizedBox(height: 12),
          Text(
            message,
            style: TextStyle(color: AppTheme.darkTextSecondary, fontSize: 14),
          ),
          const SizedBox(height: 16),
          OutlinedButton(onPressed: onAction, child: Text(actionLabel)),
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
