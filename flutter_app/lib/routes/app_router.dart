import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../core/providers/auth_provider.dart';
import '../core/models/user.dart';

// Auth screens
import '../features/auth/screens/splash_screen.dart';
import '../features/auth/screens/login_screen.dart';
import '../features/auth/screens/register_screen.dart';

// Regular user screens
import '../features/regular/screens/regular_dashboard_screen.dart';
import '../features/regular/screens/transactions_screen.dart';
import '../features/regular/screens/add_transaction_screen.dart';
import '../features/regular/screens/budgets_screen.dart';
import '../features/regular/screens/profile_screen.dart';
import '../features/regular/screens/notifications_screen.dart';

// Admin screens (previously authority)
import '../features/authority/screens/authority_dashboard_screen.dart';
import '../features/authority/screens/employees_screen.dart';
import '../features/authority/screens/add_employee_screen.dart';
import '../features/authority/screens/projects_screen.dart';
import '../features/authority/screens/add_project_screen.dart';
import '../features/authority/screens/project_detail_screen.dart';
import '../features/authority/screens/payslips_screen.dart';
import '../features/authority/screens/generate_payslip_screen.dart';

// Employee screens
import '../features/employee/screens/employee_dashboard_screen.dart';
import '../features/employee/screens/my_tasks_screen.dart';
import '../features/employee/screens/my_payslips_screen.dart';
import '../features/employee/screens/employee_profile_screen.dart';

class AppRouter {
  // Route names
  static const String splash = '/';
  static const String login = '/login';
  static const String register = '/register';

  // Regular user routes
  static const String regularDashboard = '/regular';
  static const String transactions = '/regular/transactions';
  static const String addTransaction = '/regular/transactions/add';
  static const String budgets = '/regular/budgets';
  static const String profile = '/regular/profile';

  // Admin routes (full management)
  static const String adminDashboard = '/admin';
  static const String employees = '/admin/employees';
  static const String addEmployee = '/admin/employees/add';
  static const String projects = '/admin/projects';
  static const String addProject = '/admin/projects/add';
  static const String projectDetail = '/admin/projects/:projectId';
  static const String payslips = '/admin/payslips';
  static const String generatePayslip = '/admin/payslips/generate';

  // HR routes (employee + payslip management)
  static const String hrDashboard = '/hr';
  static const String hrEmployees = '/hr/employees';
  static const String hrAddEmployee = '/hr/employees/add';
  static const String hrPayslips = '/hr/payslips';
  static const String hrGeneratePayslip = '/hr/payslips/generate';

  // Employee routes
  static const String employeeDashboard = '/employee';
  static const String myTasks = '/employee/tasks';
  static const String myPayslips = '/employee/payslips';
  static const String employeeProfile = '/employee/profile';

  // Shared notification routes
  static const String regularNotifications = '/regular/notifications';
  static const String adminNotifications = '/admin/notifications';
  static const String hrNotifications = '/hr/notifications';
  static const String employeeNotifications = '/employee/notifications';

  /// Returns the correct route for shared management screens based on user role.
  /// HR screens mirror admin screens but under /hr prefix.
  static String employeesFor(UserRole role) =>
      role == UserRole.hr ? hrEmployees : employees;
  static String addEmployeeFor(UserRole role) =>
      role == UserRole.hr ? hrAddEmployee : addEmployee;
  static String payslipsFor(UserRole role) =>
      role == UserRole.hr ? hrPayslips : payslips;
  static String generatePayslipFor(UserRole role) =>
      role == UserRole.hr ? hrGeneratePayslip : generatePayslip;

  GoRouter router(AuthProvider authProvider) {
    return GoRouter(
      initialLocation: splash,
      refreshListenable: authProvider,
      redirect: (context, state) {
        final status = authProvider.status;
        final isLoggingIn =
            state.matchedLocation == login || state.matchedLocation == register;
        final isSplash = state.matchedLocation == splash;

        // Show splash while initializing
        if (status == AuthStatus.uninitialized) {
          return isSplash ? null : splash;
        }

        // If not authenticated, redirect to login
        if (status == AuthStatus.unauthenticated) {
          return isLoggingIn ? null : login;
        }

        // If authenticated, redirect based on role
        if (status == AuthStatus.authenticated) {
          final user = authProvider.appUser;

          // If still on auth pages, redirect to appropriate dashboard
          if (isLoggingIn || isSplash) {
            return _getDashboardForRole(user?.role);
          }

          // Validate user is accessing their own role's routes
          if (user != null) {
            final location = state.matchedLocation;

            if (user.role == UserRole.regular &&
                !location.startsWith('/regular')) {
              return regularDashboard;
            }

            if (user.role == UserRole.admin &&
                !location.startsWith('/admin')) {
              return adminDashboard;
            }

            if (user.role == UserRole.hr &&
                !location.startsWith('/hr')) {
              return hrDashboard;
            }

            if (user.role == UserRole.employee &&
                !location.startsWith('/employee')) {
              return employeeDashboard;
            }
          }
        }

        return null;
      },
      routes: [
        // ============ AUTH ROUTES ============
        GoRoute(
          path: splash,
          name: 'splash',
          builder: (context, state) => const SplashScreen(),
        ),
        GoRoute(
          path: login,
          name: 'login',
          builder: (context, state) => const LoginScreen(),
        ),
        GoRoute(
          path: register,
          name: 'register',
          builder: (context, state) => const RegisterScreen(),
        ),

        // ============ REGULAR USER ROUTES ============
        ShellRoute(
          builder: (context, state, child) {
            return RegularShell(child: child);
          },
          routes: [
            GoRoute(
              path: regularDashboard,
              name: 'regularDashboard',
              builder: (context, state) => const RegularDashboardScreen(),
            ),
            GoRoute(
              path: transactions,
              name: 'transactions',
              builder: (context, state) => const TransactionsScreen(),
            ),
            GoRoute(
              path: addTransaction,
              name: 'addTransaction',
              builder: (context, state) => const AddTransactionScreen(),
            ),
            GoRoute(
              path: budgets,
              name: 'budgets',
              builder: (context, state) => const BudgetsScreen(),
            ),
            GoRoute(
              path: profile,
              name: 'profile',
              builder: (context, state) => const ProfileScreen(),
            ),
            GoRoute(
              path: regularNotifications,
              name: 'regularNotifications',
              builder: (context, state) => const NotificationsScreen(),
            ),
          ],
        ),

        // ============ ADMIN ROUTES ============
        ShellRoute(
          builder: (context, state, child) {
            return AdminShell(child: child);
          },
          routes: [
            GoRoute(
              path: adminDashboard,
              name: 'adminDashboard',
              builder: (context, state) => const AuthorityDashboardScreen(),
            ),
            GoRoute(
              path: employees,
              name: 'employees',
              builder: (context, state) => const EmployeesScreen(),
            ),
            GoRoute(
              path: addEmployee,
              name: 'addEmployee',
              builder: (context, state) => const AddEmployeeScreen(),
            ),
            GoRoute(
              path: projects,
              name: 'projects',
              builder: (context, state) => const ProjectsScreen(),
            ),
            GoRoute(
              path: addProject,
              name: 'addProject',
              builder: (context, state) => const AddProjectScreen(),
            ),
            GoRoute(
              path: projectDetail,
              name: 'projectDetail',
              builder: (context, state) {
                final projectId = state.pathParameters['projectId']!;
                return ProjectDetailScreen(projectId: projectId);
              },
            ),
            GoRoute(
              path: payslips,
              name: 'payslips',
              builder: (context, state) => const PayslipsScreen(),
            ),
            GoRoute(
              path: generatePayslip,
              name: 'generatePayslip',
              builder: (context, state) => const GeneratePayslipScreen(),
            ),
            GoRoute(
              path: adminNotifications,
              name: 'adminNotifications',
              builder: (context, state) => const NotificationsScreen(),
            ),
          ],
        ),

        // ============ HR ROUTES ============
        ShellRoute(
          builder: (context, state, child) {
            return HRShell(child: child);
          },
          routes: [
            GoRoute(
              path: hrDashboard,
              name: 'hrDashboard',
              builder: (context, state) => const AuthorityDashboardScreen(),
            ),
            GoRoute(
              path: hrEmployees,
              name: 'hrEmployees',
              builder: (context, state) => const EmployeesScreen(),
            ),
            GoRoute(
              path: hrAddEmployee,
              name: 'hrAddEmployee',
              builder: (context, state) => const AddEmployeeScreen(),
            ),
            GoRoute(
              path: hrPayslips,
              name: 'hrPayslips',
              builder: (context, state) => const PayslipsScreen(),
            ),
            GoRoute(
              path: hrGeneratePayslip,
              name: 'hrGeneratePayslip',
              builder: (context, state) => const GeneratePayslipScreen(),
            ),
            GoRoute(
              path: hrNotifications,
              name: 'hrNotifications',
              builder: (context, state) => const NotificationsScreen(),
            ),
          ],
        ),

        // ============ EMPLOYEE ROUTES ============
        ShellRoute(
          builder: (context, state, child) {
            return EmployeeShell(child: child);
          },
          routes: [
            GoRoute(
              path: employeeDashboard,
              name: 'employeeDashboard',
              builder: (context, state) => const EmployeeDashboardScreen(),
            ),
            GoRoute(
              path: myTasks,
              name: 'myTasks',
              builder: (context, state) => const MyTasksScreen(),
            ),
            GoRoute(
              path: myPayslips,
              name: 'myPayslips',
              builder: (context, state) => const MyPayslipsScreen(),
            ),
            GoRoute(
              path: employeeProfile,
              name: 'employeeProfile',
              builder: (context, state) => const EmployeeProfileScreen(),
            ),
            GoRoute(
              path: employeeNotifications,
              name: 'employeeNotifications',
              builder: (context, state) => const NotificationsScreen(),
            ),
          ],
        ),
      ],
      errorBuilder: (context, state) => ErrorScreen(error: state.error),
    );
  }

  String _getDashboardForRole(UserRole? role) {
    switch (role) {
      case UserRole.admin:
        return adminDashboard;
      case UserRole.hr:
        return hrDashboard;
      case UserRole.employee:
        return employeeDashboard;
      case UserRole.regular:
      default:
        return regularDashboard;
    }
  }
}

// ============ SHELL WIDGETS ============

/// Shell for Regular User with bottom navigation
class RegularShell extends StatelessWidget {
  final Widget child;

  const RegularShell({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _getSelectedIndex(context),
        onDestinationSelected: (index) =>
            _onDestinationSelected(context, index),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          NavigationDestination(
            icon: Icon(Icons.receipt_long_outlined),
            selectedIcon: Icon(Icons.receipt_long),
            label: 'Transactions',
          ),
          NavigationDestination(
            icon: Icon(Icons.pie_chart_outline),
            selectedIcon: Icon(Icons.pie_chart),
            label: 'Budgets',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
    );
  }

  int _getSelectedIndex(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    if (location.startsWith(AppRouter.transactions)) return 1;
    if (location.startsWith(AppRouter.budgets)) return 2;
    if (location.startsWith(AppRouter.profile)) return 3;
    return 0;
  }

  void _onDestinationSelected(BuildContext context, int index) {
    switch (index) {
      case 0:
        context.go(AppRouter.regularDashboard);
        break;
      case 1:
        context.go(AppRouter.transactions);
        break;
      case 2:
        context.go(AppRouter.budgets);
        break;
      case 3:
        context.go(AppRouter.profile);
        break;
    }
  }
}

/// Shell for Admin with bottom navigation
class AdminShell extends StatelessWidget {
  final Widget child;

  const AdminShell({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _getSelectedIndex(context),
        onDestinationSelected: (index) =>
            _onDestinationSelected(context, index),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          NavigationDestination(
            icon: Icon(Icons.people_outline),
            selectedIcon: Icon(Icons.people),
            label: 'Employees',
          ),
          NavigationDestination(
            icon: Icon(Icons.work_outline),
            selectedIcon: Icon(Icons.work),
            label: 'Projects',
          ),
          NavigationDestination(
            icon: Icon(Icons.payment_outlined),
            selectedIcon: Icon(Icons.payment),
            label: 'Payslips',
          ),
        ],
      ),
    );
  }

  int _getSelectedIndex(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    if (location.startsWith(AppRouter.employees)) return 1;
    if (location.startsWith(AppRouter.projects)) return 2;
    if (location.startsWith(AppRouter.payslips)) return 3;
    return 0;
  }

  void _onDestinationSelected(BuildContext context, int index) {
    switch (index) {
      case 0:
        context.go(AppRouter.adminDashboard);
        break;
      case 1:
        context.go(AppRouter.employees);
        break;
      case 2:
        context.go(AppRouter.projects);
        break;
      case 3:
        context.go(AppRouter.payslips);
        break;
    }
  }
}

/// Shell for HR with bottom navigation
class HRShell extends StatelessWidget {
  final Widget child;

  const HRShell({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _getSelectedIndex(context),
        onDestinationSelected: (index) =>
            _onDestinationSelected(context, index),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          NavigationDestination(
            icon: Icon(Icons.people_outline),
            selectedIcon: Icon(Icons.people),
            label: 'Employees',
          ),
          NavigationDestination(
            icon: Icon(Icons.payment_outlined),
            selectedIcon: Icon(Icons.payment),
            label: 'Payslips',
          ),
        ],
      ),
    );
  }

  int _getSelectedIndex(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    if (location.startsWith(AppRouter.hrEmployees)) return 1;
    if (location.startsWith(AppRouter.hrPayslips)) return 2;
    return 0;
  }

  void _onDestinationSelected(BuildContext context, int index) {
    switch (index) {
      case 0:
        context.go(AppRouter.hrDashboard);
        break;
      case 1:
        context.go(AppRouter.hrEmployees);
        break;
      case 2:
        context.go(AppRouter.hrPayslips);
        break;
    }
  }
}

/// Shell for Employee with bottom navigation
class EmployeeShell extends StatelessWidget {
  final Widget child;

  const EmployeeShell({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _getSelectedIndex(context),
        onDestinationSelected: (index) =>
            _onDestinationSelected(context, index),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          NavigationDestination(
            icon: Icon(Icons.task_alt_outlined),
            selectedIcon: Icon(Icons.task_alt),
            label: 'Tasks',
          ),
          NavigationDestination(
            icon: Icon(Icons.receipt_outlined),
            selectedIcon: Icon(Icons.receipt),
            label: 'Payslips',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
    );
  }

  int _getSelectedIndex(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    if (location.startsWith(AppRouter.myTasks)) return 1;
    if (location.startsWith(AppRouter.myPayslips)) return 2;
    if (location.startsWith(AppRouter.employeeProfile)) return 3;
    return 0;
  }

  void _onDestinationSelected(BuildContext context, int index) {
    switch (index) {
      case 0:
        context.go(AppRouter.employeeDashboard);
        break;
      case 1:
        context.go(AppRouter.myTasks);
        break;
      case 2:
        context.go(AppRouter.myPayslips);
        break;
      case 3:
        context.go(AppRouter.employeeProfile);
        break;
    }
  }
}

// ============ ERROR SCREEN ============

class ErrorScreen extends StatelessWidget {
  final Exception? error;

  const ErrorScreen({super.key, this.error});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.error_outline,
                size: 80,
                color: Theme.of(context).colorScheme.error,
              ),
              const SizedBox(height: 24),
              Text(
                'Page Not Found',
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              const SizedBox(height: 12),
              Text(
                error?.toString() ??
                    'The page you are looking for does not exist.',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 32),
              ElevatedButton.icon(
                onPressed: () => context.go('/'),
                icon: const Icon(Icons.home),
                label: const Text('Go Home'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
