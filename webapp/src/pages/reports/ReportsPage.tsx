import { useMemo } from 'react';
import { useEmployees, useProjects, useTasks, usePayslips } from '@/hooks';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrencyCompact, formatMonthYear } from '@/lib/utils/formatters';
import {
  TrendingUp,
  Users,
  FolderKanban,
  Wallet,
  CheckCircle2,
} from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl text-xs">
        {label && <p className="font-medium text-foreground mb-1">{label}</p>}
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>
            {p.name}: {typeof p.value === 'number' && p.value > 1000 ? formatCurrencyCompact(p.value) : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const PieTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number }[];
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl text-xs">
        <p className="font-medium text-foreground">{payload[0].name}</p>
        <p className="text-muted-foreground">{payload[0].value}</p>
      </div>
    );
  }
  return null;
};

export default function ReportsPage() {
  const { employees, loading: empLoading } = useEmployees();
  const { projects, loading: projLoading } = useProjects();
  const { tasks, loading: tasksLoading } = useTasks();
  const { payslips, loading: payslipsLoading } = usePayslips();

  const loading = empLoading || projLoading || tasksLoading || payslipsLoading;

  // Payroll by month (AreaChart)
  const payrollByMonth = useMemo(() => {
    const map: Record<string, number> = {};
    payslips.forEach((p) => {
      map[p.month] = (map[p.month] || 0) + p.netPay;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, total]) => ({
        month: formatMonthYear(month).replace(' 20', " '"),
        total,
      }));
  }, [payslips]);

  // Department breakdown (PieChart)
  const departmentData = useMemo(() => {
    const map: Record<string, { count: number; totalSalary: number }> = {};
    employees.forEach((e) => {
      const dept = e.department || 'Unknown';
      if (!map[dept]) map[dept] = { count: 0, totalSalary: 0 };
      map[dept].count += 1;
      map[dept].totalSalary += e.salary;
    });
    return Object.entries(map).map(([name, data]) => ({
      name,
      count: data.count,
      totalSalary: data.totalSalary,
    }));
  }, [employees]);

  // Project status distribution (PieChart)
  const projectStatusData = useMemo(() => {
    const counts = { pending: 0, active: 0, completed: 0 };
    projects.forEach((p) => {
      counts[p.status] = (counts[p.status] || 0) + 1;
    });
    return [
      { name: 'Pending', value: counts.pending },
      { name: 'Active', value: counts.active },
      { name: 'Completed', value: counts.completed },
    ].filter((d) => d.value > 0);
  }, [projects]);

  // Task completion (BarChart)
  const taskData = useMemo(() => {
    const pending = tasks.filter((t) => t.status === 'pending').length;
    const inProgress = tasks.filter((t) => t.status === 'inProgress').length;
    const done = tasks.filter((t) => t.status === 'done').length;
    return [
      { name: 'Pending', count: pending, fill: '#f59e0b' },
      { name: 'In Progress', count: inProgress, fill: '#6366f1' },
      { name: 'Done', count: done, fill: '#10b981' },
    ];
  }, [tasks]);

  // KPI per project (top 10)
  const kpiData = useMemo(() => {
    return [...projects]
      .sort((a, b) => b.kpiPercent - a.kpiPercent)
      .slice(0, 10)
      .map((p) => ({
        title: p.title.length > 20 ? p.title.substring(0, 18) + '…' : p.title,
        kpi: p.kpiPercent,
      }));
  }, [projects]);

  // Summary KPIs
  const totalPayroll = payslips.reduce((sum, p) => sum + p.netPay, 0);
  const avgSalary =
    employees.length > 0 ? Math.round(employees.reduce((s, e) => s + e.salary, 0) / employees.length) : 0;
  const doneTasks = tasks.filter((t) => t.status === 'done').length;
  const completionRate = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;
  const activeProjects = projects.filter((p) => p.status === 'active').length;

  const kpiCards = [
    {
      label: 'Total Payroll Disbursed',
      value: formatCurrencyCompact(totalPayroll),
      icon: Wallet,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Average Salary',
      value: formatCurrencyCompact(avgSalary),
      icon: Users,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
    },
    {
      label: 'Task Completion Rate',
      value: `${completionRate}%`,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
    },
    {
      label: 'Active Projects',
      value: activeProjects,
      icon: FolderKanban,
      color: 'text-yellow-400',
      bg: 'bg-yellow-400/10',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 bg-muted rounded-xl" />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-72 bg-muted rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Data-driven insights for your organization
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
          <TrendingUp className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs text-primary font-medium">Live Data</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card) => (
          <Card key={card.label} className="bg-card border-border">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{card.label}</p>
                  <p className="text-2xl font-bold text-foreground">{card.value}</p>
                </div>
                <div className={`p-2.5 rounded-xl ${card.bg}`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Payroll Summary */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-foreground text-base">Payroll Summary</CardTitle>
            <CardDescription className="text-muted-foreground text-xs">
              Total net pay disbursed per month
            </CardDescription>
          </CardHeader>
          <CardContent>
            {payrollByMonth.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">
                No payslip data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={payrollByMonth} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="payrollGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrencyCompact(v)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Net Pay"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    fill="url(#payrollGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Task Completion Rate */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-foreground text-base">Task Completion Rate</CardTitle>
            <CardDescription className="text-muted-foreground text-xs">
              Distribution of tasks by status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">
                No task data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={taskData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Tasks" radius={[4, 4, 0, 0]}>
                    {taskData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Department Breakdown */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-foreground text-base">Department Breakdown</CardTitle>
            <CardDescription className="text-muted-foreground text-xs">
              Employee count by department
            </CardDescription>
          </CardHeader>
          <CardContent>
            {departmentData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">
                No employee data available
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie
                      data={departmentData}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {departmentData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {departmentData.map((dept, index) => (
                    <div key={dept.name} className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: COLORS[index % COLORS.length] }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{dept.name}</p>
                        <p className="text-xs text-muted-foreground">{dept.count} emp · {formatCurrencyCompact(dept.totalSalary)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Project Status Distribution */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-foreground text-base">Project Status Distribution</CardTitle>
            <CardDescription className="text-muted-foreground text-xs">
              Projects grouped by current status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {projectStatusData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">
                No project data available
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie
                      data={projectStatusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {projectStatusData.map((_, index) => (
                        <Cell key={index} fill={['#f59e0b', '#6366f1', '#10b981'][index % 3]} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-3">
                  {projectStatusData.map((item, index) => (
                    <div key={item.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ background: ['#f59e0b', '#6366f1', '#10b981'][index % 3] }}
                          />
                          <span className="text-foreground font-medium">{item.name}</span>
                        </div>
                        <span className="text-muted-foreground">{item.value}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${projects.length > 0 ? (item.value / projects.length) * 100 : 0}%`,
                            background: ['#f59e0b', '#6366f1', '#10b981'][index % 3],
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* KPI Overview - full width */}
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-foreground text-base">KPI Overview</CardTitle>
            <CardDescription className="text-muted-foreground text-xs">
              Top projects by KPI percentage
            </CardDescription>
          </CardHeader>
          <CardContent>
            {kpiData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">
                No project KPI data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={kpiData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <YAxis
                    type="category"
                    dataKey="title"
                    tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={120}
                  />
                  <Tooltip
                    formatter={(value) => [`${value}%`, 'KPI']}
                    contentStyle={{
                      background: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="kpi" name="KPI %" fill="var(--color-primary)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
