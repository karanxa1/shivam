import { useState } from 'react';
import { usePayslips, useEmployees } from '@/hooks';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Plus,
  Search,
  Receipt,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  Printer,
} from 'lucide-react';
import { formatCurrency, formatMonthYear, formatDateShort, getCurrentMonth } from '@/lib/utils/formatters';
import type { Employee, Payslip } from '@/types';
import { toast } from 'sonner';

function printPayslip(payslip: Payslip, employeeName: string) {
  const win = window.open('', '_blank', 'width=700,height=900');
  if (!win) {
    toast.error('Popup blocked. Please allow popups for this site.');
    return;
  }

  const monthLabel = formatMonthYear(payslip.month);
  const generatedDate = payslip.generatedAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Payslip - ${employeeName} - ${monthLabel}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #1a1a2e; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #6366f1; padding-bottom: 20px; margin-bottom: 30px; }
    .company-name { font-size: 28px; font-weight: 800; color: #6366f1; letter-spacing: -0.5px; }
    .company-sub { font-size: 12px; color: #64748b; margin-top: 2px; }
    .payslip-badge { background: #6366f1; color: #fff; padding: 6px 16px; border-radius: 6px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #6366f1; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .info-item label { font-size: 11px; color: #64748b; display: block; margin-bottom: 2px; }
    .info-item span { font-size: 14px; font-weight: 500; color: #1a1a2e; }
    .earnings-table { width: 100%; border-collapse: collapse; }
    .earnings-table th { text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; padding: 8px 12px; background: #f8fafc; }
    .earnings-table th:last-child { text-align: right; }
    .earnings-table td { padding: 10px 12px; border-top: 1px solid #f1f5f9; font-size: 13px; }
    .earnings-table td:last-child { text-align: right; font-weight: 600; }
    .earnings-table tr.positive td:last-child { color: #2563eb; }
    .earnings-table tr.negative td:last-child { color: #60a5fa; }
    .net-pay { display: flex; justify-content: space-between; align-items: center; background: #f0f0ff; border: 2px solid #6366f1; border-radius: 10px; padding: 16px 20px; margin-top: 20px; }
    .net-pay-label { font-size: 14px; font-weight: 700; color: #1a1a2e; }
    .net-pay-amount { font-size: 24px; font-weight: 800; color: #6366f1; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; }
    @media print {
      body { padding: 20px; }
      @page { margin: 1cm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company-name">FinManager</div>
      <div class="company-sub">Financial Management Platform</div>
    </div>
    <div class="payslip-badge">Payslip</div>
  </div>

  <div class="section">
    <div class="section-title">Employee Details</div>
    <div class="info-grid">
      <div class="info-item"><label>Employee Name</label><span>${employeeName}</span></div>
      <div class="info-item"><label>Pay Period</label><span>${monthLabel}</span></div>
      <div class="info-item"><label>Employee ID</label><span>${payslip.employeeId}</span></div>
      <div class="info-item"><label>Generated On</label><span>${generatedDate}</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Earnings & Deductions</div>
    <table class="earnings-table">
      <thead>
        <tr>
          <th>Description</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr class="positive">
          <td>Basic Salary</td>
          <td>₹${payslip.basicSalary.toLocaleString('en-IN')}</td>
        </tr>
        <tr class="positive">
          <td>Overtime Pay</td>
          <td>+ ₹${payslip.overtimePay.toLocaleString('en-IN')}</td>
        </tr>
        <tr class="negative">
          <td>Deductions</td>
          <td>- ₹${payslip.deductions.toLocaleString('en-IN')}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="net-pay">
    <span class="net-pay-label">Net Pay</span>
    <span class="net-pay-amount">₹${payslip.netPay.toLocaleString('en-IN')}</span>
  </div>

  <div class="footer">
    <span>This is a computer-generated payslip and does not require a signature.</span>
    <span>FinManager · ${new Date().getFullYear()}</span>
  </div>

  <script>window.onload = function() { window.print(); };<\/script>
</body>
</html>`);
  win.document.close();
}

export default function PayslipsPage() {
  const { payslips, loading, generatePayslip } = usePayslips();
  const { employees, loading: employeesLoading } = useEmployees();
  const [searchQuery, setSearchQuery] = useState('');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [deductions, setDeductions] = useState<string>('0');
  const [payslipMonth, setPayslipMonth] = useState(getCurrentMonth());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const uniqueMonths = [...new Set(payslips.map(p => p.month))].sort().reverse();

  const getEmployeeName = (employeeId: string) => {
    const emp = employees.find(e => e.id === employeeId);
    return emp?.name || 'Unknown';
  };

  const filteredPayslips = payslips.filter((payslip) => {
    const employeeName = getEmployeeName(payslip.employeeId);
    const matchesSearch = employeeName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMonth = monthFilter === 'all' || payslip.month === monthFilter;
    return matchesSearch && matchesMonth;
  });

  const handleGeneratePayslip = async () => {
    if (!selectedEmployee) {
      toast.error('Please select an employee');
      return;
    }
    setIsSubmitting(true);
    try {
      await generatePayslip(selectedEmployee, payslipMonth, parseFloat(deductions) || 0);
      setIsGenerateDialogOpen(false);
      setSelectedEmployee(null);
      setDeductions('0');
      toast.success('Payslip generated successfully');
    } catch {
      toast.error('Failed to generate payslip');
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewOvertimePay = selectedEmployee ? selectedEmployee.overtimeHours * 250 : 0;
  const previewTotalEarnings = selectedEmployee ? selectedEmployee.salary + previewOvertimePay : 0;
  const previewNetPay = previewTotalEarnings - (parseFloat(deductions) || 0);

  // Summary stats
  const totalNetPay = filteredPayslips.reduce((sum, p) => sum + p.netPay, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payslips</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Generate and manage employee payslips
          </p>
        </div>
        <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
          <DialogTrigger
            render={
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                <Plus className="h-4 w-4" />
                Generate Payslip
              </Button>
            }
          />
          <DialogContent className="bg-card border-border sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-foreground">Generate Payslip</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Select an employee and configure the payslip details.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-foreground text-sm">Employee</Label>
                <Select
                  value={selectedEmployee?.id || ''}
                  onValueChange={(value) => {
                    const emp = employees.find(e => e.id === value);
                    setSelectedEmployee(emp || null);
                  }}
                >
                  <SelectTrigger className="bg-muted/50 border-border text-foreground h-9">
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.name} · {emp.department}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-foreground text-sm">Month</Label>
                  <Input
                    type="month"
                    value={payslipMonth}
                    onChange={(e) => setPayslipMonth(e.target.value)}
                    className="bg-muted/50 border-border text-foreground h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-foreground text-sm">Deductions (₹)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={deductions}
                    onChange={(e) => setDeductions(e.target.value)}
                    className="bg-muted/50 border-border text-foreground h-9"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Preview */}
              {selectedEmployee && (
                <div className="rounded-xl bg-muted/30 border border-border p-4 space-y-2.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Payslip Preview</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5 text-blue-700" />
                        Basic Salary
                      </span>
                      <span className="text-foreground font-medium">{formatCurrency(selectedEmployee.salary)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5 text-blue-400" />
                        Overtime ({selectedEmployee.overtimeHours}h × ₹250)
                      </span>
                      <span className="text-foreground font-medium">+{formatCurrency(previewOvertimePay)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                        Deductions
                      </span>
                      <span className="text-destructive font-medium">-{formatCurrency(parseFloat(deductions) || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-border">
                      <span className="font-semibold text-foreground">Net Pay</span>
                      <span className="text-primary font-bold text-base">{formatCurrency(previewNetPay)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsGenerateDialogOpen(false)} className="border-border text-foreground hover:bg-muted">
                Cancel
              </Button>
              <Button
                onClick={handleGeneratePayslip}
                disabled={isSubmitting || !selectedEmployee}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary */}
      {filteredPayslips.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Payslips</p>
              <p className="text-2xl font-bold text-foreground mt-1">{filteredPayslips.length}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Disbursed</p>
              <p className="text-2xl font-bold text-primary mt-1">{formatCurrency(totalNetPay)}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border col-span-2 sm:col-span-1">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Avg Net Pay</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {filteredPayslips.length > 0 ? formatCurrency(Math.round(totalNetPay / filteredPayslips.length)) : '₹0'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by employee name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground h-10"
          />
        </div>
        <Select value={monthFilter} onValueChange={(value) => setMonthFilter(value || 'all')}>
          <SelectTrigger className="w-full sm:w-52 bg-muted/50 border-border text-foreground h-10">
            <SelectValue placeholder="All Months" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="all">All Months</SelectItem>
            {uniqueMonths.map((month) => (
              <SelectItem key={month} value={month}>
                {formatMonthYear(month)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-foreground text-base">Payslip Records</CardTitle>
          <CardDescription className="text-muted-foreground text-xs">
            {filteredPayslips.length} record{filteredPayslips.length !== 1 ? 's' : ''}
            {monthFilter !== 'all' && ` for ${formatMonthYear(monthFilter)}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading || employeesLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full bg-muted" />)}
            </div>
          ) : filteredPayslips.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Receipt className="mx-auto h-12 w-12 mb-3 opacity-20" />
              <p className="font-medium">No payslips found</p>
              <p className="text-sm mt-1">
                {searchQuery || monthFilter !== 'all' ? 'Try different filters' : 'Generate your first payslip to get started'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wide pl-6">Employee</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wide">Month</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wide">Basic</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wide">Overtime</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wide">Deductions</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wide">Net Pay</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wide">Generated</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wide pr-6 text-right">Print</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayslips.map((payslip) => {
                  const empName = getEmployeeName(payslip.employeeId);
                  return (
                    <TableRow key={payslip.id} className="border-border hover:bg-muted/30 transition-colors">
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0">
                            <span className="text-primary font-semibold text-xs">
                              {empName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium text-foreground text-sm">{empName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-border text-foreground text-xs">
                          {formatMonthYear(payslip.month)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatCurrency(payslip.basicSalary)}
                      </TableCell>
                      <TableCell>
                        <span className="text-blue-700 text-sm flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {formatCurrency(payslip.overtimePay)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-destructive text-sm flex items-center gap-1">
                          <Minus className="h-3 w-3" />
                          {formatCurrency(payslip.deductions)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-primary font-bold text-sm">{formatCurrency(payslip.netPay)}</span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {formatDateShort(payslip.generatedAt)}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                          onClick={() => printPayslip(payslip, empName)}
                          title="Print payslip"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
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
