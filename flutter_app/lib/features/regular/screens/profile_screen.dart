import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../core/firebase/firestore_service.dart';
import '../../../core/models/user.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';
import '../../../routes/app_router.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final user = authProvider.appUser;

    if (user == null) {
      return const Center(child: CircularProgressIndicator());
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            onPressed: () => _showSettingsSheet(context),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Profile header
            _ProfileHeader(user: user),
            const SizedBox(height: 24),

            // Account info section
            _SectionCard(
              title: 'Account Information',
              children: [
                _InfoTile(
                  icon: Icons.person_outline,
                  label: 'Name',
                  value: user.name,
                  onTap: () => _editName(context, user),
                ),
                _InfoTile(
                  icon: Icons.email_outlined,
                  label: 'Email',
                  value: user.email,
                ),
                _InfoTile(
                  icon: Icons.badge_outlined,
                  label: 'Account Type',
                  value: _getRoleDisplayName(user.role),
                ),
                _InfoTile(
                  icon: Icons.calendar_today_outlined,
                  label: 'Member Since',
                  value: Formatters.dateFull(user.createdAt),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // App section
            _SectionCard(
              title: 'App',
              children: [
                _ActionTile(
                  icon: Icons.palette_outlined,
                  label: 'Theme',
                  trailing: const Text('Dark'),
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Theme settings coming soon'),
                      ),
                    );
                  },
                ),
                _ActionTile(
                  icon: Icons.notifications_outlined,
                  label: 'Notifications',
                  trailing: Switch(
                    value: true,
                    onChanged: (value) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Notification settings coming soon'),
                        ),
                      );
                    },
                    activeThumbColor: AppTheme.primaryYellow,
                  ),
                  onTap: () {},
                ),
                _ActionTile(
                  icon: Icons.language_outlined,
                  label: 'Language',
                  trailing: const Text('English'),
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Language settings coming soon'),
                      ),
                    );
                  },
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Security section
            _SectionCard(
              title: 'Security',
              children: [
                _ActionTile(
                  icon: Icons.lock_outline,
                  label: 'Change Password',
                  onTap: () => _changePassword(context),
                ),
                _ActionTile(
                  icon: Icons.fingerprint,
                  label: 'Biometric Lock',
                  trailing: Switch(
                    value: false,
                    onChanged: (value) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Biometric lock coming soon'),
                        ),
                      );
                    },
                    activeThumbColor: AppTheme.primaryYellow,
                  ),
                  onTap: () {},
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Support section
            _SectionCard(
              title: 'Support',
              children: [
                _ActionTile(
                  icon: Icons.help_outline,
                  label: 'Help Center',
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Help center coming soon')),
                    );
                  },
                ),
                _ActionTile(
                  icon: Icons.bug_report_outlined,
                  label: 'Report a Bug',
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Bug report coming soon')),
                    );
                  },
                ),
                _ActionTile(
                  icon: Icons.info_outline,
                  label: 'About',
                  onTap: () => _showAboutDialog(context),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Logout button
            SizedBox(
              width: double.infinity,
              height: 52,
              child: OutlinedButton.icon(
                onPressed: () => _confirmLogout(context),
                icon: const Icon(Icons.logout, color: AppTheme.errorColor),
                label: const Text(
                  'Log Out',
                  style: TextStyle(color: AppTheme.errorColor),
                ),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: AppTheme.errorColor),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Version
            Text(
              'Version 1.0.0',
              style: TextStyle(color: AppTheme.darkTextTertiary, fontSize: 12),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  String _getRoleDisplayName(UserRole role) {
    switch (role) {
      case UserRole.regular:
        return 'Regular User';
      case UserRole.authority:
        return 'Company Authority';
      case UserRole.employee:
        return 'Employee';
    }
  }

  void _showSettingsSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Settings', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 24),
            ListTile(
              leading: const Icon(Icons.download_outlined),
              title: const Text('Export Data'),
              subtitle: const Text('Download your financial data'),
              onTap: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Export feature coming soon')),
                );
              },
            ),
            ListTile(
              leading: const Icon(
                Icons.delete_outline,
                color: AppTheme.errorColor,
              ),
              title: const Text(
                'Delete Account',
                style: TextStyle(color: AppTheme.errorColor),
              ),
              subtitle: const Text('Permanently delete your account'),
              onTap: () {
                Navigator.pop(context);
                _confirmDeleteAccount(context);
              },
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _editName(BuildContext context, AppUser user) async {
    final controller = TextEditingController(text: user.name);
    final firestoreService = context.read<FirestoreService>();
    final messenger = ScaffoldMessenger.of(context);
    final result = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Edit Name'),
        content: TextField(
          controller: controller,
          autofocus: true,
          textCapitalization: TextCapitalization.words,
          decoration: const InputDecoration(
            labelText: 'Name',
            prefixIcon: Icon(Icons.person_outline),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              if (controller.text.trim().isNotEmpty) {
                Navigator.pop(context, controller.text.trim());
              }
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );

    if (result != null && result != user.name) {
      await firestoreService.updateUser(user.uid, {'name': result});
      if (context.mounted) {
        messenger.showSnackBar(
          const SnackBar(
            content: Text('Name updated'),
            backgroundColor: AppTheme.successColor,
          ),
        );
      }
    }
  }

  Future<void> _changePassword(BuildContext context) async {
    final authProvider = context.read<AuthProvider>();

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Change Password'),
        content: const Text(
          'We will send a password reset email to your registered email address.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Send Email'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await authProvider.sendPasswordResetEmail(authProvider.appUser!.email);
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Password reset email sent'),
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
    }
  }

  void _showAboutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppTheme.primaryYellow.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(
                Icons.account_balance_wallet,
                color: AppTheme.primaryYellow,
              ),
            ),
            const SizedBox(width: 12),
            const Text('FinanceApp'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'A comprehensive financial management app with role-based access.',
            ),
            const SizedBox(height: 16),
            Text(
              'Version 1.0.0',
              style: TextStyle(color: AppTheme.darkTextSecondary),
            ),
            const SizedBox(height: 8),
            Text(
              '© 2024 FinanceApp',
              style: TextStyle(color: AppTheme.darkTextTertiary),
            ),
          ],
        ),
        actions: [
          ElevatedButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  Future<void> _confirmLogout(BuildContext context) async {
    final authProvider = context.read<AuthProvider>();
    final router = GoRouter.of(context);
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
        router.go(AppRouter.login);
      }
    }
  }

  Future<void> _confirmDeleteAccount(BuildContext context) async {
    final messenger = ScaffoldMessenger.of(context);
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Account'),
        content: const Text(
          'This action cannot be undone. All your data will be permanently deleted. Are you sure?',
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
            child: const Text('Delete Forever'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      messenger.showSnackBar(
        const SnackBar(content: Text('Account deletion feature coming soon')),
      );
    }
  }
}

class _ProfileHeader extends StatelessWidget {
  final AppUser user;

  const _ProfileHeader({required this.user});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Avatar
        Container(
          width: 100,
          height: 100,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: LinearGradient(
              colors: [
                AppTheme.primaryYellow,
                AppTheme.primaryYellow.withValues(alpha: 0.7),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          child: Center(
            child: Text(
              user.name.isNotEmpty ? user.name[0].toUpperCase() : 'U',
              style: const TextStyle(
                fontSize: 40,
                fontWeight: FontWeight.bold,
                color: AppTheme.amoledBlack,
              ),
            ),
          ),
        ),
        const SizedBox(height: 16),
        Text(
          user.name,
          style: Theme.of(
            context,
          ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 4),
        Text(
          user.email,
          style: TextStyle(color: AppTheme.darkTextSecondary, fontSize: 14),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: AppTheme.primaryYellow.withValues(alpha: 0.2),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(
            _getRoleDisplayName(user.role),
            style: const TextStyle(
              color: AppTheme.primaryYellow,
              fontWeight: FontWeight.w500,
              fontSize: 12,
            ),
          ),
        ),
      ],
    );
  }

  String _getRoleDisplayName(UserRole role) {
    switch (role) {
      case UserRole.regular:
        return 'Regular User';
      case UserRole.authority:
        return 'Company Authority';
      case UserRole.employee:
        return 'Employee';
    }
  }
}

class _SectionCard extends StatelessWidget {
  final String title;
  final List<Widget> children;

  const _SectionCard({required this.title, required this.children});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.darkCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.darkDivider),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Text(
              title,
              style: TextStyle(
                color: AppTheme.darkTextSecondary,
                fontSize: 12,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.5,
              ),
            ),
          ),
          ...children,
        ],
      ),
    );
  }
}

class _InfoTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final VoidCallback? onTap;

  const _InfoTile({
    required this.icon,
    required this.label,
    required this.value,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: AppTheme.darkTextSecondary),
      title: Text(
        label,
        style: TextStyle(color: AppTheme.darkTextSecondary, fontSize: 12),
      ),
      subtitle: Text(
        value,
        style: const TextStyle(color: Colors.white, fontSize: 15),
      ),
      trailing: onTap != null
          ? const Icon(Icons.edit, size: 18, color: AppTheme.primaryYellow)
          : null,
      onTap: onTap,
    );
  }
}

class _ActionTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final Widget? trailing;
  final VoidCallback onTap;

  const _ActionTile({
    required this.icon,
    required this.label,
    this.trailing,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: AppTheme.darkTextSecondary),
      title: Text(label),
      trailing: trailing ?? const Icon(Icons.chevron_right),
      onTap: onTap,
    );
  }
}
