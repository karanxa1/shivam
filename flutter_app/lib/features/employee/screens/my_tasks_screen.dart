import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/firebase/firestore_service.dart';
import '../../../core/models/task.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';

class MyTasksScreen extends StatefulWidget {
  const MyTasksScreen({super.key});

  @override
  State<MyTasksScreen> createState() => _MyTasksScreenState();
}

class _MyTasksScreenState extends State<MyTasksScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String _searchQuery = '';

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
    final authProvider = context.watch<AuthProvider>();
    final firestoreService = context.read<FirestoreService>();
    final user = authProvider.appUser;

    if (user == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Tasks'),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          tabs: const [
            Tab(text: 'All'),
            Tab(text: 'Pending'),
            Tab(text: 'In Progress'),
            Tab(text: 'Completed'),
          ],
        ),
      ),
      body: Column(
        children: [
          // Search bar
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              onChanged: (value) => setState(() => _searchQuery = value),
              decoration: InputDecoration(
                hintText: 'Search tasks...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () => setState(() => _searchQuery = ''),
                      )
                    : null,
              ),
            ),
          ),

          // Task list
          Expanded(
            child: StreamBuilder<List<Task>>(
              stream: firestoreService.tasksStream(user.uid),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }

                if (snapshot.hasError) {
                  return Center(child: Text('Error: ${snapshot.error}'));
                }

                final allTasks = snapshot.data ?? [];

                return TabBarView(
                  controller: _tabController,
                  children: [
                    _TaskList(
                      tasks: _filterTasks(allTasks, null),
                      searchQuery: _searchQuery,
                      onStatusChange: (task, status) =>
                          _updateTaskStatus(task, status),
                    ),
                    _TaskList(
                      tasks: _filterTasks(allTasks, TaskStatus.pending),
                      searchQuery: _searchQuery,
                      onStatusChange: (task, status) =>
                          _updateTaskStatus(task, status),
                    ),
                    _TaskList(
                      tasks: _filterTasks(allTasks, TaskStatus.inProgress),
                      searchQuery: _searchQuery,
                      onStatusChange: (task, status) =>
                          _updateTaskStatus(task, status),
                    ),
                    _TaskList(
                      tasks: _filterTasks(allTasks, TaskStatus.done),
                      searchQuery: _searchQuery,
                      onStatusChange: (task, status) =>
                          _updateTaskStatus(task, status),
                    ),
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  List<Task> _filterTasks(List<Task> tasks, TaskStatus? status) {
    var filtered = tasks;
    if (status != null) {
      filtered = filtered.where((t) => t.status == status).toList();
    }
    return filtered;
  }

  Future<void> _updateTaskStatus(Task task, TaskStatus newStatus) async {
    try {
      final firestoreService = context.read<FirestoreService>();
      await firestoreService.updateTaskStatus(task.id!, newStatus);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Task marked as ${_getStatusText(newStatus)}'),
            backgroundColor: AppTheme.successColor,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    }
  }

  String _getStatusText(TaskStatus status) {
    switch (status) {
      case TaskStatus.pending:
        return 'Pending';
      case TaskStatus.inProgress:
        return 'In Progress';
      case TaskStatus.done:
        return 'Done';
    }
  }
}

class _TaskList extends StatelessWidget {
  final List<Task> tasks;
  final String searchQuery;
  final Function(Task, TaskStatus) onStatusChange;

  const _TaskList({
    required this.tasks,
    required this.searchQuery,
    required this.onStatusChange,
  });

  @override
  Widget build(BuildContext context) {
    var filteredTasks = tasks;

    if (searchQuery.isNotEmpty) {
      filteredTasks = filteredTasks.where((t) {
        return t.title.toLowerCase().contains(searchQuery.toLowerCase());
      }).toList();
    }

    if (filteredTasks.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.task_alt, size: 64, color: AppTheme.darkTextTertiary),
              const SizedBox(height: 16),
              Text(
                searchQuery.isNotEmpty
                    ? 'No tasks match your search'
                    : 'No tasks found',
                style: TextStyle(
                  color: AppTheme.darkTextSecondary,
                  fontSize: 16,
                ),
              ),
            ],
          ),
        ),
      );
    }

    // Group tasks by due date
    final overdue = <Task>[];
    final today = <Task>[];
    final upcoming = <Task>[];

    final now = DateTime.now();
    final todayDate = DateTime(now.year, now.month, now.day);

    for (final task in filteredTasks) {
      final dueDate = DateTime(
        task.dueDate.year,
        task.dueDate.month,
        task.dueDate.day,
      );

      if (task.status == TaskStatus.done) {
        upcoming.add(task); // Completed tasks go to upcoming
      } else if (dueDate.isBefore(todayDate)) {
        overdue.add(task);
      } else if (dueDate.isAtSameMomentAs(todayDate)) {
        today.add(task);
      } else {
        upcoming.add(task);
      }
    }

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
      children: [
        if (overdue.isNotEmpty) ...[
          _SectionHeader(
            title: 'Overdue',
            count: overdue.length,
            color: AppTheme.errorColor,
          ),
          ...overdue.map(
            (task) => _TaskCard(task: task, onStatusChange: onStatusChange),
          ),
        ],
        if (today.isNotEmpty) ...[
          _SectionHeader(
            title: 'Today',
            count: today.length,
            color: AppTheme.primaryYellow,
          ),
          ...today.map(
            (task) => _TaskCard(task: task, onStatusChange: onStatusChange),
          ),
        ],
        if (upcoming.isNotEmpty) ...[
          _SectionHeader(
            title: 'Upcoming',
            count: upcoming.length,
            color: AppTheme.successColor,
          ),
          ...upcoming.map(
            (task) => _TaskCard(task: task, onStatusChange: onStatusChange),
          ),
        ],
      ],
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  final int count;
  final Color color;

  const _SectionHeader({
    required this.title,
    required this.count,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        children: [
          Container(
            width: 4,
            height: 16,
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(width: 8),
          Text(
            title,
            style: TextStyle(
              color: AppTheme.darkTextSecondary,
              fontSize: 12,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(
              '$count',
              style: TextStyle(
                color: color,
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

class _TaskCard extends StatelessWidget {
  final Task task;
  final Function(Task, TaskStatus) onStatusChange;

  const _TaskCard({required this.task, required this.onStatusChange});

  @override
  Widget build(BuildContext context) {
    Color statusColor;
    IconData statusIcon;

    switch (task.status) {
      case TaskStatus.pending:
        statusColor = AppTheme.warningColor;
        statusIcon = Icons.radio_button_unchecked;
        break;
      case TaskStatus.inProgress:
        statusColor = AppTheme.primaryYellow;
        statusIcon = Icons.timelapse;
        break;
      case TaskStatus.done:
        statusColor = AppTheme.successColor;
        statusIcon = Icons.check_circle;
        break;
    }

    final isOverdue =
        task.status != TaskStatus.done && task.dueDate.isBefore(DateTime.now());

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppTheme.darkCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isOverdue
              ? AppTheme.errorColor.withValues(alpha: 0.5)
              : AppTheme.darkDivider,
        ),
      ),
      child: Column(
        children: [
          ListTile(
            leading: GestureDetector(
              onTap: () {
                // Cycle through statuses
                TaskStatus newStatus;
                switch (task.status) {
                  case TaskStatus.pending:
                    newStatus = TaskStatus.inProgress;
                    break;
                  case TaskStatus.inProgress:
                    newStatus = TaskStatus.done;
                    break;
                  case TaskStatus.done:
                    newStatus = TaskStatus.pending;
                    break;
                }
                onStatusChange(task, newStatus);
              },
              child: Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(statusIcon, color: statusColor, size: 24),
              ),
            ),
            title: Text(
              task.title,
              style: TextStyle(
                fontWeight: FontWeight.w600,
                decoration: task.status == TaskStatus.done
                    ? TextDecoration.lineThrough
                    : null,
                color: task.status == TaskStatus.done
                    ? AppTheme.darkTextTertiary
                    : null,
              ),
            ),
            subtitle: Row(
              children: [
                Icon(
                  Icons.calendar_today,
                  size: 12,
                  color: isOverdue
                      ? AppTheme.errorColor
                      : AppTheme.darkTextSecondary,
                ),
                const SizedBox(width: 4),
                Text(
                  Formatters.dateShort(task.dueDate),
                  style: TextStyle(
                    color: isOverdue
                        ? AppTheme.errorColor
                        : AppTheme.darkTextSecondary,
                    fontSize: 12,
                  ),
                ),
                if (isOverdue) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 6,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color: AppTheme.errorColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: const Text(
                      'OVERDUE',
                      style: TextStyle(
                        color: AppTheme.errorColor,
                        fontSize: 9,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ],
            ),
            trailing: PopupMenuButton(
              icon: const Icon(Icons.more_vert),
              itemBuilder: (context) => [
                if (task.status != TaskStatus.pending)
                  const PopupMenuItem(
                    value: TaskStatus.pending,
                    child: Row(
                      children: [
                        Icon(Icons.radio_button_unchecked, size: 20),
                        SizedBox(width: 12),
                        Text('Mark Pending'),
                      ],
                    ),
                  ),
                if (task.status != TaskStatus.inProgress)
                  const PopupMenuItem(
                    value: TaskStatus.inProgress,
                    child: Row(
                      children: [
                        Icon(Icons.timelapse, size: 20),
                        SizedBox(width: 12),
                        Text('Mark In Progress'),
                      ],
                    ),
                  ),
                if (task.status != TaskStatus.done)
                  const PopupMenuItem(
                    value: TaskStatus.done,
                    child: Row(
                      children: [
                        Icon(Icons.check_circle, size: 20),
                        SizedBox(width: 12),
                        Text('Mark Done'),
                      ],
                    ),
                  ),
              ],
              onSelected: (status) => onStatusChange(task, status),
            ),
          ),
        ],
      ),
    );
  }
}
