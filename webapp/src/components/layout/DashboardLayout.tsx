import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { useEmployees, useProjects, useTasks } from '@/hooks';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Receipt,
  Settings,
  LogOut,
  ChevronUp,
  Zap,
  ListTodo,
  BarChart2,
  Bell,
  Search,
  CheckCircle2,
  AlertCircle,
  ClipboardCheck,
  Check,
  X,
} from 'lucide-react';
import { getInitials, formatRelativeTime } from '@/lib/utils/formatters';
import { useEffect, useState, useCallback, useRef } from 'react';
import type { NotificationType } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// All menu items - filtered by role at render time
const adminMenuItems = [
  { title: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { title: 'Employees', icon: Users, path: '/employees' },
  { title: 'Projects', icon: FolderKanban, path: '/projects' },
  { title: 'Tasks', icon: ListTodo, path: '/tasks' },
  { title: 'Payslips', icon: Receipt, path: '/payslips' },
  { title: 'Reports', icon: BarChart2, path: '/reports' },
];

const hrMenuItems = [
  { title: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { title: 'Employees', icon: Users, path: '/employees' },
  { title: 'Payslips', icon: Receipt, path: '/payslips' },
];

function NotificationBellIcon({ type }: { type: NotificationType }) {
  switch (type) {
    case 'task_assigned': return <ClipboardCheck className="h-3.5 w-3.5 text-blue-400" />;
    case 'payslip_generated': return <Receipt className="h-3.5 w-3.5 text-primary" />;
    case 'task_done': return <CheckCircle2 className="h-3.5 w-3.5 text-blue-700" />;
    case 'task_overdue': return <AlertCircle className="h-3.5 w-3.5 text-destructive" />;
    default: return <Bell className="h-3.5 w-3.5 text-muted-foreground" />;
  }
}

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { appUser, signOut, isAdmin } = useAuth();
  const menuItems = isAdmin ? adminMenuItems : hrMenuItems;
  const navigate = useNavigate();
  const location = useLocation();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { employees } = useEmployees();
  const { projects } = useProjects();
  const { tasks } = useTasks();

  // Global search
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchRef.current?.focus(), 50);
    } else {
      setSearchQuery('');
    }
  }, [searchOpen]);

  // Close search on route change
  useEffect(() => {
    setSearchOpen(false);
  }, [location.pathname]);

  const searchResults = useCallback(() => {
    if (!searchQuery.trim()) return { employees: [], projects: [], tasks: [] };
    const q = searchQuery.toLowerCase();
    return {
      employees: employees.filter(e =>
        e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q) || e.department.toLowerCase().includes(q)
      ).slice(0, 4),
      projects: projects.filter(p =>
        p.title.toLowerCase().includes(q)
      ).slice(0, 4),
      tasks: tasks.filter(t =>
        t.title.toLowerCase().includes(q)
      ).slice(0, 4),
    };
  }, [searchQuery, employees, projects, tasks]);

  const results = searchResults();
  const hasResults = results.employees.length > 0 || results.projects.length > 0 || results.tasks.length > 0;

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to update notifications');
    }
  };

  const displayName = appUser?.name || appUser?.email?.split('@')[0] || 'User';
  const initials = appUser?.name ? getInitials(appUser.name) : displayName.charAt(0).toUpperCase();

  return (
    <SidebarProvider>
      <Sidebar className="border-sidebar-border">
        {/* Logo */}
        <SidebarHeader className="border-b border-sidebar-border">
          <div className="flex items-center gap-3 px-3 py-3">
            <div className="w-9 h-9 bg-primary/15 border border-primary/20 rounded-xl flex items-center justify-center shrink-0">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-sidebar-foreground text-sm">FinManager</h1>
              <p className="text-xs text-muted-foreground">{isAdmin ? 'Admin Portal' : 'HR Portal'}</p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider px-3">
              Navigation
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <NavLink
                      to={item.path}
                      end={item.path === '/'}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm w-full ${
                          isActive
                            ? 'bg-primary text-primary-foreground font-medium shadow-sm shadow-primary/20'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                        }`
                      }
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider px-3">
              Account
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <NavLink
                    to="/notifications"
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm w-full ${
                        isActive
                          ? 'bg-primary text-primary-foreground font-medium shadow-sm shadow-primary/20'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      }`
                    }
                  >
                    <Bell className="h-4 w-4 shrink-0" />
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                      <span className="ml-auto bg-primary text-primary-foreground text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </NavLink>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <NavLink
                    to="/settings"
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm w-full ${
                        isActive
                          ? 'bg-primary text-primary-foreground font-medium shadow-sm shadow-primary/20'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      }`
                    }
                  >
                    <Settings className="h-4 w-4 shrink-0" />
                    <span>Settings</span>
                  </NavLink>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* User Footer */}
        <SidebarFooter className="border-t border-sidebar-border">
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-sidebar-accent transition-colors cursor-pointer outline-none"
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-sidebar-foreground truncate">
                      {displayName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {appUser?.email || ''}
                    </p>
                  </div>
                  <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start" className="w-56 bg-popover border-border">
                  <DropdownMenuLabel className="text-foreground text-xs">My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem
                    onClick={() => navigate('/settings')}
                    className="text-foreground hover:bg-muted cursor-pointer gap-2 text-sm"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-destructive hover:bg-destructive/10 cursor-pointer gap-2 text-sm"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-12 items-center gap-2 border-b border-border bg-background/95 backdrop-blur-sm px-4 sticky top-0 z-10">
          <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
          <Separator orientation="vertical" className="h-5 bg-border" />
          <span className="text-sm font-medium text-foreground md:hidden">FinManager</span>

          {/* Search Pill */}
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3 h-8 rounded-lg bg-muted/50 border border-border text-muted-foreground text-xs hover:bg-muted transition-colors"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Search...</span>
            <kbd className="ml-2 text-xs bg-background border border-border px-1.5 py-0.5 rounded text-muted-foreground">
              ⌘K
            </kbd>
          </button>

          <div className="flex-1" />

          {/* Notifications Bell Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="relative h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors outline-none">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 bg-popover border-border p-0" sideOffset={8}>
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
                <span className="text-sm font-semibold text-foreground">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    <Check className="h-3 w-3" />
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground text-xs">
                    No notifications
                  </div>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => { if (!n.read) markAsRead(n.id); navigate('/notifications'); }}
                      className={cn(
                        'flex items-start gap-2.5 px-3 py-2.5 hover:bg-muted/50 cursor-pointer transition-colors border-b border-border/50 last:border-0',
                        !n.read && 'bg-primary/5'
                      )}
                    >
                      <div className="p-1.5 rounded-lg bg-muted shrink-0 mt-0.5">
                        <NotificationBellIcon type={n.type} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-xs font-medium truncate', n.read ? 'text-muted-foreground' : 'text-foreground')}>
                          {n.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{n.body}</p>
                        <p className="text-xs text-muted-foreground/70 mt-0.5">{formatRelativeTime(n.createdAt)}</p>
                      </div>
                      {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />}
                    </div>
                  ))
                )}
              </div>
              <div className="px-3 py-2 border-t border-border">
                <button
                  onClick={() => navigate('/notifications')}
                  className="w-full text-xs text-center text-primary hover:text-primary/80 transition-colors"
                >
                  View all notifications
                </button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6 bg-background">
          {children}
        </main>
      </SidebarInset>

      {/* Global Search Modal */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setSearchOpen(false); }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
          {/* Panel */}
          <div className="relative w-full max-w-xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search employees, projects, tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-sm outline-none"
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto">
              {!searchQuery.trim() ? (
                <div className="py-10 text-center text-muted-foreground text-sm">
                  Start typing to search...
                </div>
              ) : !hasResults ? (
                <div className="py-10 text-center text-muted-foreground text-sm">
                  No results for "{searchQuery}"
                </div>
              ) : (
                <div className="p-2">
                  {/* Employees */}
                  {results.employees.length > 0 && (
                    <div className="mb-2">
                      <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Employees
                      </p>
                      {results.employees.map((emp) => (
                        <button
                          key={emp.id}
                          onClick={() => { navigate(`/employees/${emp.id}`); setSearchOpen(false); }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors text-left"
                        >
                          <div className="w-7 h-7 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0">
                            <span className="text-primary font-semibold text-xs">{emp.name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{emp.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{emp.department} · {emp.email}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Projects */}
                  {results.projects.length > 0 && (
                    <div className="mb-2">
                      <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Projects
                      </p>
                      {results.projects.map((proj) => (
                        <button
                          key={proj.id}
                          onClick={() => { navigate(`/projects/${proj.id}`); setSearchOpen(false); }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors text-left"
                        >
                          <div className="w-7 h-7 rounded-lg bg-blue-400/15 border border-blue-400/20 flex items-center justify-center shrink-0">
                            <FolderKanban className="h-3.5 w-3.5 text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{proj.title}</p>
                            <p className="text-xs text-muted-foreground capitalize">{proj.status} · {proj.kpiPercent}% KPI</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Tasks */}
                  {results.tasks.length > 0 && (
                    <div>
                      <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Tasks
                      </p>
                      {results.tasks.map((task) => (
                        <button
                          key={task.id}
                          onClick={() => { navigate('/tasks'); setSearchOpen(false); }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors text-left"
                        >
                          <div className="w-7 h-7 rounded-lg bg-sky-500/15 border border-sky-500/20 flex items-center justify-center shrink-0">
                            <ListTodo className="h-3.5 w-3.5 text-sky-700" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                            <p className="text-xs text-muted-foreground capitalize">{task.status}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer hint */}
            <div className="px-4 py-2 border-t border-border flex items-center gap-3 text-xs text-muted-foreground">
              <span><kbd className="bg-muted px-1 rounded text-xs">↵</kbd> to select</span>
              <span><kbd className="bg-muted px-1 rounded text-xs">esc</kbd> to close</span>
            </div>
          </div>
        </div>
      )}
    </SidebarProvider>
  );
}
