import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../core/firebase/firestore_service.dart';
import '../../../core/models/project.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';
import '../../../routes/app_router.dart';

class ProjectsScreen extends StatefulWidget {
  const ProjectsScreen({super.key});

  @override
  State<ProjectsScreen> createState() => _ProjectsScreenState();
}

class _ProjectsScreenState extends State<ProjectsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final firestoreService = context.read<FirestoreService>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Projects'),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          tabAlignment: TabAlignment.start,
          tabs: const [
            Tab(text: 'All'),
            Tab(text: 'Active'),
            Tab(text: 'Pending'),
            Tab(text: 'Completed'),
          ],
        ),
      ),
      body: StreamBuilder<List<Project>>(
        stream: firestoreService.projectsStream(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          }

          final allProjects = snapshot.data ?? [];

          return TabBarView(
            controller: _tabController,
            children: [
              _ProjectList(
                projects: allProjects,
                emptyMessage: 'No projects yet',
              ),
              _ProjectList(
                projects: allProjects
                    .where((p) => p.status == ProjectStatus.active)
                    .toList(),
                emptyMessage: 'No active projects',
              ),
              _ProjectList(
                projects: allProjects
                    .where((p) => p.status == ProjectStatus.pending)
                    .toList(),
                emptyMessage: 'No pending projects',
              ),
              _ProjectList(
                projects: allProjects
                    .where((p) => p.status == ProjectStatus.completed)
                    .toList(),
                emptyMessage: 'No completed projects',
              ),
            ],
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.go(AppRouter.addProject),
        icon: const Icon(Icons.add),
        label: const Text('New Project'),
      ),
    );
  }
}

class _ProjectList extends StatelessWidget {
  final List<Project> projects;
  final String emptyMessage;

  const _ProjectList({required this.projects, required this.emptyMessage});

  @override
  Widget build(BuildContext context) {
    if (projects.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.work_outline,
              size: 64,
              color: AppTheme.darkTextTertiary,
            ),
            const SizedBox(height: 16),
            Text(
              emptyMessage,
              style: TextStyle(color: AppTheme.darkTextSecondary, fontSize: 16),
            ),
            const SizedBox(height: 24),
            OutlinedButton.icon(
              onPressed: () => context.go(AppRouter.addProject),
              icon: const Icon(Icons.add),
              label: const Text('Create Project'),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: projects.length,
      itemBuilder: (context, index) {
        final project = projects[index];
        return _ProjectCard(
          project: project,
          onTap: () => context.go('/admin/projects/${project.id}'),
        );
      },
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
    final isOverdue =
        project.deadline.isBefore(DateTime.now()) &&
        project.status != ProjectStatus.completed;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        decoration: BoxDecoration(
          color: AppTheme.darkCard,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isOverdue
                ? AppTheme.errorColor.withValues(alpha: 0.5)
                : AppTheme.darkDivider,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: statusColor.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(Icons.work, color: statusColor, size: 20),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          project.title,
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 16,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: statusColor.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(4),
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
                            if (isOverdue) ...[
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 2,
                                ),
                                decoration: BoxDecoration(
                                  color: AppTheme.errorColor.withValues(
                                    alpha: 0.15,
                                  ),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: const Text(
                                  'Overdue',
                                  style: TextStyle(
                                    color: AppTheme.errorColor,
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ],
                    ),
                  ),
                  PopupMenuButton(
                    icon: const Icon(Icons.more_vert),
                    itemBuilder: (context) => [
                      PopupMenuItem(
                        value: 'view',
                        onTap: onTap,
                        child: const Row(
                          children: [
                            Icon(Icons.visibility_outlined, size: 20),
                            SizedBox(width: 12),
                            Text('View Details'),
                          ],
                        ),
                      ),
                      PopupMenuItem(
                        value: 'status',
                        child: const Row(
                          children: [
                            Icon(Icons.edit_outlined, size: 20),
                            SizedBox(width: 12),
                            Text('Change Status'),
                          ],
                        ),
                        onTap: () => _showStatusDialog(context, project),
                      ),
                      PopupMenuItem(
                        value: 'delete',
                        child: const Row(
                          children: [
                            Icon(
                              Icons.delete_outline,
                              size: 20,
                              color: AppTheme.errorColor,
                            ),
                            SizedBox(width: 12),
                            Text(
                              'Delete',
                              style: TextStyle(color: AppTheme.errorColor),
                            ),
                          ],
                        ),
                        onTap: () => _confirmDelete(context, project),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Progress
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Progress',
                        style: TextStyle(
                          color: AppTheme.darkTextSecondary,
                          fontSize: 12,
                        ),
                      ),
                      Text(
                        '${project.kpiPercent.toStringAsFixed(0)}%',
                        style: const TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: project.kpiPercent / 100,
                      backgroundColor: AppTheme.darkDivider,
                      valueColor: AlwaysStoppedAnimation<Color>(
                        AppTheme.getBudgetStatusColor(project.kpiPercent),
                      ),
                      minHeight: 8,
                    ),
                  ),
                ],
              ),
            ),

            // Footer info
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  _InfoBadge(
                    icon: Icons.people_outline,
                    label: '${project.assignedEmployeeIds.length} assigned',
                  ),
                  const SizedBox(width: 16),
                  _InfoBadge(
                    icon: Icons.calendar_today,
                    label: Formatters.dateShort(project.deadline),
                    color: isOverdue ? AppTheme.errorColor : null,
                  ),
                ],
              ),
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

  void _showStatusDialog(BuildContext context, Project project) {
    Future.delayed(Duration.zero, () {
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Change Status'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _StatusOption(
                label: 'Pending',
                icon: Icons.pending_outlined,
                color: AppTheme.warningColor,
                isSelected: project.status == ProjectStatus.pending,
                onTap: () =>
                    _updateStatus(context, project, ProjectStatus.pending),
              ),
              const SizedBox(height: 8),
              _StatusOption(
                label: 'Active',
                icon: Icons.play_circle_outline,
                color: AppTheme.infoColor,
                isSelected: project.status == ProjectStatus.active,
                onTap: () =>
                    _updateStatus(context, project, ProjectStatus.active),
              ),
              const SizedBox(height: 8),
              _StatusOption(
                label: 'Completed',
                icon: Icons.check_circle_outline,
                color: AppTheme.successColor,
                isSelected: project.status == ProjectStatus.completed,
                onTap: () =>
                    _updateStatus(context, project, ProjectStatus.completed),
              ),
            ],
          ),
        ),
      );
    });
  }

  void _updateStatus(
    BuildContext context,
    Project project,
    ProjectStatus newStatus,
  ) async {
    final firestoreService = context.read<FirestoreService>();
    final messenger = ScaffoldMessenger.of(context);
    final nav = Navigator.of(context);
    try {
      await firestoreService.updateProject(
        project.id!,
        project.copyWith(status: newStatus),
      );
      if (context.mounted) {
        nav.pop();
        messenger.showSnackBar(
          const SnackBar(
            content: Text('Status updated'),
            backgroundColor: AppTheme.successColor,
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        messenger.showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    }
  }

  void _confirmDelete(BuildContext context, Project project) {
    Future.delayed(Duration.zero, () {
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Delete Project'),
          content: Text(
            'Are you sure you want to delete "${project.title}"? This action cannot be undone.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () async {
                final firestoreService = context.read<FirestoreService>();
                final messenger = ScaffoldMessenger.of(context);
                final nav = Navigator.of(context);
                try {
                  await firestoreService.deleteProject(project.id!);
                  if (context.mounted) {
                    nav.pop();
                    messenger.showSnackBar(
                      const SnackBar(
                        content: Text('Project deleted'),
                        backgroundColor: AppTheme.successColor,
                      ),
                    );
                  }
                } catch (e) {
                  if (context.mounted) {
                    messenger.showSnackBar(
                      SnackBar(
                        content: Text('Error: $e'),
                        backgroundColor: AppTheme.errorColor,
                      ),
                    );
                  }
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.errorColor,
              ),
              child: const Text('Delete'),
            ),
          ],
        ),
      );
    });
  }
}

class _InfoBadge extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color? color;

  const _InfoBadge({required this.icon, required this.label, this.color});

  @override
  Widget build(BuildContext context) {
    final textColor = color ?? AppTheme.darkTextSecondary;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: textColor),
        const SizedBox(width: 4),
        Text(label, style: TextStyle(color: textColor, fontSize: 12)),
      ],
    );
  }
}

class _StatusOption extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  final bool isSelected;
  final VoidCallback onTap;

  const _StatusOption({
    required this.label,
    required this.icon,
    required this.color,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected ? color.withValues(alpha: 0.15) : AppTheme.darkCard,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: isSelected ? color : AppTheme.darkDivider),
        ),
        child: Row(
          children: [
            Icon(icon, color: color),
            const SizedBox(width: 12),
            Text(
              label,
              style: TextStyle(
                color: isSelected ? color : Colors.white,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
              ),
            ),
            const Spacer(),
            if (isSelected) Icon(Icons.check_circle, color: color, size: 20),
          ],
        ),
      ),
    );
  }
}
