import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  doc,
  updateDoc,
  getDoc,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  ClipboardList,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { formatDateShort, getStatusColor, formatStatus } from '@/lib/utils/formatters';
import type { Task, TaskStatus } from '@/types';
import { toast } from 'sonner';
import { createNotification } from '@/hooks';

export default function MyTasksPage() {
  const { appUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Find employee doc ID from user UID, then fetch tasks
  useEffect(() => {
    if (!appUser) return;

    const fetchTasks = async () => {
      // First find the employee document by uid
      const empQuery = query(
        collection(db, 'employees'),
        where('uid', '==', appUser.uid)
      );
      const empSnapshot = await getDocs(empQuery);

      if (empSnapshot.empty) {
        setLoading(false);
        return;
      }

      const employeeDocId = empSnapshot.docs[0].id;

      // Now listen to tasks for this employee
      const tasksQuery = query(
        collection(db, 'tasks'),
        where('employeeId', '==', employeeDocId),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(
        tasksQuery,
        (snapshot) => {
          const taskList: Task[] = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          } as Task));
          setTasks(taskList);
          setLoading(false);
        },
        (err) => {
          console.error('Error fetching tasks:', err);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    };

    fetchTasks();
  }, [appUser]);

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await updateDoc(doc(db, 'tasks', taskId), { status: newStatus });

      // If task is completed, notify the project creator
      if (newStatus === 'done') {
        const task = tasks.find(t => t.id === taskId);
        if (task?.projectId) {
          const projectDoc = await getDoc(doc(db, 'projects', task.projectId));
          if (projectDoc.exists()) {
            const createdBy = projectDoc.data()?.createdBy as string;
            if (createdBy) {
              await createNotification(
                db,
                createdBy,
                'task_done',
                'Task Completed',
                `Task "${task.title}" has been marked as done`
              );
            }
          }
        }
      }

      toast.success(`Task status updated to ${formatStatus(newStatus)}`);
    } catch {
      toast.error('Failed to update task status');
    }
  };

  const filtered = tasks.filter((t) => {
    const matchSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const now = new Date();
  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const inProgressCount = tasks.filter(t => t.status === 'inProgress').length;
  const overdueCount = tasks.filter(t =>
    t.status !== 'done' && t.dueDate?.toDate?.() < now
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Tasks</h1>
        <p className="text-muted-foreground text-sm mt-0.5">View and manage your assigned tasks</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10 shrink-0">
              <Clock className="h-4 w-4 text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="text-lg font-bold text-foreground">{pendingCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 shrink-0">
              <ClipboardList className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">In Progress</p>
              <p className="text-lg font-bold text-foreground">{inProgressCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10 shrink-0">
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Overdue</p>
              <p className="text-lg font-bold text-destructive">{overdueCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
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
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="inProgress">In Progress</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-foreground text-base">Tasks</CardTitle>
          <CardDescription className="text-muted-foreground text-xs">
            {filtered.length} task{filtered.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full bg-muted" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <ClipboardList className="mx-auto h-12 w-12 mb-3 opacity-20" />
              <p className="font-medium">No tasks found</p>
              <p className="text-sm mt-1">
                {searchQuery || statusFilter !== 'all' ? 'Try different filters' : 'No tasks assigned yet'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wide pl-6">Task</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wide">Due Date</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wide">Status</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wide pr-6 text-right">Update</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((task) => {
                  const isOverdue = task.status !== 'done' && task.dueDate?.toDate?.() < now;
                  return (
                    <TableRow key={task.id} className="border-border hover:bg-muted/30 transition-colors">
                      <TableCell className="pl-6">
                        <div>
                          <p className="font-medium text-foreground text-sm">{task.title}</p>
                          {isOverdue && (
                            <p className="text-xs text-destructive flex items-center gap-1 mt-0.5">
                              <AlertTriangle className="h-3 w-3" /> Overdue
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {task.dueDate ? formatDateShort(task.dueDate) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${getStatusColor(task.status)} border text-xs`}>
                          {formatStatus(task.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        {task.status !== 'done' && (
                          <Select
                            value={task.status}
                            onValueChange={(v) => v && handleStatusChange(task.id, v as TaskStatus)}
                          >
                            <SelectTrigger className="w-32 h-8 bg-muted/50 border-border text-foreground text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="inProgress">In Progress</SelectItem>
                              <SelectItem value="done">Done</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
