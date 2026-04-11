import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTasks, useEmployees, useProjects } from '@/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import {
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Circle,
  Trash2,
  MoreHorizontal,
  ListTodo,
  Loader2,
  FolderKanban,
  X,
} from 'lucide-react';
import { formatDateShort, getStatusColor, formatStatus } from '@/lib/utils/formatters';
import type { TaskStatus } from '@/types';
import { Timestamp } from 'firebase/firestore';
import { toast } from 'sonner';

const STATUS_OPTIONS: { value: TaskStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'inProgress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

export default function TasksPage() {
  const { tasks, loading, addTask, updateTask, deleteTask } = useTasks();
  const { employees } = useEmployees();
  const { projects } = useProjects();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const getEmployeeName = (id: string) => employees.find((e) => e.id === id)?.name || 'Unknown';
  const getProjectTitle = (id: string) => projects.find((p) => p.id === id)?.title || 'Unknown';

  const filteredTasks = tasks.filter((task) => {
    const empName = getEmployeeName(task.employeeId);
    const projTitle = getProjectTitle(task.projectId);
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      empName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      projTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesProject = projectFilter === 'all' || task.projectId === projectFilter;
    return matchesSearch && matchesStatus && matchesProject;
  });

  const pendingCount = tasks.filter((t) => t.status === 'pending').length;
  const inProgressCount = tasks.filter((t) => t.status === 'inProgress').length;
  const doneCount = tasks.filter((t) => t.status === 'done').length;

  // Selection helpers
  const allFilteredSelected = filteredTasks.length > 0 && filteredTasks.every((t) => selectedIds.has(t.id));
  const someSelected = selectedIds.size > 0;

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTasks.map((t) => t.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkStatusUpdate = async (status: TaskStatus) => {
    const ids = Array.from(selectedIds);
    try {
      await Promise.all(ids.map((id) => updateTask(id, { status })));
      toast.success(`${ids.length} task${ids.length !== 1 ? 's' : ''} updated to "${formatStatus(status)}"`);
      setSelectedIds(new Set());
    } catch {
      toast.error('Failed to update tasks');
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (!confirm(`Delete ${ids.length} selected task${ids.length !== 1 ? 's' : ''}?`)) return;
    try {
      await Promise.all(ids.map((id) => deleteTask(id)));
      toast.success(`${ids.length} task${ids.length !== 1 ? 's' : ''} deleted`);
      setSelectedIds(new Set());
    } catch {
      toast.error('Failed to delete tasks');
    }
  };

  const handleAddTask = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      const dueDate = new Date(formData.get('dueDate') as string);
      await addTask({
        projectId: formData.get('projectId') as string,
        employeeId: formData.get('employeeId') as string,
        title: formData.get('title') as string,
        status: 'pending' as TaskStatus,
        dueDate: Timestamp.fromDate(dueDate),
      });
      setIsAddDialogOpen(false);
      toast.success('Task added');
    } catch {
      toast.error('Failed to add task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    try {
      await updateTask(taskId, { status });
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      await deleteTask(taskId);
      toast.success('Task deleted');
    } catch {
      toast.error('Failed to delete task');
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''} across all projects
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
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
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddTask(new FormData(e.currentTarget));
              }}
            >
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label className="text-foreground text-sm">Task Title</Label>
                  <Input
                    name="title"
                    required
                    disabled={isSubmitting}
                    className="bg-muted/50 border-border text-foreground h-9"
                    placeholder="e.g. Design homepage mockup"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-foreground text-sm">Project</Label>
                  <Select name="projectId" required>
                    <SelectTrigger className="bg-muted/50 border-border text-foreground h-9">
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {projects.length === 0 ? (
                        <SelectItem value="_none" disabled>No projects available</SelectItem>
                      ) : (
                        projects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
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
                  <Label className="text-foreground text-sm">Due Date</Label>
                  <Input
                    name="dueDate"
                    type="date"
                    required
                    disabled={isSubmitting}
                    className="bg-muted/50 border-border text-foreground h-9"
                  />
                </div>
              </div>
              <DialogFooter className="mt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
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
                  Add Task
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Pending"
          count={pendingCount}
          icon={Circle}
          color="text-yellow-400"
          bg="bg-yellow-400/10"
        />
        <StatCard
          label="In Progress"
          count={inProgressCount}
          icon={Clock}
          color="text-blue-400"
          bg="bg-blue-400/10"
        />
        <StatCard
          label="Done"
          count={doneCount}
          icon={CheckCircle2}
          color="text-emerald-400"
          bg="bg-emerald-400/10"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title, employee, or project..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground h-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v || 'all')}>
          <SelectTrigger className="w-full sm:w-44 bg-muted/50 border-border text-foreground h-10">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={projectFilter} onValueChange={(v) => setProjectFilter(v || 'all')}>
          <SelectTrigger className="w-full sm:w-52 bg-muted/50 border-border text-foreground h-10">
            <SelectValue placeholder="All Projects" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-foreground text-base">All Tasks</CardTitle>
          <CardDescription className="text-muted-foreground text-xs">
            {filteredTasks.length} result{filteredTasks.length !== 1 ? 's' : ''}
            {searchQuery && ` for "${searchQuery}"`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full bg-muted" />
              ))}
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <ListTodo className="mx-auto h-12 w-12 mb-3 opacity-20" />
              <p className="font-medium">No tasks found</p>
              <p className="text-sm mt-1">
                {searchQuery || statusFilter !== 'all' || projectFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Add your first task to get started'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  {/* Select All Checkbox */}
                  <TableHead className="w-10 pl-4">
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-border bg-muted/50 accent-primary cursor-pointer"
                      title="Select all"
                    />
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wide">Task</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wide">Project</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wide">Assigned To</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wide">Due Date</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wide">Status</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wide text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task) => {
                  const empName = getEmployeeName(task.employeeId);
                  const projTitle = getProjectTitle(task.projectId);
                  const isOverdue = task.dueDate.toDate() < new Date() && task.status !== 'done';
                  const isSelected = selectedIds.has(task.id);

                  return (
                    <TableRow
                      key={task.id}
                      className={`border-border hover:bg-muted/30 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}
                    >
                      <TableCell className="w-10 pl-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(task.id)}
                          className="h-4 w-4 rounded border-border bg-muted/50 accent-primary cursor-pointer"
                        />
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-foreground text-sm max-w-[220px] truncate">
                          {task.title}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Link
                          to={`/projects/${task.projectId}`}
                          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                          <FolderKanban className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate max-w-[140px]">{projTitle}</span>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link
                          to={`/employees/${task.employeeId}`}
                          className="flex items-center gap-2 group"
                        >
                          <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                            <span className="text-primary text-xs font-semibold">
                              {empName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors truncate max-w-[100px]">
                            {empName}
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-sm ${isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}
                        >
                          {isOverdue ? '⚠ ' : ''}{formatDateShort(task.dueDate)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={task.status}
                          onValueChange={(v) =>
                            v && handleStatusChange(task.id, v as TaskStatus)
                          }
                        >
                          <SelectTrigger className="h-7 text-xs bg-transparent border-0 p-0 w-auto gap-1 focus:ring-0 [&>svg]:h-3 [&>svg]:w-3">
                            <Badge
                              variant="outline"
                              className={`${getStatusColor(task.status)} border text-xs`}
                            >
                              {formatStatus(task.status)}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="inProgress">In Progress</SelectItem>
                            <SelectItem value="done">Done</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end" className="bg-popover border-border w-36">
                            <DropdownMenuItem
                              onClick={() => handleDelete(task.id)}
                              className="text-destructive hover:bg-destructive/10 cursor-pointer gap-2"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Bulk Action Bar */}
      {someSelected && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-3 bg-card border border-border rounded-xl shadow-2xl px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-foreground font-medium shrink-0">
              <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full font-bold">
                {selectedIds.size}
              </span>
              selected
            </div>
            <div className="w-px h-5 bg-border" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground shrink-0">Mark as:</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkStatusUpdate('pending')}
                className="h-7 text-xs border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
              >
                Pending
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkStatusUpdate('inProgress')}
                className="h-7 text-xs border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
              >
                In Progress
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkStatusUpdate('done')}
                className="h-7 text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
              >
                Done
              </Button>
            </div>
            <div className="w-px h-5 bg-border" />
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkDelete}
              className="h-7 text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Delete
            </Button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-muted-foreground hover:text-foreground transition-colors ml-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  count,
  icon: Icon,
  color,
  bg,
}: {
  label: string;
  count: number;
  icon: React.ElementType;
  color: string;
  bg: string;
}) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`p-2.5 rounded-lg ${bg} shrink-0`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{count}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
