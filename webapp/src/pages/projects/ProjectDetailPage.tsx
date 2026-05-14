import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProject, useProjectTasks, useEmployees } from '@/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft,
  Plus, 
  Calendar,
  Users,
  Loader2,
  CheckCircle2,
  Clock,
  Circle,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { formatDateShort, getStatusColor, formatStatus } from '@/lib/utils/formatters';
import type { TaskStatus } from '@/types';
import { Timestamp } from 'firebase/firestore';
import { toast } from 'sonner';

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { project, loading: projectLoading } = useProject(projectId || null);
  const { tasks, loading: tasksLoading, addTask, updateTask, deleteTask } = useProjectTasks(projectId || null);
  const { employees } = useEmployees();
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddTask = async (formData: FormData) => {
    if (!projectId) return;
    setIsSubmitting(true);
    try {
      const dueDate = new Date(formData.get('dueDate') as string);
      await addTask({
        projectId,
        employeeId: formData.get('employeeId') as string,
        title: formData.get('title') as string,
        status: 'pending' as TaskStatus,
        dueDate: Timestamp.fromDate(dueDate),
      });
      setIsAddTaskOpen(false);
      toast.success('Task added');
    } catch {
      toast.error('Failed to add task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: TaskStatus) => {
    try {
      await updateTask(taskId, { status });
    } catch {
      toast.error('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      await deleteTask(taskId);
      toast.success('Task deleted');
    } catch {
      toast.error('Failed to delete task');
    }
  };

  if (projectLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32 bg-muted" />
        <Skeleton className="h-40 w-full bg-muted rounded-xl" />
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64 w-full bg-muted rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-muted-foreground">Project not found</p>
        <Button variant="outline" onClick={() => navigate('/projects')} className="mt-4 border-border text-foreground">
          Back to Projects
        </Button>
      </div>
    );
  }

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const inProgressTasks = tasks.filter(t => t.status === 'inProgress');
  const doneTasks = tasks.filter(t => t.status === 'done');
  const completionRate = tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Back */}
      <Button variant="ghost" onClick={() => navigate('/projects')} className="text-muted-foreground hover:text-foreground -ml-2 gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Projects
      </Button>

      {/* Project Header */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-foreground">{project.title}</h1>
                <Badge variant="outline" className={`${getStatusColor(project.status)} border text-xs`}>
                  {formatStatus(project.status)}
                </Badge>
              </div>
              {project.description && (
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{project.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  Due {formatDateShort(project.deadline)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  {project.assignedEmployeeIds.length} assigned
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-blue-700" />
                  {doneTasks.length}/{tasks.length} tasks done
                </span>
              </div>
            </div>
          </div>

          {/* KPI */}
          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4" />
                KPI Progress
              </span>
              <span className="text-primary font-bold text-lg">{project.kpiPercent}%</span>
            </div>
            <Progress value={project.kpiPercent} className="h-2.5 bg-muted" />
          </div>

          {/* Task completion */}
          {tasks.length > 0 && (
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Task Completion</span>
                <span>{completionRate}%</span>
              </div>
              <Progress value={completionRate} className="h-1.5 bg-muted" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tasks Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Tasks</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{tasks.length} total · {pendingTasks.length} pending · {inProgressTasks.length} in progress · {doneTasks.length} done</p>
        </div>
        <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
          <DialogTrigger
            render={
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                <Plus className="h-4 w-4" />
                Add Task
              </Button>
            }
          />
          <DialogContent className="bg-card border-border sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-foreground">Add New Task</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Create a task and assign it to an employee.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); handleAddTask(new FormData(e.currentTarget)); }}>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label htmlFor="title" className="text-foreground text-sm">Task Title</Label>
                  <Input id="title" name="title" required disabled={isSubmitting}
                    className="bg-muted/50 border-border text-foreground h-9" placeholder="e.g. Design homepage mockup" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-foreground text-sm">Assign To</Label>
                  <Select name="employeeId" required>
                    <SelectTrigger className="bg-muted/50 border-border text-foreground h-9">
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {employees.length === 0 ? (
                        <SelectItem value="_none" disabled>No employees available</SelectItem>
                      ) : (
                        employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.name} · {emp.department}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dueDate" className="text-foreground text-sm">Due Date</Label>
                  <Input id="dueDate" name="dueDate" type="date" required disabled={isSubmitting}
                    className="bg-muted/50 border-border text-foreground h-9" />
                </div>
              </div>
              <DialogFooter className="mt-2">
                <Button type="button" variant="outline" onClick={() => setIsAddTaskOpen(false)} className="border-border text-foreground hover:bg-muted">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Task
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Kanban Columns */}
      {tasksLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64 w-full bg-muted rounded-xl" />)}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <TaskColumn
            title="Pending"
            icon={Circle}
            iconColor="text-sky-700"
            headerBg="bg-sky-500/5 border-sky-500/20"
            tasks={pendingTasks}
            employees={employees}
            onStatusChange={handleUpdateTaskStatus}
            onDelete={handleDeleteTask}
          />
          <TaskColumn
            title="In Progress"
            icon={Clock}
            iconColor="text-blue-400"
            headerBg="bg-blue-400/5 border-blue-400/20"
            tasks={inProgressTasks}
            employees={employees}
            onStatusChange={handleUpdateTaskStatus}
            onDelete={handleDeleteTask}
          />
          <TaskColumn
            title="Done"
            icon={CheckCircle2}
            iconColor="text-blue-700"
            headerBg="bg-blue-500/5 border-blue-500/20"
            tasks={doneTasks}
            employees={employees}
            onStatusChange={handleUpdateTaskStatus}
            onDelete={handleDeleteTask}
          />
        </div>
      )}
    </div>
  );
}

interface TaskColumnProps {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  headerBg: string;
  tasks: { id: string; title: string; employeeId: string; status: TaskStatus; dueDate: Timestamp }[];
  employees: { id: string; name: string; department: string }[];
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onDelete: (taskId: string) => void;
}

function TaskColumn({ title, icon: Icon, iconColor, headerBg, tasks, employees, onStatusChange, onDelete }: TaskColumnProps) {
  const getEmployee = (id: string) => employees.find(e => e.id === id);

  return (
    <div className="flex flex-col gap-3">
      {/* Column Header */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${headerBg}`}>
        <Icon className={`h-4 w-4 ${iconColor}`} />
        <span className="text-sm font-medium text-foreground">{title}</span>
        <span className="ml-auto text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>

      {/* Tasks */}
      <div className="space-y-2 min-h-[120px]">
        {tasks.length === 0 ? (
          <div className="flex items-center justify-center h-20 rounded-xl border border-dashed border-border text-muted-foreground text-xs">
            No tasks
          </div>
        ) : (
          tasks.map((task) => {
            const emp = getEmployee(task.employeeId);
            const isOverdue = task.dueDate.toDate() < new Date() && task.status !== 'done';

            return (
              <Card key={task.id} className="bg-card border-border hover:border-border/80 transition-colors">
                <CardContent className="p-3 space-y-3">
                  <p className="text-foreground text-sm font-medium leading-snug">{task.title}</p>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center">
                        <span className="text-primary text-xs font-medium">
                          {emp?.name.charAt(0).toUpperCase() || '?'}
                        </span>
                      </div>
                      <span className="truncate max-w-[80px]">{emp?.name || 'Unknown'}</span>
                    </div>
                    <span className={isOverdue ? 'text-destructive' : ''}>
                      {formatDateShort(task.dueDate)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Select
                      value={task.status}
                      onValueChange={(value) => value && onStatusChange(task.id, value as TaskStatus)}
                    >
                      <SelectTrigger className="h-7 text-xs bg-muted/50 border-border flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="inProgress">In Progress</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                      onClick={() => onDelete(task.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
