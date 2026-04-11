import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../core/firebase/firestore_service.dart';
import '../../../core/models/employee.dart';
import '../../../core/models/project.dart';
import '../../../core/models/task.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';
import '../../../routes/app_router.dart';

class ProjectDetailScreen extends StatefulWidget {
  final String projectId;

  const ProjectDetailScreen({super.key, required this.projectId});

  @override
  State<ProjectDetailScreen> createState() => _ProjectDetailScreenState();
}

class _ProjectDetailScreenState extends State<ProjectDetailScreen> {
  @override
  Widget build(BuildContext context) {
    final firestoreService = context.read<FirestoreService>();

    return StreamBuilder<List<Project>>(
      stream: firestoreService.projectsStream(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return Scaffold(
            appBar: AppBar(title: const Text('Project Details')),
            body: const Center(child: CircularProgressIndicator()),
          );
        }

        final projects = snapshot.data ?? [];
        final project = projects.firstWhere(
          (p) => p.id == widget.projectId,
          orElse: () => Project(
            title: 'Not Found',
            status: ProjectStatus.pending,
            kpiPercent: 0,
            assignedEmployeeIds: [],
            deadline: DateTime.now(),
            createdBy: '',
          ),
        );

        if (project.title == 'Not Found') {
          return Scaffold(
            appBar: AppBar(title: const Text('Project Details')),
            body: const Center(child: Text('Project not found')),
          );
        }

        return _buildContent(context, project);
      },
    );
  }

  Widget _buildContent(BuildContext context, Project project) {
    final firestoreService = context.read<FirestoreService>();
    final statusColor = _getStatusColor(project.status);
    final isOverdue =
        project.deadline.isBefore(DateTime.now()) &&
        project.status != ProjectStatus.completed;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Project Details'),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit),
            onPressed: () => _editProject(project),
          ),
          PopupMenuButton(
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'status',
                child: Row(
                  children: [
                    Icon(Icons.flag_outlined, size: 20),
                    SizedBox(width: 12),
                    Text('Change Status'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'delete',
                child: Row(
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
              ),
            ],
            onSelected: (value) {
              if (value == 'status') _showStatusDialog(project);
              if (value == 'delete') _confirmDelete(project);
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Project header
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppTheme.darkCard,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.darkDivider),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: statusColor.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(Icons.work, color: statusColor, size: 24),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              project.title,
                              style: Theme.of(context).textTheme.titleLarge
                                  ?.copyWith(fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 4),
                            Row(
                              children: [
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
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                                if (isOverdue) ...[
                                  const SizedBox(width: 8),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 8,
                                      vertical: 4,
                                    ),
                                    decoration: BoxDecoration(
                                      color: AppTheme.errorColor.withValues(
                                        alpha: 0.15,
                                      ),
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: const Text(
                                      'Overdue',
                                      style: TextStyle(
                                        color: AppTheme.errorColor,
                                        fontSize: 12,
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
                    ],
                  ),
                  // Description
                  if (project.description.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppTheme.amoledBlack,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: AppTheme.darkDivider),
                      ),
                      child: Text(
                        project.description,
                        style: TextStyle(
                          color: AppTheme.darkTextSecondary,
                          fontSize: 14,
                          height: 1.5,
                        ),
                      ),
                    ),
                  ],
                  const SizedBox(height: 20),
                  // Progress
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Progress',
                        style: TextStyle(
                          color: AppTheme.darkTextSecondary,
                          fontSize: 14,
                        ),
                      ),
                      Text(
                        '${project.kpiPercent.toStringAsFixed(0)}%',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 18,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: LinearProgressIndicator(
                      value: project.kpiPercent / 100,
                      backgroundColor: AppTheme.darkDivider,
                      valueColor: AlwaysStoppedAnimation<Color>(
                        AppTheme.getBudgetStatusColor(project.kpiPercent),
                      ),
                      minHeight: 10,
                    ),
                  ),
                  const SizedBox(height: 16),
                  // Update progress slider
                  Row(
                    children: [
                      Expanded(
                        child: Slider(
                          value: project.kpiPercent,
                          min: 0,
                          max: 100,
                          divisions: 100,
                          activeColor: AppTheme.primaryYellow,
                          onChanged: (value) {
                            _updateProgress(project, value);
                          },
                        ),
                      ),
                      TextButton(
                        onPressed: () => _updateProgress(project, 100),
                        child: const Text('Complete'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Info cards
            Row(
              children: [
                Expanded(
                  child: _InfoCard(
                    icon: Icons.calendar_today,
                    label: 'Deadline',
                    value: Formatters.dateShort(project.deadline),
                    color: isOverdue ? AppTheme.errorColor : AppTheme.infoColor,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _InfoCard(
                    icon: Icons.people,
                    label: 'Team Size',
                    value: '${project.assignedEmployeeIds.length} members',
                    color: AppTheme.primaryYellow,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Team section
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Team Members',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                TextButton.icon(
                  onPressed: () => _manageTeam(project),
                  icon: const Icon(Icons.edit, size: 18),
                  label: const Text('Manage'),
                ),
              ],
            ),
            const SizedBox(height: 12),

            if (project.assignedEmployeeIds.isEmpty)
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: AppTheme.darkCard,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.darkDivider),
                ),
                child: Column(
                  children: [
                    Icon(
                      Icons.people_outline,
                      size: 48,
                      color: AppTheme.darkTextTertiary,
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'No team members assigned',
                      style: TextStyle(color: AppTheme.darkTextSecondary),
                    ),
                    const SizedBox(height: 12),
                    OutlinedButton(
                      onPressed: () => _manageTeam(project),
                      child: const Text('Assign Team'),
                    ),
                  ],
                ),
              )
            else
              StreamBuilder<List<Employee>>(
                stream: firestoreService.employeesStream(),
                builder: (context, snapshot) {
                  final allEmployees = snapshot.data ?? [];
                  final teamMembers = allEmployees
                      .where((e) => project.assignedEmployeeIds.contains(e.id))
                      .toList();

                  return Column(
                    children: teamMembers.map((employee) {
                      return _TeamMemberCard(employee: employee);
                    }).toList(),
                  );
                },
              ),
            const SizedBox(height: 24),

            // Tasks section
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Tasks',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                TextButton.icon(
                  onPressed: () => _addTask(project),
                  icon: const Icon(Icons.add, size: 18),
                  label: const Text('Add Task'),
                ),
              ],
            ),
            const SizedBox(height: 12),

            StreamBuilder<List<Task>>(
              stream: firestoreService.allTasksStream(),
              builder: (context, snapshot) {
                final allTasks = snapshot.data ?? [];
                final projectTasks = allTasks
                    .where((t) => t.projectId == project.id)
                    .toList();

                if (projectTasks.isEmpty) {
                  return Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: AppTheme.darkCard,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppTheme.darkDivider),
                    ),
                    child: Column(
                      children: [
                        Icon(
                          Icons.task_outlined,
                          size: 48,
                          color: AppTheme.darkTextTertiary,
                        ),
                        const SizedBox(height: 12),
                        Text(
                          'No tasks created yet',
                          style: TextStyle(color: AppTheme.darkTextSecondary),
                        ),
                        const SizedBox(height: 12),
                        OutlinedButton(
                          onPressed: () => _addTask(project),
                          child: const Text('Create Task'),
                        ),
                      ],
                    ),
                  );
                }

                return Column(
                  children: projectTasks.map((task) {
                    return _TaskCard(
                      task: task,
                      onStatusChanged: (status) =>
                          _updateTaskStatus(task, status),
                      onDelete: () => _deleteTask(task),
                    );
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

  void _editProject(Project project) {
    final titleController = TextEditingController(text: project.title);

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Edit Project'),
        content: TextField(
          controller: titleController,
          decoration: const InputDecoration(
            labelText: 'Project Title',
            prefixIcon: Icon(Icons.work_outline),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              final firestoreService = context.read<FirestoreService>();
              final nav = Navigator.of(context);
              try {
                await firestoreService.updateProject(
                  project.id!,
                  project.copyWith(title: titleController.text.trim()),
                );
                if (mounted) nav.pop();
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(
                    context,
                  ).showSnackBar(SnackBar(content: Text('Error: $e')));
                }
              }
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  void _showStatusDialog(Project project) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Change Status'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: ProjectStatus.values.map((status) {
            final color = _getStatusColor(status);
            final isSelected = project.status == status;

            return GestureDetector(
              onTap: () async {
                final firestoreService = context.read<FirestoreService>();
                final nav = Navigator.of(context);
                final messenger = ScaffoldMessenger.of(context);
                try {
                  await firestoreService.updateProject(
                    project.id!,
                    project.copyWith(status: status),
                  );
                  if (mounted) nav.pop();
                } catch (e) {
                  if (mounted) {
                    messenger.showSnackBar(
                      SnackBar(content: Text('Error: $e')),
                    );
                  }
                }
              },
              child: Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isSelected
                      ? color.withValues(alpha: 0.15)
                      : AppTheme.darkCard,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isSelected ? color : AppTheme.darkDivider,
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      isSelected
                          ? Icons.check_circle
                          : Icons.radio_button_unchecked,
                      color: color,
                    ),
                    const SizedBox(width: 12),
                    Text(
                      _getStatusLabel(status),
                      style: TextStyle(
                        color: isSelected ? color : Colors.white,
                        fontWeight: isSelected
                            ? FontWeight.w600
                            : FontWeight.normal,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }

  void _confirmDelete(Project project) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Project'),
        content: Text('Are you sure you want to delete "${project.title}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              final firestoreService = context.read<FirestoreService>();
              final nav = Navigator.of(context);
              final router = GoRouter.of(context);
              final messenger = ScaffoldMessenger.of(context);
              try {
                await firestoreService.deleteProject(project.id!);
                if (mounted) {
                  nav.pop();
                  router.go(AppRouter.projects);
                }
              } catch (e) {
                if (mounted) {
                  messenger.showSnackBar(SnackBar(content: Text('Error: $e')));
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
  }

  void _updateProgress(Project project, double value) async {
    final firestoreService = context.read<FirestoreService>();
    try {
      await firestoreService.updateProject(
        project.id!,
        project.copyWith(kpiPercent: value),
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  void _manageTeam(Project project) {
    final firestoreService = context.read<FirestoreService>();
    List<String> selectedIds = List.from(project.assignedEmployeeIds);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => StatefulBuilder(
        builder: (context, setSheetState) => DraggableScrollableSheet(
          initialChildSize: 0.7,
          maxChildSize: 0.9,
          minChildSize: 0.5,
          expand: false,
          builder: (context, scrollController) => Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Manage Team',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    TextButton(
                      onPressed: () async {
                        final nav = Navigator.of(context);
                        final messenger = ScaffoldMessenger.of(context);
                        try {
                          await firestoreService.updateProject(
                            project.id!,
                            project.copyWith(assignedEmployeeIds: selectedIds),
                          );
                          if (mounted) nav.pop();
                        } catch (e) {
                          if (mounted) {
                            messenger.showSnackBar(
                              SnackBar(content: Text('Error: $e')),
                            );
                          }
                        }
                      },
                      child: const Text('Save'),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Expanded(
                  child: StreamBuilder<List<Employee>>(
                    stream: firestoreService.employeesStream(),
                    builder: (context, snapshot) {
                      final employees = snapshot.data ?? [];

                      return ListView.builder(
                        controller: scrollController,
                        itemCount: employees.length,
                        itemBuilder: (context, index) {
                          final employee = employees[index];
                          final isSelected = selectedIds.contains(employee.id);

                          return CheckboxListTile(
                            value: isSelected,
                            onChanged: (value) {
                              if (employee.id == null) return;
                              setSheetState(() {
                                if (value == true) {
                                  selectedIds.add(employee.id!);
                                } else {
                                  selectedIds.remove(employee.id);
                                }
                              });
                            },
                            activeColor: AppTheme.primaryYellow,
                            checkColor: AppTheme.amoledBlack,
                            title: Text(employee.name),
                            subtitle: Text(employee.department),
                          );
                        },
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _addTask(Project project) {
    final titleController = TextEditingController();
    String? selectedEmployeeId;
    DateTime dueDate = DateTime.now().add(const Duration(days: 7));

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (dialogContext, setDialogState) => AlertDialog(
          title: const Text('Add Task'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: titleController,
                  decoration: const InputDecoration(
                    labelText: 'Task Title',
                    prefixIcon: Icon(Icons.task_outlined),
                  ),
                ),
                const SizedBox(height: 16),
                StreamBuilder<List<Employee>>(
                  stream: context.read<FirestoreService>().employeesStream(),
                  builder: (context, snapshot) {
                    final employees = (snapshot.data ?? [])
                        .where(
                          (e) => project.assignedEmployeeIds.contains(e.id),
                        )
                        .toList();

                    return DropdownButtonFormField<String>(
                      initialValue: selectedEmployeeId,
                      decoration: const InputDecoration(
                        labelText: 'Assign To',
                        prefixIcon: Icon(Icons.person_outline),
                      ),
                      items: employees
                          .map(
                            (e) => DropdownMenuItem(
                              value: e.id,
                              child: Text(e.name),
                            ),
                          )
                          .toList(),
                      onChanged: (value) {
                        setDialogState(() => selectedEmployeeId = value);
                      },
                    );
                  },
                ),
                const SizedBox(height: 16),
                GestureDetector(
                  onTap: () async {
                    final picked = await showDatePicker(
                      context: context,
                      initialDate: dueDate,
                      firstDate: DateTime.now(),
                      lastDate: DateTime.now().add(const Duration(days: 365)),
                    );
                    if (picked != null) {
                      setDialogState(() => dueDate = picked);
                    }
                  },
                  child: InputDecorator(
                    decoration: const InputDecoration(
                      labelText: 'Due Date',
                      prefixIcon: Icon(Icons.calendar_today),
                    ),
                    child: Text(Formatters.dateShort(dueDate)),
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
              onPressed: () async {
                if (titleController.text.isEmpty ||
                    selectedEmployeeId == null) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Please fill all fields')),
                  );
                  return;
                }

                final task = Task(
                  employeeId: selectedEmployeeId!,
                  title: titleController.text.trim(),
                  status: TaskStatus.pending,
                  dueDate: dueDate,
                  projectId: project.id!,
                );

                try {
                  final firestoreService = context.read<FirestoreService>();
                  final nav = Navigator.of(context);
                  await firestoreService.addTask(task);
                  if (mounted) nav.pop();
                } catch (e) {
                  if (mounted) {
                    ScaffoldMessenger.of(
                      context,
                    ).showSnackBar(SnackBar(content: Text('Error: $e')));
                  }
                }
              },
              child: const Text('Add'),
            ),
          ],
        ),
      ),
    );
  }

  void _updateTaskStatus(Task task, TaskStatus status) async {
    try {
      await context.read<FirestoreService>().updateTaskStatus(task.id!, status);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  void _deleteTask(Task task) async {
    final firestoreService = context.read<FirestoreService>();
    final messenger = ScaffoldMessenger.of(context);
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Task'),
        content: Text('Delete "${task.title}"?'),
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
      try {
        await firestoreService.deleteTask(task.id!);
      } catch (e) {
        if (mounted) {
          messenger.showSnackBar(SnackBar(content: Text('Error: $e')));
        }
      }
    }
  }
}

class _InfoCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _InfoCard({
    required this.icon,
    required this.label,
    required this.value,
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
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(height: 8),
          Text(
            label,
            style: TextStyle(color: AppTheme.darkTextSecondary, fontSize: 12),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
          ),
        ],
      ),
    );
  }
}

class _TeamMemberCard extends StatelessWidget {
  final Employee employee;

  const _TeamMemberCard({required this.employee});

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
                  style: const TextStyle(fontWeight: FontWeight.w600),
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
        ],
      ),
    );
  }
}

class _TaskCard extends StatelessWidget {
  final Task task;
  final ValueChanged<TaskStatus> onStatusChanged;
  final VoidCallback onDelete;

  const _TaskCard({
    required this.task,
    required this.onStatusChanged,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final statusColor = _getTaskStatusColor(task.status);

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppTheme.darkCard,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: task.isOverdue
              ? AppTheme.errorColor.withValues(alpha: 0.5)
              : AppTheme.darkDivider,
        ),
      ),
      child: Row(
        children: [
          GestureDetector(
            onTap: () {
              final nextStatus = _getNextStatus(task.status);
              onStatusChanged(nextStatus);
            },
            child: Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: statusColor.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                _getStatusIcon(task.status),
                color: statusColor,
                size: 18,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  task.title,
                  style: TextStyle(
                    fontWeight: FontWeight.w500,
                    decoration: task.status == TaskStatus.done
                        ? TextDecoration.lineThrough
                        : null,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: statusColor.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        _getTaskStatusLabel(task.status),
                        style: TextStyle(
                          color: statusColor,
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Icon(
                      Icons.calendar_today,
                      size: 12,
                      color: task.isOverdue
                          ? AppTheme.errorColor
                          : AppTheme.darkTextTertiary,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      Formatters.dateShort(task.dueDate),
                      style: TextStyle(
                        color: task.isOverdue
                            ? AppTheme.errorColor
                            : AppTheme.darkTextSecondary,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.delete_outline, size: 20),
            onPressed: onDelete,
            color: AppTheme.darkTextTertiary,
          ),
        ],
      ),
    );
  }

  Color _getTaskStatusColor(TaskStatus status) {
    switch (status) {
      case TaskStatus.pending:
        return AppTheme.warningColor;
      case TaskStatus.inProgress:
        return AppTheme.infoColor;
      case TaskStatus.done:
        return AppTheme.successColor;
    }
  }

  String _getTaskStatusLabel(TaskStatus status) {
    switch (status) {
      case TaskStatus.pending:
        return 'Pending';
      case TaskStatus.inProgress:
        return 'In Progress';
      case TaskStatus.done:
        return 'Done';
    }
  }

  IconData _getStatusIcon(TaskStatus status) {
    switch (status) {
      case TaskStatus.pending:
        return Icons.radio_button_unchecked;
      case TaskStatus.inProgress:
        return Icons.timelapse;
      case TaskStatus.done:
        return Icons.check_circle;
    }
  }

  TaskStatus _getNextStatus(TaskStatus current) {
    switch (current) {
      case TaskStatus.pending:
        return TaskStatus.inProgress;
      case TaskStatus.inProgress:
        return TaskStatus.done;
      case TaskStatus.done:
        return TaskStatus.pending;
    }
  }
}
