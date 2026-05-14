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

// Employee Pages (self-service)
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
    // If employee, redirect to employee portal; otherwise personal
    return <Navigate to={appUser.role === 'employee' ? '/employee' : '/personal'} replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}

// Admin-only Route (projects, tasks, reports)
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { appUser, loading, isAdmin } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!appUser) return <Navigate to="/login" replace />;

  if (!isAdmin) {
    return <Navigate to={appUser.role === 'hr' ? '/' : appUser.role === 'employee' ? '/employee' : '/personal'} replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}

// Personal finance portal route
function PersonalRoute({ children }: { children: React.ReactNode }) {
  const { appUser, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!appUser) return <Navigate to="/login" replace />;
  // Employees should not be on personal finance pages
  if (appUser.role === 'employee') return <Navigate to="/employee" replace />;

  return <PersonalLayout>{children}</PersonalLayout>;
}

// Employee self-service portal route
function EmployeeRoute({ children }: { children: React.ReactNode }) {
  const { appUser, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!appUser) return <Navigate to="/login" replace />;
  if (appUser.role !== 'employee') return <Navigate to="/" replace />;

  return <EmployeeShell>{children}</EmployeeShell>;
}

// Public Route wrapper (redirects to correct home if already logged in)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { appUser, loading, isManagement } = useAuth();

  if (loading) return <LoadingScreen />;

  if (appUser) {
    if (appUser.role === 'employee') return <Navigate to="/employee" replace />;
    return <Navigate to={isManagement ? '/' : '/personal'} replace />;
  }

  return <>{children}</>;
}

// ── Employee Shell for web ──
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, ListChecks, Receipt, User, LogOut } from 'lucide-react';
import { useState } from 'react';

function EmployeeShell({ children }: { children: React.ReactNode }) {
  const { appUser, signOut } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/employee', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/employee/tasks', label: 'Tasks', icon: ListChecks },
    { path: '/employee/payslips', label: 'Payslips', icon: Receipt },
    { path: '/employee/profile', label: 'Profile', icon: User },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">FinManager</span>
          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Employee</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-muted"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`${mobileMenuOpen ? 'block' : 'hidden'} md:flex md:w-64 flex-col border-r border-border bg-card`}>
        <div className="hidden md:flex items-center gap-2 p-4 border-b border-border">
          <span className="text-lg font-bold">FinManager</span>
          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Employee</span>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive(item.path) ? 'bg-primary text-primary-foreground font-medium' : 'text-foreground hover:bg-muted'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-border">
          <div className="mb-3">
            <p className="text-sm font-medium text-foreground truncate">{appUser?.name || appUser?.email}</p>
            <p className="text-xs text-muted-foreground truncate">{appUser?.email}</p>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 text-sm text-destructive hover:text-destructive/80 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto p-4 sm:p-6 bg-background">
        {children}
      </main>
    </div>
  );
}

// ── Employee Dashboard Page for web ──
function EmployeeDashboardPage() {
  const { appUser } = useAuth();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Welcome, {appUser?.name || 'Employee'} 👋</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Your employee self-service portal</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <CardLink to="/employee/tasks" icon={ListChecks} label="My Tasks" desc="View and update task status" color="bg-blue-500/10" />
        <CardLink to="/employee/payslips" icon={Receipt} label="My Payslips" desc="View salary history" color="bg-primary/10" />
        <CardLink to="/employee/profile" icon={User} label="My Profile" desc="Your employment details" color="bg-sky-500/10" />
      </div>
    </div>
  );
}

function CardLink({ to, icon: Icon, label, desc, color }: { to: string; icon: any; label: string; desc: string; color: string }) {
  return (
    <NavLink to={to} className="block p-5 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-card/80 transition-all">
      <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-3`}>
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h3 className="font-semibold text-foreground">{label}</h3>
      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
    </NavLink>
  );
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

      {/* Employee Portal Routes */}
      <Route path="/employee" element={<EmployeeRoute><EmployeeDashboardPage /></EmployeeRoute>} />
      <Route path="/employee/tasks" element={<EmployeeRoute><MyTasksPage /></EmployeeRoute>} />
      <Route path="/employee/payslips" element={<EmployeeRoute><MyPayslipsPage /></EmployeeRoute>} />
      <Route path="/employee/profile" element={<EmployeeRoute><EmployeeProfilePagePersonal /></EmployeeRoute>} />
      <Route path="/employee/notifications" element={<EmployeeRoute><NotificationsPage /></EmployeeRoute>} />

      {/* Personal Finance Routes (Regular users only) */}
      <Route path="/personal" element={<PersonalRoute><PersonalDashboardPage /></PersonalRoute>} />
      <Route path="/personal/transactions" element={<PersonalRoute><TransactionsPage /></PersonalRoute>} />
      <Route path="/personal/budgets" element={<PersonalRoute><BudgetsPage /></PersonalRoute>} />
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
