import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../core/firebase/firestore_service.dart';
import '../../../core/models/employee.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';
import '../../../routes/app_router.dart';

class EmployeeProfileScreen extends StatelessWidget {
  const EmployeeProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final firestoreService = context.read<FirestoreService>();
    final user = authProvider.appUser;

    if (user == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Profile header
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppTheme.darkCard,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.darkDivider),
              ),
              child: Column(
                children: [
                  // Avatar
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: AppTheme.primaryYellow.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Center(
                      child: Text(
                        user.name[0].toUpperCase(),
                        style: const TextStyle(
                          color: AppTheme.primaryYellow,
                          fontWeight: FontWeight.bold,
                          fontSize: 32,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    user.name,
                    style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    user.email,
                    style: TextStyle(
                      color: AppTheme.darkTextSecondary,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryYellow.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Text(
                      'Employee',
                      style: TextStyle(
                        color: AppTheme.primaryYellow,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Employee details
            FutureBuilder<Employee?>(
              future: firestoreService.getEmployeeByUid(user.uid),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return Container(
                    padding: const EdgeInsets.all(32),
                    decoration: BoxDecoration(
                      color: AppTheme.darkCard,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Center(child: CircularProgressIndicator()),
                  );
                }

                final employee = snapshot.data;

                if (employee == null) {
                  return Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: AppTheme.warningColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: AppTheme.warningColor.withValues(alpha: 0.3),
                      ),
                    ),
                    child: Column(
                      children: [
                        Icon(
                          Icons.info_outline,
                          color: AppTheme.warningColor,
                          size: 40,
                        ),
                        const SizedBox(height: 12),
                        Text(
                          'Employee Profile Not Found',
                          style: TextStyle(
                            color: AppTheme.warningColor,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Please contact your administrator to set up your employee profile.',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: AppTheme.darkTextSecondary,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  );
                }

                return Column(
                  children: [
                    // Work details card
                    Container(
                      decoration: BoxDecoration(
                        color: AppTheme.darkCard,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppTheme.darkDivider),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Padding(
                            padding: const EdgeInsets.all(16),
                            child: Text(
                              'Work Details',
                              style: TextStyle(
                                color: AppTheme.darkTextSecondary,
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ),
                          _DetailTile(
                            icon: Icons.business,
                            label: 'Department',
                            value: employee.department,
                          ),
                          _DetailTile(
                            icon: Icons.currency_rupee,
                            label: 'Monthly Salary',
                            value: Formatters.currency(employee.salary),
                          ),
                          _DetailTile(
                            icon: Icons.access_time,
                            label: 'Overtime Hours',
                            value: '${employee.overtimeHours} hours',
                            showDivider: false,
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Compensation card
                    Container(
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
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Estimated Monthly Compensation',
                            style: TextStyle(
                              color: AppTheme.darkTextSecondary,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 12),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Base',
                                    style: TextStyle(
                                      color: AppTheme.darkTextTertiary,
                                      fontSize: 11,
                                    ),
                                  ),
                                  Text(
                                    Formatters.currency(employee.salary),
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w600,
                                      fontSize: 15,
                                    ),
                                  ),
                                ],
                              ),
                              const Text(
                                '+',
                                style: TextStyle(
                                  color: AppTheme.darkTextSecondary,
                                  fontSize: 18,
                                ),
                              ),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'OT Pay',
                                    style: TextStyle(
                                      color: AppTheme.darkTextTertiary,
                                      fontSize: 11,
                                    ),
                                  ),
                                  Text(
                                    Formatters.currency(
                                      employee.overtimeHours * 150.0,
                                    ),
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w600,
                                      color: AppTheme.successColor,
                                      fontSize: 15,
                                    ),
                                  ),
                                ],
                              ),
                              const Text(
                                '=',
                                style: TextStyle(
                                  color: AppTheme.darkTextSecondary,
                                  fontSize: 18,
                                ),
                              ),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text(
                                    'Total',
                                    style: TextStyle(
                                      color: AppTheme.darkTextTertiary,
                                      fontSize: 11,
                                    ),
                                  ),
                                  Text(
                                    Formatters.currency(
                                      employee.salary +
                                          (employee.overtimeHours * 150.0),
                                    ),
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      color: AppTheme.primaryYellow,
                                      fontSize: 17,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                );
              },
            ),

            const SizedBox(height: 24),

            // Settings section
            Container(
              decoration: BoxDecoration(
                color: AppTheme.darkCard,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.darkDivider),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Text(
                      'Settings',
                      style: TextStyle(
                        color: AppTheme.darkTextSecondary,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                  _SettingsTile(
                    icon: Icons.notifications_outlined,
                    label: 'Notifications',
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Coming soon!')),
                      );
                    },
                  ),
                  _SettingsTile(
                    icon: Icons.lock_outline,
                    label: 'Change Password',
                    onTap: () {
                      _showChangePasswordDialog(context);
                    },
                  ),
                  _SettingsTile(
                    icon: Icons.help_outline,
                    label: 'Help & Support',
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Coming soon!')),
                      );
                    },
                    showDivider: false,
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Logout button
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () => _showLogoutDialog(context),
                icon: const Icon(Icons.logout, color: AppTheme.errorColor),
                label: const Text(
                  'Log Out',
                  style: TextStyle(color: AppTheme.errorColor),
                ),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: AppTheme.errorColor),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
              ),
            ),

            const SizedBox(height: 100),
          ],
        ),
      ),
    );
  }

  void _showChangePasswordDialog(BuildContext context) {
    final authProvider = context.read<AuthProvider>();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Change Password'),
        content: const Text(
          'We will send a password reset link to your email address.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              try {
                await authProvider.resetPassword(authProvider.appUser!.email);
                if (context.mounted) {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Password reset email sent!'),
                      backgroundColor: AppTheme.successColor,
                    ),
                  );
                }
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Error: $e'),
                      backgroundColor: AppTheme.errorColor,
                    ),
                  );
                }
              }
            },
            child: const Text('Send Link'),
          ),
        ],
      ),
    );
  }

  void _showLogoutDialog(BuildContext context) {
    final authProvider = context.read<AuthProvider>();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Log Out'),
        content: const Text('Are you sure you want to log out?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              await authProvider.signOut();
              if (context.mounted) {
                context.go(AppRouter.login);
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.errorColor,
            ),
            child: const Text('Log Out'),
          ),
        ],
      ),
    );
  }
}

class _DetailTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final bool showDivider;

  const _DetailTile({
    required this.icon,
    required this.label,
    required this.value,
    this.showDivider = true,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        ListTile(
          leading: Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AppTheme.primaryYellow.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: AppTheme.primaryYellow, size: 20),
          ),
          title: Text(
            label,
            style: TextStyle(color: AppTheme.darkTextSecondary, fontSize: 12),
          ),
          subtitle: Text(
            value,
            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
          ),
        ),
        if (showDivider)
          Divider(height: 1, indent: 72, color: AppTheme.darkDivider),
      ],
    );
  }
}

class _SettingsTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool showDivider;

  const _SettingsTile({
    required this.icon,
    required this.label,
    required this.onTap,
    this.showDivider = true,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        ListTile(
          leading: Icon(icon, color: AppTheme.darkTextSecondary),
          title: Text(label),
          trailing: Icon(Icons.chevron_right, color: AppTheme.darkTextTertiary),
          onTap: onTap,
        ),
        if (showDivider)
          Divider(height: 1, indent: 56, color: AppTheme.darkDivider),
      ],
    );
  }
}
