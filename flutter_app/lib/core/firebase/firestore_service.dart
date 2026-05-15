import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_app/core/models/budget.dart';
import 'package:flutter_app/core/models/employee.dart';
import 'package:flutter_app/core/models/notification.dart';
import 'package:flutter_app/core/models/payslip.dart';
import 'package:flutter_app/core/models/project.dart';
import 'package:flutter_app/core/models/task.dart';
import 'package:flutter_app/core/models/transaction.dart' as app_transaction;
import 'package:flutter_app/core/models/user.dart';

class FirestoreService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  FirestoreService() {
    // Enable offline persistence
    _db.settings = const Settings(persistenceEnabled: true);
  }

  // ==================== USER OPERATIONS ====================

  // Get user document
  Future<AppUser?> getUser(String uid) async {
    try {
      final doc = await _db.collection('users').doc(uid).get();
      if (doc.exists) {
        return AppUser.fromFirestore(doc);
      }
      return null;
    } catch (e) {
      debugPrint('Error getting user: $e');
      return null;
    }
  }

  // Create user document
  Future<void> createUser(AppUser user) async {
    try {
      await _db.collection('users').doc(user.uid).set(user.toFirestore());
    } catch (e) {
      debugPrint('Error creating user: $e');
      rethrow;
    }
  }

  // Update user
  Future<void> updateUser(String uid, Map<String, dynamic> data) async {
    try {
      await _db.collection('users').doc(uid).update(data);
    } catch (e) {
      debugPrint('Error updating user: $e');
      rethrow;
    }
  }

  // Listen to user document
  Stream<AppUser?> userStream(String uid) {
    return _db.collection('users').doc(uid).snapshots().map((doc) {
      if (doc.exists) {
        return AppUser.fromFirestore(doc);
      }
      return null;
    });
  }

  // ==================== TRANSACTION OPERATIONS ====================

  // Add transaction
  Future<void> addTransaction(app_transaction.Transaction transaction) async {
    try {
      await _db.collection('transactions').add(transaction.toFirestore());
    } catch (e) {
      debugPrint('Error adding transaction: $e');
      rethrow;
    }
  }

  // Update transaction
  Future<void> updateTransaction(
    String id,
    app_transaction.Transaction transaction,
  ) async {
    try {
      await _db
          .collection('transactions')
          .doc(id)
          .update(transaction.toFirestore());
    } catch (e) {
      debugPrint('Error updating transaction: $e');
      rethrow;
    }
  }

  // Delete transaction
  Future<void> deleteTransaction(String id) async {
    try {
      await _db.collection('transactions').doc(id).delete();
    } catch (e) {
      debugPrint('Error deleting transaction: $e');
      rethrow;
    }
  }

  // Listen to user transactions
  Stream<List<app_transaction.Transaction>> transactionsStream(String userId) {
    return _db
        .collection('transactions')
        .where('userId', isEqualTo: userId)
        .orderBy('date', descending: true)
        .snapshots()
        .map((snapshot) {
          return snapshot.docs
              .map((doc) => app_transaction.Transaction.fromFirestore(doc))
              .toList();
        });
  }

  // Alias for getUserTransactions
  Stream<List<app_transaction.Transaction>> getUserTransactions(String userId) {
    return transactionsStream(userId);
  }

  // ==================== BUDGET OPERATIONS ====================

  // Add or update budget
  Future<void> saveBudget(Budget budget) async {
    try {
      if (budget.id != null) {
        await _db
            .collection('budgets')
            .doc(budget.id)
            .update(budget.toFirestore());
      } else {
        await _db.collection('budgets').add(budget.toFirestore());
      }
    } catch (e) {
      debugPrint('Error saving budget: $e');
      rethrow;
    }
  }

  // Delete budget
  Future<void> deleteBudget(String id) async {
    try {
      await _db.collection('budgets').doc(id).delete();
    } catch (e) {
      debugPrint('Error deleting budget: $e');
      rethrow;
    }
  }

  // Listen to user budgets for current month
  Stream<List<Budget>> budgetsStream(String userId, String month) {
    return _db
        .collection('budgets')
        .where('userId', isEqualTo: userId)
        .where('month', isEqualTo: month)
        .snapshots()
        .map((snapshot) {
          return snapshot.docs.map((doc) => Budget.fromFirestore(doc)).toList();
        });
  }

  // Get all budgets for user (any month)
  Stream<List<Budget>> getUserBudgets(String userId) {
    return _db
        .collection('budgets')
        .where('userId', isEqualTo: userId)
        .snapshots()
        .map((snapshot) {
          return snapshot.docs.map((doc) => Budget.fromFirestore(doc)).toList();
        });
  }

  // ==================== EMPLOYEE OPERATIONS ====================

  // Add employee
  Future<void> addEmployee(Employee employee) async {
    try {
      await _db.collection('employees').add(employee.toFirestore());
    } catch (e) {
      debugPrint('Error adding employee: $e');
      rethrow;
    }
  }

  // Update employee
  Future<void> updateEmployee(String id, Employee employee) async {
    try {
      await _db.collection('employees').doc(id).update(employee.toFirestore());
    } catch (e) {
      debugPrint('Error updating employee: $e');
      rethrow;
    }
  }

  // Delete employee
  Future<void> deleteEmployee(String id) async {
    try {
      await _db.collection('employees').doc(id).delete();
    } catch (e) {
      debugPrint('Error deleting employee: $e');
      rethrow;
    }
  }

  // Get employee by UID
  Future<Employee?> getEmployeeByUid(String uid) async {
    try {
      final snapshot = await _db
          .collection('employees')
          .where('uid', isEqualTo: uid)
          .limit(1)
          .get();
      if (snapshot.docs.isNotEmpty) {
        return Employee.fromFirestore(snapshot.docs.first);
      }
      return null;
    } catch (e) {
      debugPrint('Error getting employee: $e');
      return null;
    }
  }

  // Listen to all employees
  Stream<List<Employee>> employeesStream() {
    return _db.collection('employees').snapshots().map((snapshot) {
      return snapshot.docs.map((doc) => Employee.fromFirestore(doc)).toList();
    });
  }

  // ==================== PROJECT OPERATIONS ====================

  // Add project
  Future<void> addProject(Project project) async {
    try {
      await _db.collection('projects').add(project.toFirestore());
    } catch (e) {
      debugPrint('Error adding project: $e');
      rethrow;
    }
  }

  // Update project
  Future<void> updateProject(String id, Project project) async {
    try {
      await _db.collection('projects').doc(id).update(project.toFirestore());
    } catch (e) {
      debugPrint('Error updating project: $e');
      rethrow;
    }
  }

  // Delete project
  Future<void> deleteProject(String id) async {
    try {
      await _db.collection('projects').doc(id).delete();
    } catch (e) {
      debugPrint('Error deleting project: $e');
      rethrow;
    }
  }

  // Listen to all projects
  Stream<List<Project>> projectsStream() {
    return _db.collection('projects').snapshots().map((snapshot) {
      return snapshot.docs.map((doc) => Project.fromFirestore(doc)).toList();
    });
  }

  // ==================== TASK OPERATIONS ====================

  // Add task
  Future<void> addTask(Task task) async {
    try {
      await _db.collection('tasks').add(task.toFirestore());
      // Notify the assigned employee
      try {
        final empSnap = await _db
            .collection('employees')
            .doc(task.employeeId)
            .get();
        if (empSnap.exists) {
          final empData = empSnap.data() as Map<String, dynamic>;
          final uid = empData['uid'] as String?;
          if (uid != null && uid.isNotEmpty) {
            await createNotification(
              targetUid: uid,
              type: 'task_assigned',
              title: 'New Task Assigned',
              body: 'You have been assigned: ${task.title}',
            );
          }
        }
      } catch (e) {
        debugPrint('Error creating task notification: $e');
      }
    } catch (e) {
      debugPrint('Error adding task: $e');
      rethrow;
    }
  }

  // Update task
  Future<void> updateTask(String id, Task task) async {
    try {
      await _db.collection('tasks').doc(id).update(task.toFirestore());
    } catch (e) {
      debugPrint('Error updating task: $e');
      rethrow;
    }
  }

  // Update task status
  Future<void> updateTaskStatus(String id, TaskStatus status) async {
    try {
      final statusString = status == TaskStatus.inProgress
          ? 'inProgress'
          : status == TaskStatus.done
          ? 'done'
          : 'pending';

      await _db.collection('tasks').doc(id).update({'status': statusString});

      // When task is done, notify the employee themselves
      if (status == TaskStatus.done) {
        try {
          final taskDoc = await _db.collection('tasks').doc(id).get();
          if (taskDoc.exists) {
            final taskData = taskDoc.data() as Map<String, dynamic>;
            final employeeId = taskData['employeeId'] as String?;
            final taskTitle = taskData['title'] as String? ?? 'a task';
            if (employeeId != null) {
              final empSnap = await _db
                  .collection('employees')
                  .doc(employeeId)
                  .get();
              if (empSnap.exists) {
                final empData = empSnap.data() as Map<String, dynamic>;
                final uid = empData['uid'] as String?;
                if (uid != null && uid.isNotEmpty) {
                  await createNotification(
                    targetUid: uid,
                    type: 'task_status_changed',
                    title: 'Task Completed',
                    body: '"$taskTitle" has been marked as done.',
                  );
                }
              }
            }
          }
        } catch (e) {
          debugPrint('Error creating task done notification: $e');
        }
      }
    } catch (e) {
      debugPrint('Error updating task status: $e');
      rethrow;
    }
  }

  // Delete task
  Future<void> deleteTask(String id) async {
    try {
      await _db.collection('tasks').doc(id).delete();
    } catch (e) {
      debugPrint('Error deleting task: $e');
      rethrow;
    }
  }

  // Listen to employee tasks
  Stream<List<Task>> tasksStream(String employeeId) {
    return _db
        .collection('tasks')
        .where('employeeId', isEqualTo: employeeId)
        .orderBy('dueDate')
        .snapshots()
        .map((snapshot) {
          return snapshot.docs.map((doc) => Task.fromFirestore(doc)).toList();
        });
  }

  // Listen to all tasks
  Stream<List<Task>> allTasksStream() {
    return _db.collection('tasks').orderBy('dueDate').snapshots().map((
      snapshot,
    ) {
      return snapshot.docs.map((doc) => Task.fromFirestore(doc)).toList();
    });
  }

  // ==================== PAYSLIP OPERATIONS ====================

  // Add payslip
  Future<void> addPayslip(Payslip payslip) async {
    try {
      await _db.collection('payslips').add(payslip.toFirestore());
      // Notify employee
      try {
        final empSnap = await _db
            .collection('employees')
            .doc(payslip.employeeId)
            .get();
        if (empSnap.exists) {
          final empData = empSnap.data() as Map<String, dynamic>;
          final uid = empData['uid'] as String?;
          if (uid != null && uid.isNotEmpty) {
            await createNotification(
              targetUid: uid,
              type: 'payslip_generated',
              title: 'Payslip Generated',
              body: 'Your payslip for ${payslip.month} is ready',
            );
          }
        }
      } catch (e) {
        debugPrint('Error creating payslip notification: $e');
      }
    } catch (e) {
      debugPrint('Error adding payslip: $e');
      rethrow;
    }
  }

  // Update payslip
  Future<void> updatePayslip(String id, Payslip payslip) async {
    try {
      await _db.collection('payslips').doc(id).update(payslip.toFirestore());
    } catch (e) {
      debugPrint('Error updating payslip: $e');
      rethrow;
    }
  }

  // Delete payslip
  Future<void> deletePayslip(String id) async {
    try {
      await _db.collection('payslips').doc(id).delete();
    } catch (e) {
      debugPrint('Error deleting payslip: $e');
      rethrow;
    }
  }

  // Listen to employee payslips
  Stream<List<Payslip>> payslipsStream(String employeeId) {
    return _db
        .collection('payslips')
        .where('employeeId', isEqualTo: employeeId)
        .orderBy('month', descending: true)
        .snapshots()
        .map((snapshot) {
          return snapshot.docs
              .map((doc) => Payslip.fromFirestore(doc))
              .toList();
        });
  }

  // Listen to all payslips
  Stream<List<Payslip>> allPayslipsStream() {
    return _db
        .collection('payslips')
        .orderBy('month', descending: true)
        .snapshots()
        .map((snapshot) {
          return snapshot.docs
              .map((doc) => Payslip.fromFirestore(doc))
              .toList();
        });
  }

  // Get payslip for employee and month
  Future<Payslip?> getPayslipForMonth(String employeeId, String month) async {
    try {
      final snapshot = await _db
          .collection('payslips')
          .where('employeeId', isEqualTo: employeeId)
          .where('month', isEqualTo: month)
          .limit(1)
          .get();

      if (snapshot.docs.isNotEmpty) {
        return Payslip.fromFirestore(snapshot.docs.first);
      }
      return null;
    } catch (e) {
      debugPrint('Error getting payslip: $e');
      return null;
    }
  }

  // Generate payslips for all employees for given month
  Future<void> generateAllPayslips(
    List<Employee> employees,
    String month,
  ) async {
    try {
      final batch = _db.batch();

      for (final employee in employees) {
        if (employee.id == null) continue;
        // Check if payslip already exists (use Firestore doc ID, not uid)
        final existing = await getPayslipForMonth(employee.id!, month);
        if (existing != null) continue;

        // Generate payslip using Firestore document ID as employeeId
        final payslip = Payslip.generate(
          employeeId: employee.id!,
          month: month,
          basicSalary: employee.salary,
          overtimeHours: employee.overtimeHours,
          deductions: 1000, // Default deduction
        );

        final docRef = _db.collection('payslips').doc();
        batch.set(docRef, payslip.toFirestore());
      }

      await batch.commit();
    } catch (e) {
      debugPrint('Error generating payslips: $e');
      rethrow;
    }
  }

  // Listen to tasks for an employee using their Firebase Auth UID.
  // Resolves auth UID → employee doc ID so the query matches webapp-created tasks.
  Stream<List<Task>> tasksStreamByUserUid(String userUid) {
    return _db
        .collection('employees')
        .where('uid', isEqualTo: userUid)
        .limit(1)
        .snapshots()
        .asyncExpand<List<Task>>((snapshot) {
          if (snapshot.docs.isEmpty) return const Stream.empty();
          final employeeDocId = snapshot.docs.first.id;
          return tasksStream(employeeDocId);
        });
  }

  Future<List<Task>> getTasksByUserUid(String userUid) async {
    final empSnapshot = await _db
        .collection('employees')
        .where('uid', isEqualTo: userUid)
        .limit(1)
        .get();
    if (empSnapshot.docs.isEmpty) return [];
    final employeeDocId = empSnapshot.docs.first.id;
    final snapshot = await _db
        .collection('employees')
        .doc(employeeDocId)
        .collection('tasks')
        .orderBy('dueDate')
        .get();
    return snapshot.docs.map((d) => Task.fromFirestore(d)).toList();
  }

  // Listen to payslips for an employee using their Firebase Auth UID.
  // Resolves auth UID → employee doc ID so the query matches webapp-generated payslips.
  Stream<List<Payslip>> payslipsStreamByUserUid(String userUid) {
    return _db
        .collection('employees')
        .where('uid', isEqualTo: userUid)
        .limit(1)
        .snapshots()
        .asyncExpand<List<Payslip>>((snapshot) {
          if (snapshot.docs.isEmpty) return const Stream.empty();
          final employeeDocId = snapshot.docs.first.id;
          return payslipsStream(employeeDocId);
        });
  }

  // ==================== NOTIFICATION OPERATIONS ====================

  /// Stream of notifications for a user, newest first, limited to 20.
  Stream<List<AppNotification>> notificationsStream(String uid) {
    return _db
        .collection('notifications')
        .where('targetUid', isEqualTo: uid)
        .orderBy('createdAt', descending: true)
        .limit(20)
        .snapshots()
        .map((snapshot) {
          return snapshot.docs
              .map((doc) => AppNotification.fromFirestore(doc))
              .toList();
        });
  }

  /// Mark a single notification as read.
  Future<void> markNotificationRead(String id) async {
    try {
      await _db.collection('notifications').doc(id).update({'read': true});
    } catch (e) {
      debugPrint('Error marking notification read: $e');
      rethrow;
    }
  }

  /// Mark all unread notifications for a user as read.
  Future<void> markAllNotificationsRead(String uid) async {
    try {
      final snapshot = await _db
          .collection('notifications')
          .where('targetUid', isEqualTo: uid)
          .where('read', isEqualTo: false)
          .get();

      if (snapshot.docs.isEmpty) return;

      final batch = _db.batch();
      for (final doc in snapshot.docs) {
        batch.update(doc.reference, {'read': true});
      }
      await batch.commit();
    } catch (e) {
      debugPrint('Error marking all notifications read: $e');
      rethrow;
    }
  }

  /// Create a notification document.
  Future<void> createNotification({
    required String targetUid,
    required String type,
    required String title,
    required String body,
  }) async {
    try {
      await _db.collection('notifications').add({
        'targetUid': targetUid,
        'type': type,
        'title': title,
        'body': body,
        'read': false,
        'createdAt': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      debugPrint('Error creating notification: $e');
      rethrow;
    }
  }

  // ==================== RECURRING TRANSACTIONS ====================

  /// Process recurring transactions for a user. For each recurring transaction,
  /// checks if a copy already exists for the current period; if not, creates one.
  Future<void> processRecurringTransactions(String userId) async {
    try {
      final now = DateTime.now();
      final snapshot = await _db
          .collection('transactions')
          .where('userId', isEqualTo: userId)
          .where('isRecurring', isEqualTo: true)
          .get();

      for (final doc in snapshot.docs) {
        final txn = app_transaction.Transaction.fromFirestore(doc);
        if (txn.recurrenceType == null) continue;

        DateTime periodStart;
        DateTime periodEnd;
        switch (txn.recurrenceType) {
          case 'daily':
            periodStart = DateTime(now.year, now.month, now.day);
            periodEnd = periodStart.add(const Duration(days: 1));
            break;
          case 'weekly':
            final weekday = now.weekday;
            periodStart = DateTime(now.year, now.month, now.day)
                .subtract(Duration(days: weekday - 1));
            periodEnd = periodStart.add(const Duration(days: 7));
            break;
          case 'monthly':
          default:
            periodStart = DateTime(now.year, now.month, 1);
            periodEnd = DateTime(now.year, now.month + 1, 1);
            break;
        }

        // Check if a copy already exists for this period
        final existing = await _db
            .collection('transactions')
            .where('userId', isEqualTo: userId)
            .where('title', isEqualTo: txn.title)
            .where('isRecurring', isEqualTo: false)
            .where(
              'date',
              isGreaterThanOrEqualTo: Timestamp.fromDate(periodStart),
            )
            .where('date', isLessThan: Timestamp.fromDate(periodEnd))
            .limit(1)
            .get();

        if (existing.docs.isEmpty) {
          final copy = app_transaction.Transaction(
            userId: txn.userId,
            title: txn.title,
            amount: txn.amount,
            type: txn.type,
            category: txn.category,
            date: now,
            note: txn.note,
            isRecurring: false,
            recurrenceType: null,
          );
          await _db.collection('transactions').add(copy.toFirestore());
        }
      }
    } catch (e) {
      debugPrint('Error processing recurring transactions: $e');
    }
  }

  /// Get all transactions for a user (one-time fetch, not stream).
  Future<List<app_transaction.Transaction>> getAllTransactions(
    String userId,
  ) async {
    try {
      final snapshot = await _db
          .collection('transactions')
          .where('userId', isEqualTo: userId)
          .orderBy('date', descending: true)
          .get();
      return snapshot.docs
          .map((doc) => app_transaction.Transaction.fromFirestore(doc))
          .toList();
    } catch (e) {
      debugPrint('Error getting all transactions: $e');
      rethrow;
    }
  }

  /// Get all payslips for an employee doc ID (one-time fetch).
  Future<List<Payslip>> getAllPayslipsForEmployee(String employeeId) async {
    try {
      final snapshot = await _db
          .collection('payslips')
          .where('employeeId', isEqualTo: employeeId)
          .orderBy('month', descending: true)
          .get();
      return snapshot.docs.map((doc) => Payslip.fromFirestore(doc)).toList();
    } catch (e) {
      debugPrint('Error getting payslips: $e');
      rethrow;
    }
  }

  /// Resolve auth UID to employee doc ID.
  Future<String?> getEmployeeDocIdByUid(String uid) async {
    try {
      final snapshot = await _db
          .collection('employees')
          .where('uid', isEqualTo: uid)
          .limit(1)
          .get();
      if (snapshot.docs.isEmpty) return null;
      return snapshot.docs.first.id;
    } catch (e) {
      debugPrint('Error resolving employee doc id: $e');
      return null;
    }
  }
}
