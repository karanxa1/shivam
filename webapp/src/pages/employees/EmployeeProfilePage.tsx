import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useEmployee, useTasks, useEmployeePayslips, useProjects } from '@/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Mail,
  Building2,
  Clock,
  DollarSign,
  CheckCircle2,
  ListTodo,
  Receipt,
  FolderKanban,
  Pencil,
  Loader2,
  Circle,
  FileText,
} from 'lucide-react';
import {
  formatCurrency,
  formatDateShort,
  formatMonthYear,
  getStatusColor,
  formatStatus,
  getInitials,
} from '@/lib/utils/formatters';
import type { TaskStatus } from '@/types';
import { toast } from 'sonner';
import { useEmployees } from '@/hooks';
import { generateFullEmployeeReport } from '@/lib/utils/reports';

export default function EmployeeProfilePage() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const { employee, loading: employeeLoading } = useEmployee(employeeId || null);
  const { tasks, loading: tasksLoading, updateTask } = useTasks(undefined, employeeId);
  const { payslips, loading: payslipsLoading } = useEmployeePayslips(employeeId || null);
  const { projects } = useProjects();
  const { updateEmployee } = useEmployees();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  const assignedProjects = projects.filter((p) =>
    p.assignedEmployeeIds.includes(employeeId || '')
  );

  const pendingTasks = tasks.filter((t) => t.status === 'pending').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'inProgress').length;
  const doneTasks = tasks.filter((t) => t.status === 'done').length;

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    try {
      await updateTask(taskId, { status });
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleEditEmployee = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!employee) return;
    const formData = new FormData(e.currentTarget);
    setIsSubmitting(true);
    try {
      await updateEmployee(employee.id, {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        department: formData.get('department') as string,
        salary: parseFloat(formData.get('salary') as string),
        overtimeHours: parseFloat(formData.get('overtimeHours') as string) || 0,
      });
      setIsEditOpen(false);
      toast.success('Employee updated');
    } catch {
      toast.error('Failed to update employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!employee || payslips.length === 0) {
      toast.info('No payslip data to include in report');
      return;
    }
    setGeneratingReport(true);
    try {
      await generateFullEmployeeReport(employee, payslips, tasks);
      toast.success('Employee report downloaded');
    } catch {
      toast.error('Failed to generate report');
    } finally {
      setGeneratingReport(false);
    }
  };

  if (employeeLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32 bg-muted" />
        <Skeleton className="h-40 w-full bg-muted rounded-xl" />
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full bg-muted rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-muted-foreground">Employee not found</p>
        <Button variant="outline" onClick={() => navigate('/employees')} className="mt-4 border-border text-foreground">
          Back to Employees
        </Button>
      </div>
    );
  }

  const initials = getInitials(employee.name);

  return (
    <div className="space-y-6">
      {/* Back */}
      <Button
        variant="ghost"
        onClick={() => navigate('/employees')}
        className="text-muted-foreground hover:text-foreground -ml-2 gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Employees
      </Button>

      {/* Employee Header Card */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary/20 text-primary text-xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h1 className="text-xl font-bold text-foreground">{employee.name}</h1>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="border-border text-muted-foreground text-xs gap-1">
                    <Building2 className="h-3 w-3" />
                    {employee.department}
                  </Badge>
                  {employee.uid && (
                    <Badge variant="outline" className="border-primary/30 text-primary text-xs">
                      Linked
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="border-border text-foreground hover:bg-muted gap-2"
                onClick={handleDownloadReport}
                disabled={generatingReport || payslips.length === 0}
              >
                {generatingReport ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                PDF Report
              </Button>
              <Button
                onClick={() => setIsEditOpen(true)}
                variant="outline"
                size="sm"
                className="border-border text-foreground hover:bg-muted gap-2"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            </div>
          </div>

          <Separator className="my-5 bg-border" />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <InfoItem icon={Mail} label="Email" value={employee.email} />
            <InfoItem icon={DollarSign} label="Monthly Salary" value={formatCurrency(employee.salary)} highlight />
            <InfoItem icon={Clock} label="Overtime Hours" value={`${employee.overtimeHours}h`} />
            <InfoItem
              icon={DollarSign}
              label="Overtime Pay"
              value={formatCurrency(employee.overtimeHours * 250)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MiniStat label="Total Tasks" value={tasks.length} icon={ListTodo} color="text-primary" />
        <MiniStat label="Pending" value={pendingTasks} icon={Circle} color="text-sky-700" />
        <MiniStat label="In Progress" value={inProgressTasks} icon={Clock} color="text-blue-400" />
        <MiniStat label="Completed" value={doneTasks} icon={CheckCircle2} color="text-blue-700" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tasks */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-foreground text-base flex items-center gap-2">
              <ListTodo className="h-4 w-4 text-primary" />
              Tasks
            </CardTitle>
            <span className="text-xs text-muted-foreground">{tasks.length} total</span>
          </CardHeader>
          <CardContent className="p-0">
            {tasksLoading ? (
              <div className="p-4 space-y-2">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full bg-muted" />)}
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <ListTodo className="mx-auto h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm">No tasks assigned</p>
              </div>
            ) : (
              <div className="divide-y divide-border max-h-80 overflow-y-auto">
                {tasks.map((task) => {
                  const isOverdue = task.dueDate.toDate() < new Date() && task.status !== 'done';
                  const proj = projects.find((p) => p.id === task.projectId);
                  return (
                    <div key={task.id} className="px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {proj && (
                            <Link
                              to={`/projects/${task.projectId}`}
                              className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 truncate max-w-[140px]"
                            >
                              <FolderKanban className="h-3 w-3 shrink-0" />
                              {proj.title}
                            </Link>
                          )}
                          <span className={`text-xs ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                            · {isOverdue ? '⚠ ' : ''}{formatDateShort(task.dueDate)}
                          </span>
                        </div>
                      </div>
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                        className={`text-xs rounded-full px-2 py-1 border font-medium cursor-pointer bg-transparent ${getStatusColor(task.status)}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="inProgress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Projects */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-foreground text-base flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-primary" />
                Projects
              </CardTitle>
              <span className="text-xs text-muted-foreground">{assignedProjects.length} assigned</span>
            </CardHeader>
            <CardContent className="p-0">
              {assignedProjects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FolderKanban className="mx-auto h-8 w-8 mb-2 opacity-20" />
                  <p className="text-sm">Not assigned to any projects</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {assignedProjects.map((project) => (
                    <Link
                      key={project.id}
                      to={`/projects/${project.id}`}
                      className="px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors group"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                          {project.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          KPI: {project.kpiPercent}% · Due {formatDateShort(project.deadline)}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`${getStatusColor(project.status)} border text-xs shrink-0 ml-2`}
                      >
                        {formatStatus(project.status)}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payslips */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-foreground text-base flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" />
                Payslips
              </CardTitle>
              <span className="text-xs text-muted-foreground">{payslips.length} records</span>
            </CardHeader>
            <CardContent className="p-0">
              {payslipsLoading ? (
                <div className="p-4 space-y-2">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full bg-muted" />)}
                </div>
              ) : payslips.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Receipt className="mx-auto h-8 w-8 mb-2 opacity-20" />
                  <p className="text-sm">No payslips generated</p>
                </div>
              ) : (
                <div className="divide-y divide-border max-h-64 overflow-y-auto">
                  {payslips.map((payslip) => (
                    <div key={payslip.id} className="px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {formatMonthYear(payslip.month)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Basic: {formatCurrency(payslip.basicSalary)} + OT: {formatCurrency(payslip.overtimePay)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-primary">{formatCurrency(payslip.netPay)}</p>
                        {payslip.deductions > 0 && (
                          <p className="text-xs text-destructive">-{formatCurrency(payslip.deductions)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Employee</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Update the employee's details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditEmployee}>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-foreground text-sm">Full Name</Label>
                  <Input
                    name="name"
                    defaultValue={employee.name}
                    required
                    disabled={isSubmitting}
                    className="bg-muted/50 border-border text-foreground h-9"
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-foreground text-sm">Email</Label>
                  <Input
                    name="email"
                    type="email"
                    defaultValue={employee.email}
                    required
                    disabled={isSubmitting}
                    className="bg-muted/50 border-border text-foreground h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-foreground text-sm">Department</Label>
                  <Input
                    name="department"
                    defaultValue={employee.department}
                    required
                    disabled={isSubmitting}
                    className="bg-muted/50 border-border text-foreground h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-foreground text-sm">Overtime Hours</Label>
                  <Input
                    name="overtimeHours"
                    type="number"
                    min="0"
                    step="0.5"
                    defaultValue={employee.overtimeHours}
                    disabled={isSubmitting}
                    className="bg-muted/50 border-border text-foreground h-9"
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-foreground text-sm">Monthly Salary (₹)</Label>
                  <Input
                    name="salary"
                    type="number"
                    min="0"
                    step="1000"
                    defaultValue={employee.salary}
                    required
                    disabled={isSubmitting}
                    className="bg-muted/50 border-border text-foreground h-9"
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                className="border-border text-foreground hover:bg-muted"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <p className={`text-sm font-semibold truncate ${highlight ? 'text-primary' : 'text-foreground'}`}>
        {value}
      </p>
    </div>
  );
}

function MiniStat({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <Icon className={`h-4 w-4 ${color}`} />
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}
