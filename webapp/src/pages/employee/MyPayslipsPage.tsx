import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
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
  Receipt,
  Download,
  DollarSign,
} from 'lucide-react';
import { formatCurrency, formatMonthYear } from '@/lib/utils/formatters';
import type { Payslip } from '@/types';
import { toast } from 'sonner';

export default function MyPayslipsPage() {
  const { appUser } = useAuth();
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!appUser) return;

    const fetchPayslips = async () => {
      // Find employee doc ID by uid
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

      const payslipsQuery = query(
        collection(db, 'payslips'),
        where('employeeId', '==', employeeDocId),
        orderBy('generatedAt', 'desc')
      );

      const unsubscribe = onSnapshot(
        payslipsQuery,
        (snapshot) => {
          const list: Payslip[] = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          } as Payslip));
          setPayslips(list);
          setLoading(false);
        },
        (err) => {
          console.error('Error fetching payslips:', err);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    };

    fetchPayslips();
  }, [appUser]);

  const handleExportCSV = () => {
    const headers = ['Month', 'Basic Salary', 'Overtime Pay', 'Deductions', 'Net Pay'];
    const rows = payslips.map(p => [
      p.month,
      p.basicSalary.toString(),
      p.overtimePay.toString(),
      p.deductions.toString(),
      p.netPay.toString(),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-payslips.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  const totalEarnings = payslips.reduce((s, p) => s + p.netPay, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Payslips</h1>
          <p className="text-muted-foreground text-sm mt-0.5">View your salary and payment history</p>
        </div>
        {payslips.length > 0 && (
          <Button
            variant="outline"
            className="border-border text-foreground hover:bg-muted gap-2"
            onClick={handleExportCSV}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        )}
      </div>

      {/* Summary */}
      {payslips.length > 0 && (
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Earnings</p>
              <p className="text-lg font-bold text-primary">{formatCurrency(totalEarnings)}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-foreground text-base">Payslip History</CardTitle>
          <CardDescription className="text-muted-foreground text-xs">
            {payslips.length} payslip{payslips.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full bg-muted" />)}
            </div>
          ) : payslips.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Receipt className="mx-auto h-12 w-12 mb-3 opacity-20" />
              <p className="font-medium">No payslips yet</p>
              <p className="text-sm mt-1">Your payslips will appear here once generated</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wide pl-6">Month</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wide">Basic Salary</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wide">Overtime</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wide">Deductions</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wide pr-6">Net Pay</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payslips.map((p) => (
                  <TableRow key={p.id} className="border-border hover:bg-muted/30 transition-colors">
                    <TableCell className="pl-6 font-medium text-foreground text-sm">{formatMonthYear(p.month)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{formatCurrency(p.basicSalary)}</TableCell>
                    <TableCell className="text-emerald-400 text-sm">+{formatCurrency(p.overtimePay)}</TableCell>
                    <TableCell className="text-destructive text-sm">-{formatCurrency(p.deductions)}</TableCell>
                    <TableCell className="pr-6 font-bold text-primary text-sm">{formatCurrency(p.netPay)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
