import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_app/core/models/budget.dart';
import 'package:flutter_app/core/models/employee.dart';
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
          ? 'in-progress'
          : status == TaskStatus.done
          ? 'done'
          : 'pending';

      await _db.collection('tasks').doc(id).update({'status': statusString});
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
        // Check if payslip already exists
        final existing = await getPayslipForMonth(employee.uid, month);
        if (existing != null) continue;

        // Generate payslip
        final payslip = Payslip.generate(
          employeeId: employee.uid,
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
}
