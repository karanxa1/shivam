import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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
  Receipt,
  LogOut,
  ChevronUp,
  Wallet,
  Target,
  ClipboardList,
  DollarSign,
  User,
  Bell,
  Settings,
} from 'lucide-react';
import { getInitials } from '@/lib/utils/formatters';
import { useNotifications } from '@/hooks';

const financeMenuItems = [
  { title: 'Dashboard', icon: LayoutDashboard, path: '/personal' },
  { title: 'Transactions', icon: Receipt, path: '/personal/transactions' },
  { title: 'Budgets', icon: Target, path: '/personal/budgets' },
];

const employeeMenuItems = [
  { title: 'My Tasks', icon: ClipboardList, path: '/personal/tasks' },
  { title: 'My Payslips', icon: DollarSign, path: '/personal/payslips' },
  { title: 'Profile', icon: User, path: '/personal/profile' },
  { title: 'Notifications', icon: Bell, path: '/personal/notifications' },
  { title: 'Settings', icon: Settings, path: '/personal/settings' },
];

interface PersonalLayoutProps {
  children?: React.ReactNode;
}

export default function PersonalLayout({ children }: PersonalLayoutProps) {
  const { appUser, signOut, isEmployee } = useAuth();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Sign out error:', error);
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
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-sidebar-foreground text-sm">FinManager</h1>
              <p className="text-xs text-muted-foreground">Personal Finance</p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider px-3">
              Finance
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {financeMenuItems.map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <NavLink
                      to={item.path}
                      end={item.path === '/personal'}
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

          {isEmployee && (
            <SidebarGroup>
              <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider px-3">
                Employee
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {employeeMenuItems.map((item) => (
                    <SidebarMenuItem key={item.path}>
                      <NavLink
                        to={item.path}
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
                        {item.title === 'Notifications' && unreadCount > 0 && (
                          <span className="ml-auto bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            {unreadCount}
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
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
                    <p className="text-sm font-medium text-sidebar-foreground truncate">{displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">{appUser?.email || ''}</p>
                  </div>
                  <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start" className="w-56 bg-popover border-border">
                  <DropdownMenuLabel className="text-foreground text-xs">My Account</DropdownMenuLabel>
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
        <header className="flex h-12 items-center gap-3 border-b border-border bg-background/95 backdrop-blur-sm px-4 sticky top-0 z-10">
          <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
          <Separator orientation="vertical" className="h-5 bg-border" />
          <span className="text-sm font-medium text-foreground md:hidden">FinManager</span>
          <div className="flex-1" />
        </header>
        <main className="flex-1 overflow-auto p-4 sm:p-6 bg-background">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
