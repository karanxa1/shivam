import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

// Layouts
import DashboardLayout from '@/components/layout/DashboardLayout';
import PersonalLayout from '@/components/layout/PersonalLayout';

// Auth Pages
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import EmployeesPage from '@/pages/employees/EmployeesPage';
import EmployeeProfilePage from '@/pages/employees/EmployeeProfilePage';
import ProjectsPage from '@/pages/projects/ProjectsPage';
import ProjectDetailPage from '@/pages/projects/ProjectDetailPage';
import TasksPage from '@/pages/tasks/TasksPage';
import PayslipsPage from '@/pages/payslips/PayslipsPage';
import SettingsPage from '@/pages/settings/SettingsPage';
import NotificationsPage from '@/pages/notifications/NotificationsPage';
import ReportsPage from '@/pages/reports/ReportsPage';

// Personal Finance Pages
import PersonalDashboardPage from '@/pages/personal/PersonalDashboardPage';
import TransactionsPage from '@/pages/personal/TransactionsPage';
import BudgetsPage from '@/pages/personal/BudgetsPage';

// Employee Pages
import MyTasksPage from '@/pages/employee/MyTasksPage';
import MyPayslipsPage from '@/pages/employee/MyPayslipsPage';
import EmployeeProfilePagePersonal from '@/pages/employee/EmployeeProfilePage';

// Personal Settings Page
import PersonalSettingsPage from '@/pages/personal/PersonalSettingsPage';

// Loading component
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center animate-pulse">
          <span className="text-3xl">💼</span>
        </div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

// Management Portal Route (Admin & HR)
function ManagementRoute({ children }: { children: React.ReactNode }) {
  const { appUser, loading, isManagement } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!appUser) return <Navigate to="/login" replace />;

  if (!isManagement) {
    return <Navigate to="/personal" replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}

// Admin-only Route (projects, tasks, reports)
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { appUser, loading, isAdmin } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!appUser) return <Navigate to="/login" replace />;

  if (!isAdmin) {
    return <Navigate to={appUser.role === 'hr' ? '/' : '/personal'} replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}

// Personal finance & employee portal route
function PersonalRoute({ children }: { children: React.ReactNode }) {
  const { appUser, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!appUser) return <Navigate to="/login" replace />;

  return <PersonalLayout>{children}</PersonalLayout>;
}

// Public Route wrapper (redirects to correct home if already logged in)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { appUser, loading, isManagement } = useAuth();

  if (loading) return <LoadingScreen />;

  if (appUser) {
    return <Navigate to={isManagement ? '/' : '/personal'} replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />

      {/* Management Routes (Admin + HR) */}
      <Route path="/" element={<ManagementRoute><DashboardPage /></ManagementRoute>} />
      <Route path="/employees" element={<ManagementRoute><EmployeesPage /></ManagementRoute>} />
      <Route path="/employees/:employeeId" element={<ManagementRoute><EmployeeProfilePage /></ManagementRoute>} />
      <Route path="/payslips" element={<ManagementRoute><PayslipsPage /></ManagementRoute>} />
      <Route path="/notifications" element={<ManagementRoute><NotificationsPage /></ManagementRoute>} />
      <Route path="/settings" element={<ManagementRoute><SettingsPage /></ManagementRoute>} />

      {/* Admin-only Routes */}
      <Route path="/projects" element={<AdminRoute><ProjectsPage /></AdminRoute>} />
      <Route path="/projects/:projectId" element={<AdminRoute><ProjectDetailPage /></AdminRoute>} />
      <Route path="/tasks" element={<AdminRoute><TasksPage /></AdminRoute>} />
      <Route path="/reports" element={<AdminRoute><ReportsPage /></AdminRoute>} />

      {/* Personal Finance Routes */}
      <Route path="/personal" element={<PersonalRoute><PersonalDashboardPage /></PersonalRoute>} />
      <Route path="/personal/transactions" element={<PersonalRoute><TransactionsPage /></PersonalRoute>} />
      <Route path="/personal/budgets" element={<PersonalRoute><BudgetsPage /></PersonalRoute>} />
      <Route path="/personal/tasks" element={<PersonalRoute><MyTasksPage /></PersonalRoute>} />
      <Route path="/personal/payslips" element={<PersonalRoute><MyPayslipsPage /></PersonalRoute>} />
      <Route path="/personal/profile" element={<PersonalRoute><EmployeeProfilePagePersonal /></PersonalRoute>} />
      <Route path="/personal/notifications" element={<PersonalRoute><NotificationsPage /></PersonalRoute>} />
      <Route path="/personal/settings" element={<PersonalRoute><PersonalSettingsPage /></PersonalRoute>} />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'var(--color-card)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-foreground)',
              },
            }}
          />
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
