import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useEmployees } from '@/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Pencil, 
  Trash2,
  Users,
  Loader2,
  Clock,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatters';
import type { Employee } from '@/types';
import { toast } from 'sonner';

export default function EmployeesPage() {
  const { employees, loading, addEmployee, updateEmployee, deleteEmployee } = useEmployees();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredEmployees = employees.filter((emp) =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddEmployee = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const password = formData.get('password') as string;

    if (!password || password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      await addEmployee({
        uid: '',
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        department: formData.get('department') as string,
        salary: parseFloat(formData.get('salary') as string),
        overtimeHours: parseFloat(formData.get('overtimeHours') as string) || 0,
        password,
      });
      form.reset();
      setIsAddDialogOpen(false);
      toast.success('Employee added with login credentials');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to add employee';
      if (msg.includes('email-already-in-use')) {
        toast.error('An account with this email already exists');
      } else {
        toast.error(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateEmployee = async (formData: FormData) => {
    if (!editingEmployee) return;
    setIsSubmitting(true);
    try {
      await updateEmployee(editingEmployee.id, {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        department: formData.get('department') as string,
        salary: parseFloat(formData.get('salary') as string),
        overtimeHours: parseFloat(formData.get('overtimeHours') as string) || 0,
      });
      setEditingEmployee(null);
      toast.success('Employee updated successfully');
    } catch {
      toast.error('Failed to update employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;
    try {
      await deleteEmployee(id);
      toast.success('Employee deleted');
    } catch {
      toast.error('Failed to delete employee');
    }
  };

  // Department color map
  const deptColors: Record<string, string> = {
    engineering: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    design: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    marketing: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    finance: 'bg-primary/10 text-primary border-primary/20',
    hr: 'bg-green-500/10 text-green-400 border-green-500/20',
    sales: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  };

  const getDeptColor = (dept: string) =>
    deptColors[dept.toLowerCase()] || 'bg-muted text-muted-foreground border-border';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Employees</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {employees.length} team member{employees.length !== 1 ? 's' : ''} in your organization
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger
            render={
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                <Plus className="h-4 w-4" />
                Add Employee
              </Button>
            }
          />
          <DialogContent className="bg-card border-border sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-foreground">Add New Employee</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Fill in the employee's details below.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddEmployee}>
              <EmployeeForm isSubmitting={isSubmitting} />
              <DialogFooter className="mt-2">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} className="border-border text-foreground hover:bg-muted">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Employee
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or department..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground h-10"
        />
      </div>

      {/* Table */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-foreground text-base">All Employees</CardTitle>
          <CardDescription className="text-muted-foreground text-xs">
            {filteredEmployees.length} result{filteredEmployees.length !== 1 ? 's' : ''}
            {searchQuery && ` for "${searchQuery}"`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full bg-muted" />
              ))}
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="mx-auto h-12 w-12 mb-3 opacity-20" />
              <p className="font-medium">No employees found</p>
              <p className="text-sm mt-1">
                {searchQuery ? 'Try a different search term' : 'Add your first employee to get started'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wide pl-6">Employee</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wide">Department</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wide">Salary</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wide">Overtime</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wide text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.id} className="border-border hover:bg-muted/30 transition-colors">
                    <TableCell className="pl-6">
                      <Link to={`/employees/${employee.id}`} className="flex items-center gap-3 group">
                        <div className="w-9 h-9 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0">
                          <span className="text-primary font-semibold text-sm">
                            {employee.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm group-hover:text-primary transition-colors">{employee.name}</p>
                          <p className="text-xs text-muted-foreground">{employee.email}</p>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${getDeptColor(employee.department)} border text-xs`}>
                        {employee.department}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-primary font-semibold text-sm">
                      {formatCurrency(employee.salary)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                        <Clock className="h-3.5 w-3.5" />
                        {employee.overtimeHours}h
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end" className="bg-popover border-border w-40">
                          <DropdownMenuItem
                            onClick={() => setEditingEmployee(employee)}
                            className="text-foreground hover:bg-muted cursor-pointer gap-2"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteEmployee(employee.id)}
                            className="text-destructive hover:bg-destructive/10 cursor-pointer gap-2"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingEmployee} onOpenChange={() => setEditingEmployee(null)}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Employee</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Update the employee's details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleUpdateEmployee(new FormData(e.currentTarget)); }}>
            <EmployeeForm employee={editingEmployee} isSubmitting={isSubmitting} />
            <DialogFooter className="mt-2">
              <Button type="button" variant="outline" onClick={() => setEditingEmployee(null)} className="border-border text-foreground hover:bg-muted">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground hover:bg-primary/90">
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

interface EmployeeFormProps {
  employee?: Employee | null;
  isSubmitting?: boolean;
}

function EmployeeForm({ employee, isSubmitting }: EmployeeFormProps) {
  const isEditing = !!employee;
  return (
    <div className="space-y-4 py-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="name" className="text-foreground text-sm">Full Name</Label>
          <Input id="name" name="name" defaultValue={employee?.name || ''} required disabled={isSubmitting}
            className="bg-muted/50 border-border text-foreground h-9" placeholder="John Doe" />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="email" className="text-foreground text-sm">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={employee?.email || ''} required disabled={isSubmitting}
            className="bg-muted/50 border-border text-foreground h-9" placeholder="john@company.com" />
        </div>
        {!isEditing && (
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="password" className="text-foreground text-sm">Password</Label>
            <Input id="password" name="password" type="password" required disabled={isSubmitting}
              className="bg-muted/50 border-border text-foreground h-9" placeholder="Min 6 characters" minLength={6} />
            <p className="text-xs text-muted-foreground">Employee will use this password to sign in</p>
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="department" className="text-foreground text-sm">Department</Label>
          <Input id="department" name="department" defaultValue={employee?.department || ''} required disabled={isSubmitting}
            className="bg-muted/50 border-border text-foreground h-9" placeholder="Engineering" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="overtimeHours" className="text-foreground text-sm">Overtime Hours</Label>
          <Input id="overtimeHours" name="overtimeHours" type="number" min="0" step="0.5"
            defaultValue={employee?.overtimeHours ?? 0} disabled={isSubmitting}
            className="bg-muted/50 border-border text-foreground h-9" placeholder="0" />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="salary" className="text-foreground text-sm">Monthly Salary (₹)</Label>
          <Input id="salary" name="salary" type="number" min="0" step="1000"
            defaultValue={employee?.salary || ''} required disabled={isSubmitting}
            className="bg-muted/50 border-border text-foreground h-9" placeholder="50000" />
        </div>
      </div>
    </div>
  );
}
