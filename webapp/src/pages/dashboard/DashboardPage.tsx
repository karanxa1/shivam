import { useDashboardStats, useProjects, useEmployees } from '@/hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  FolderKanban, 
  ClipboardList, 
  Wallet,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Receipt,
} from 'lucide-react';
import { formatCurrency, formatCurrencyCompact, formatDateShort, getStatusColor, formatStatus } from '@/lib/utils/formatters';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardPage() {
  const { appUser, isAdmin, isHR } = useAuth();
  const { stats, loading: statsLoading } = useDashboardStats();
  const { projects, loading: projectsLoading } = useProjects();
  const { employees, loading: employeesLoading } = useEmployees();

  const recentProjects = projects.slice(0, 5);
  const recentEmployees = employees.slice(0, 5);
  const displayName = appUser?.name || appUser?.email?.split('@')[0] || 'there';
  const portalLabel = isAdmin ? 'Admin Portal' : isHR ? 'HR Portal' : 'Portal';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Good day, {displayName} 👋
          </h1>
          <p className="text-muted-foreground mt-0.5">
            Here's what's happening in your organization today.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
          <Activity className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs text-primary font-medium">Live · {portalLabel}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={`grid gap-4 ${isAdmin ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3'}`}>
        <StatsCard
          title="Total Employees"
          value={stats.totalEmployees}
          icon={Users}
          loading={statsLoading}
          color="text-blue-400"
          bgColor="bg-blue-400/10"
          borderColor="border-blue-400/20"
          href="/employees"
        />
        {isAdmin && (
          <>
            <StatsCard
              title="Active Projects"
              value={stats.activeProjects}
              icon={FolderKanban}
              loading={statsLoading}
              color="text-blue-700"
              bgColor="bg-blue-500/10"
              borderColor="border-blue-500/20"
              href="/projects"
            />
            <StatsCard
              title="Pending Tasks"
              value={stats.pendingTasks}
              icon={ClipboardList}
              loading={statsLoading}
              color="text-sky-700"
              bgColor="bg-sky-500/10"
              borderColor="border-sky-500/20"
            />
          </>
        )}
        {isHR && (
          <StatsCard
            title="Total Payslips"
            value={stats.totalPayslips}
            icon={Receipt}
            loading={statsLoading}
            color="text-blue-700"
            bgColor="bg-blue-500/10"
            borderColor="border-blue-500/20"
            href="/payslips"
          />
        )}
        <StatsCard
          title="Monthly Payroll"
          value={formatCurrencyCompact(stats.totalPayroll)}
          icon={Wallet}
          loading={statsLoading}
          color="text-primary"
          bgColor="bg-primary/10"
          borderColor="border-primary/20"
          href="/payslips"
          isFormatted
        />
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Projects — Admin only */}
        {isAdmin && (
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-foreground text-base">Recent Projects</CardTitle>
                <CardDescription className="text-muted-foreground text-xs mt-0.5">
                  Latest projects in your organization
                </CardDescription>
              </div>
              <Link 
                to="/projects"
                className="flex items-center text-xs text-primary hover:text-primary/80 transition-colors font-medium"
              >
                View all
                <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {projectsLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full bg-muted" />
                  ))}
                </div>
              ) : recentProjects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FolderKanban className="mx-auto h-10 w-10 mb-2 opacity-30" />
                  <p className="text-sm">No projects yet</p>
                  <Link to="/projects" className="text-primary hover:underline text-xs mt-1 inline-block">
                    Create your first project →
                  </Link>
                </div>
              ) : (
                recentProjects.map((project) => (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/60 transition-colors border border-transparent hover:border-border group"
                  >
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-foreground text-sm truncate">
                          {project.title}
                        </p>
                        <Badge 
                          variant="outline" 
                          className={`${getStatusColor(project.status)} border text-xs shrink-0`}
                        >
                          {formatStatus(project.status)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <Progress value={project.kpiPercent} className="h-1.5 flex-1 bg-muted" />
                        <div className="flex items-center gap-1 text-xs text-primary shrink-0">
                          <TrendingUp className="h-3 w-3" />
                          {project.kpiPercent}%
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Due {formatDateShort(project.deadline)}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {/* Recent Employees */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-foreground text-base">Team Members</CardTitle>
              <CardDescription className="text-muted-foreground text-xs mt-0.5">
                Recently added employees
              </CardDescription>
            </div>
            <Link 
              to="/employees"
              className="flex items-center text-xs text-primary hover:text-primary/80 transition-colors font-medium"
            >
              View all
              <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {employeesLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full bg-muted" />
                ))}
              </div>
            ) : recentEmployees.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="mx-auto h-10 w-10 mb-2 opacity-30" />
                <p className="text-sm">No employees yet</p>
                <Link to="/employees" className="text-primary hover:underline text-xs mt-1 inline-block">
                  Add your first employee →
                </Link>
              </div>
            ) : (
              recentEmployees.map((employee) => (
                <div
                  key={employee.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-transparent"
                >
                  <div className="w-9 h-9 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-primary font-semibold text-sm">
                      {employee.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">
                      {employee.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {employee.department}
                    </p>
                  </div>
                  <p className="text-sm text-primary font-semibold shrink-0">
                    {formatCurrency(employee.salary)}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  loading: boolean;
  color: string;
  bgColor: string;
  borderColor: string;
  isFormatted?: boolean;
  href?: string;
}

function StatsCard({ title, value, icon: Icon, loading, color, bgColor, borderColor, isFormatted, href }: StatsCardProps) {
  const content = (
    <Card className={`bg-card border-border hover:border-border/80 transition-all ${href ? 'cursor-pointer hover:bg-card/80' : ''}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-20 bg-muted" />
            ) : (
              <p className="text-2xl font-bold text-foreground">
                {isFormatted ? value : (typeof value === 'number' ? value.toLocaleString('en-IN') : value)}
              </p>
            )}
          </div>
          <div className={`p-2.5 rounded-xl ${bgColor} border ${borderColor}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link to={href}>{content}</Link>;
  }
  return content;
}
