import { useState } from 'react';
import { useTransactions } from '@/hooks';
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
  Trash2,
  TrendingUp,
  TrendingDown,
  Loader2,
  Receipt,
  Repeat,
  Download,
} from 'lucide-react';
import { formatCurrency, formatDateShort } from '@/lib/utils/formatters';
import type { TransactionType } from '@/types';
import { Timestamp } from 'firebase/firestore';
import { toast } from 'sonner';

const CATEGORIES = [
  'salary', 'food', 'transport', 'entertainment', 'utilities',
  'shopping', 'health', 'education', 'investment', 'other',
];

const categoryColors: Record<string, string> = {
  salary: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  food: 'bg-sky-500/10 text-sky-700 border-sky-500/20',
  transport: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  entertainment: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20',
  utilities: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  shopping: 'bg-sky-500/10 text-sky-700 border-sky-500/20',
  health: 'bg-blue-600/10 text-blue-800 border-blue-600/20',
  education: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  investment: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20',
  other: 'bg-muted text-muted-foreground border-border',
};

export default function TransactionsPage() {
  const { transactions, loading, addTransaction, deleteTransaction } = useTransactions();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formCategory, setFormCategory] = useState('other');
  const [formType, setFormType] = useState<TransactionType>('expense');
  const [formRecurring, setFormRecurring] = useState(false);
  const [formRecurrenceType, setFormRecurrenceType] = useState<'daily' | 'weekly' | 'monthly'>('monthly');

  const filtered = transactions.filter((t) => {
    const matchSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = typeFilter === 'all' || t.type === typeFilter;
    return matchSearch && matchType;
  });

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setIsSubmitting(true);
    try {
      const dateVal = fd.get('date') as string;
      await addTransaction({
        title: fd.get('title') as string,
        amount: parseFloat(fd.get('amount') as string),
        type: formType,
        category: formCategory,
        note: (fd.get('note') as string) || '',
        date: Timestamp.fromDate(new Date(dateVal)),
        isRecurring: formRecurring,
        recurrenceType: formRecurring ? formRecurrenceType : undefined,
      });
      form.reset();
      setIsAddOpen(false);
      setFormCategory('other');
      setFormType('expense');
      setFormRecurring(false);
      setFormRecurrenceType('monthly');
      toast.success('Transaction added');
    } catch {
      toast.error('Failed to add transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this transaction?')) return;
    try {
      await deleteTransaction(id);
      toast.success('Transaction deleted');
    } catch {
      toast.error('Failed to delete transaction');
    }
  };

  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transactions</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Track your income and expenses
          </p>
        </div>
        <div className="flex items-center gap-2">
          {filtered.length > 0 && (
            <Button
              variant="outline"
              className="border-border text-foreground hover:bg-muted gap-2"
              onClick={() => {
                const headers = ['Title', 'Amount', 'Type', 'Category', 'Date', 'Note', 'Recurring', 'Recurrence'];
                const rows = filtered.map(t => [
                  t.title,
                  t.amount.toString(),
                  t.type,
                  t.category,
                  t.date?.toDate?.().toLocaleDateString('en-IN') ?? '',
                  t.note || '',
                  t.isRecurring ? 'Yes' : 'No',
                  t.recurrenceType || '',
                ]);
                const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'transactions.csv';
                a.click();
                URL.revokeObjectURL(url);
                toast.success('CSV exported');
              }}
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          )}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger render={
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
              <Plus className="h-4 w-4" />
              Add Transaction
            </Button>
          } />
          <DialogContent className="bg-card border-border sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-foreground">Add Transaction</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Record an income or expense.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAdd}>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label className="text-foreground text-sm">Title</Label>
                  <Input name="title" required disabled={isSubmitting}
                    className="bg-muted/50 border-border text-foreground h-9" placeholder="e.g. Monthly salary" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-foreground text-sm">Amount (₹)</Label>
                    <Input name="amount" type="number" min="0" step="1" required disabled={isSubmitting}
                      className="bg-muted/50 border-border text-foreground h-9" placeholder="5000" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-foreground text-sm">Date</Label>
                    <Input name="date" type="date" required disabled={isSubmitting}
                      className="bg-muted/50 border-border text-foreground h-9"
                      defaultValue={new Date().toISOString().split('T')[0]} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-foreground text-sm">Type</Label>
                    <Select value={formType} onValueChange={(v) => v && setFormType(v as TransactionType)}>
                      <SelectTrigger className="bg-muted/50 border-border text-foreground h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="income">Income</SelectItem>
                        <SelectItem value="expense">Expense</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-foreground text-sm">Category</Label>
                    <Select value={formCategory} onValueChange={(v) => v && setFormCategory(v)}>
                      <SelectTrigger className="bg-muted/50 border-border text-foreground h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-foreground text-sm">Note (optional)</Label>
                  <Input name="note" disabled={isSubmitting}
                    className="bg-muted/50 border-border text-foreground h-9" placeholder="Any notes..." />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setFormRecurring(!formRecurring)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${formRecurring ? 'bg-primary' : 'bg-muted'}`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${formRecurring ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                    </button>
                    <Label className="text-foreground text-sm flex items-center gap-1.5">
                      <Repeat className="h-3.5 w-3.5" />
                      Recurring Transaction
                    </Label>
                  </div>
                  {formRecurring && (
                    <Select value={formRecurrenceType} onValueChange={(v) => v && setFormRecurrenceType(v as 'daily' | 'weekly' | 'monthly')}>
                      <SelectTrigger className="bg-muted/50 border-border text-foreground h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
              <DialogFooter className="mt-2">
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} className="border-border text-foreground hover:bg-muted">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Summary */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 shrink-0">
                <TrendingUp className="h-4 w-4 text-blue-700" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Income</p>
                <p className="text-lg font-bold text-blue-700">{formatCurrency(totalIncome)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10 shrink-0">
                <TrendingDown className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Expenses</p>
                <p className="text-lg font-bold text-destructive">{formatCurrency(totalExpenses)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground h-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v || 'all')}>
          <SelectTrigger className="w-full sm:w-44 bg-muted/50 border-border text-foreground h-10">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-foreground text-base">All Transactions</CardTitle>
          <CardDescription className="text-muted-foreground text-xs">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full bg-muted" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Receipt className="mx-auto h-12 w-12 mb-3 opacity-20" />
              <p className="font-medium">No transactions found</p>
              <p className="text-sm mt-1">
                {searchQuery || typeFilter !== 'all' ? 'Try different filters' : 'Add your first transaction'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wide pl-6">Title</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wide">Category</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wide">Date</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wide">Type</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wide">Amount</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wide pr-6 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((tx) => (
                  <TableRow key={tx.id} className="border-border hover:bg-muted/30 transition-colors">
                    <TableCell className="pl-6">
                      <div>
                        <p className="font-medium text-foreground text-sm flex items-center gap-1.5">
                          {tx.title}
                          {tx.isRecurring && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">
                              <Repeat className="h-2.5 w-2.5 mr-0.5" />
                              {tx.recurrenceType}
                            </Badge>
                          )}
                        </p>
                        {tx.note && <p className="text-xs text-muted-foreground truncate max-w-[160px]">{tx.note}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${categoryColors[tx.category] || categoryColors.other} border text-xs capitalize`}>
                        {tx.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{formatDateShort(tx.date)}</TableCell>
                    <TableCell>
                      <div className={`flex items-center gap-1.5 text-xs font-medium ${tx.type === 'income' ? 'text-blue-700' : 'text-sky-700'}`}>
                        {tx.type === 'income'
                          ? <TrendingUp className="h-3.5 w-3.5" />
                          : <TrendingDown className="h-3.5 w-3.5" />}
                        {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`font-bold text-sm ${tx.type === 'income' ? 'text-blue-700' : 'text-sky-700'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(tx.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
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
