import type { Timestamp } from 'firebase/firestore';

// User roles
export type UserRole = 'admin' | 'hr' | 'employee' | 'regular';

// User model
export interface AppUser {
  id: string;
  uid: string;
  email: string;
  name?: string;
  role: UserRole;
  createdAt: Timestamp;
}

// Transaction types
export type TransactionType = 'income' | 'expense';

// Transaction model
export interface Transaction {
  id: string;
  userId: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  note: string;
  date: Timestamp;
  createdAt: Timestamp;
  isRecurring?: boolean;
  recurrenceType?: 'daily' | 'weekly' | 'monthly';
}

// Budget model
export interface Budget {
  id: string;
  userId: string;
  category: string;
  limit: number;
  spent: number;
  month: string; // Format: "YYYY-MM"
  createdAt: Timestamp;
}

// Employee model
export interface Employee {
  id: string;
  uid: string;
  name: string;
  email: string;
  department: string;
  salary: number;
  overtimeHours: number;
  createdBy: string;
  createdAt: Timestamp;
}

// Project status
export type ProjectStatus = 'pending' | 'active' | 'completed';

// Project model
export interface Project {
  id: string;
  title: string;
  description?: string;
  status: ProjectStatus;
  kpiPercent: number;
  assignedEmployeeIds: string[];
  deadline: Timestamp;
  createdBy: string;
  createdAt: Timestamp;
}

// Task status
export type TaskStatus = 'pending' | 'inProgress' | 'done';

// Task model
export interface Task {
  id: string;
  employeeId: string;
  title: string;
  status: TaskStatus;
  dueDate: Timestamp;
  projectId: string;
  createdAt: Timestamp;
}

// Payslip model
export interface Payslip {
  id: string;
  employeeId: string;
  month: string; // Format: "YYYY-MM"
  basicSalary: number;
  overtimePay: number;
  deductions: number;
  netPay: number;
  generatedAt: Timestamp;
  generatedBy: string;
}

// Helper type for form data (without id and timestamps)
export type CreateEmployee = Omit<Employee, 'id' | 'createdAt'>;
export type CreateProject = Omit<Project, 'id' | 'createdAt'>;
export type CreateTask = Omit<Task, 'id' | 'createdAt'>;
export type CreatePayslip = Omit<Payslip, 'id' | 'generatedAt'>;

// Notification types
export type NotificationType = 'task_assigned' | 'payslip_generated' | 'task_done' | 'task_overdue';

// Notification model
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAt: Timestamp;
  targetUid: string;
}

// Stats types for dashboard
export interface DashboardStats {
  totalEmployees: number;
  activeProjects: number;
  pendingTasks: number;
  totalPayroll: number;
  totalPayslips: number;
}
