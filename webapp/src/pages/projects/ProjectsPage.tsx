import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProjects } from '@/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Search,
  FolderKanban,
  Calendar,
  Users,
  Loader2,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { formatDateShort, getStatusColor, formatStatus } from '@/lib/utils/formatters';
import type { Project, ProjectStatus } from '@/types';
import { Timestamp } from 'firebase/firestore';
import { toast } from 'sonner';

export default function ProjectsPage() {
  const { projects, loading, addProject } = useProjects();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingProjects = filteredProjects.filter(p => p.status === 'pending');
  const activeProjects = filteredProjects.filter(p => p.status === 'active');
  const completedProjects = filteredProjects.filter(p => p.status === 'completed');

  const handleAddProject = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      const deadline = new Date(formData.get('deadline') as string);
      const descriptionVal = (formData.get('description') as string)?.trim();
      await addProject({
        title: formData.get('title') as string,
        description: descriptionVal || undefined,
        status: formData.get('status') as ProjectStatus,
        kpiPercent: parseInt(formData.get('kpiPercent') as string) || 0,
        assignedEmployeeIds: [],
        deadline: Timestamp.fromDate(deadline),
      });
      setIsAddDialogOpen(false);
      toast.success('Project created successfully');
    } catch {
      toast.error('Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {projects.length} project{projects.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger
            render={
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            }
          />
          <DialogContent className="bg-card border-border sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-foreground">Create New Project</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Enter the project details below.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); handleAddProject(new FormData(e.currentTarget)); }}>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label htmlFor="title" className="text-foreground text-sm">Project Title</Label>
                  <Input id="title" name="title" required disabled={isSubmitting}
                    className="bg-muted/50 border-border text-foreground h-9" placeholder="e.g. Website Redesign" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="description" className="text-foreground text-sm">Description (optional)</Label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    disabled={isSubmitting}
                    className="w-full rounded-md bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground text-sm px-3 py-2 resize-none outline-none focus:ring-1 focus:ring-primary/50"
                    placeholder="Brief description of the project..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-foreground text-sm">Status</Label>
                    <Select name="status" defaultValue="pending">
                      <SelectTrigger className="bg-muted/50 border-border text-foreground h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="kpiPercent" className="text-foreground text-sm">Initial KPI (%)</Label>
                    <Input id="kpiPercent" name="kpiPercent" type="number" min="0" max="100" defaultValue="0"
                      disabled={isSubmitting} className="bg-muted/50 border-border text-foreground h-9" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="deadline" className="text-foreground text-sm">Deadline</Label>
                  <Input id="deadline" name="deadline" type="date" required disabled={isSubmitting}
                    className="bg-muted/50 border-border text-foreground h-9" />
                </div>
              </div>
              <DialogFooter className="mt-2">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} className="border-border text-foreground hover:bg-muted">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Project
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground h-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value || 'all')}>
          <SelectTrigger className="w-full sm:w-44 bg-muted/50 border-border text-foreground h-10">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="bg-muted/50 border border-border h-9 p-1">
          <TabsTrigger value="all" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-7 px-3">
            All ({filteredProjects.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-7 px-3">
            Pending ({pendingProjects.length})
          </TabsTrigger>
          <TabsTrigger value="active" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-7 px-3">
            Active ({activeProjects.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-7 px-3">
            Completed ({completedProjects.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <ProjectGrid projects={filteredProjects} loading={loading} />
        </TabsContent>
        <TabsContent value="pending">
          <ProjectGrid projects={pendingProjects} loading={loading} />
        </TabsContent>
        <TabsContent value="active">
          <ProjectGrid projects={activeProjects} loading={loading} />
        </TabsContent>
        <TabsContent value="completed">
          <ProjectGrid projects={completedProjects} loading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProjectGrid({ projects, loading }: { projects: Project[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-52 w-full bg-muted rounded-xl" />
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <FolderKanban className="h-12 w-12 mb-3 opacity-20" />
        <p className="font-medium">No projects found</p>
        <p className="text-sm mt-1">Create a new project to get started</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const assignedCount = project.assignedEmployeeIds.length;
  const isOverdue = project.deadline.toDate() < new Date() && project.status !== 'completed';

  return (
    <Link to={`/projects/${project.id}`}>
      <Card className="bg-card border-border hover:border-primary/30 transition-all cursor-pointer h-full group hover:shadow-lg hover:shadow-black/20">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-foreground text-sm font-semibold line-clamp-2 leading-snug group-hover:text-primary transition-colors">
              {project.title}
            </CardTitle>
            <Badge 
              variant="outline" 
              className={`${getStatusColor(project.status)} border text-xs shrink-0`}
            >
              {formatStatus(project.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* KPI Progress */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Progress
              </span>
              <span className="text-primary font-semibold">{project.kpiPercent}%</span>
            </div>
            <Progress value={project.kpiPercent} className="h-1.5 bg-muted" />
          </div>

          {/* Meta */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className={`flex items-center gap-1 ${isOverdue ? 'text-destructive' : ''}`}>
              <Calendar className="h-3.5 w-3.5" />
              {isOverdue ? 'Overdue · ' : ''}{formatDateShort(project.deadline)}
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {assignedCount}
            </div>
          </div>

          {/* CTA */}
          <div className="flex items-center justify-end text-primary text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            View Details
            <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
