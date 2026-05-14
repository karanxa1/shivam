import { useState, useEffect, useRef } from 'react';
import { useBudgets } from '@/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
import { Plus, Trash2, Target, Loader2 } from 'lucide-react';
import { formatCurrency, getCurrentMonth, formatMonthYear } from '@/lib/utils/formatters';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  'food', 'transport', 'entertainment', 'utilities',
  'shopping', 'health', 'education', 'investment', 'other',
];

export default function BudgetsPage() {
  const currentMonth = getCurrentMonth();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const { budgets, loading, saveBudget, deleteBudget } = useBudgets(selectedMonth);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formCategory, setFormCategory] = useState('food');

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setIsSubmitting(true);
    try {
      await saveBudget({
        category: formCategory,
        limit: parseFloat(fd.get('limit') as string),
        spent: 0,
        month: selectedMonth,
      });
      setIsAddOpen(false);
      setFormCategory('food');
      toast.success('Budget saved');
    } catch {
      toast.error('Failed to save budget');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this budget?')) return;
    try {
      await deleteBudget(id);
      toast.success('Budget deleted');
    } catch {
      toast.error('Failed to delete budget');
    }
  };

  // Budget alert notifications
  const alertedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (loading || budgets.length === 0) return;
    budgets.forEach((b) => {
      const key = `${b.id}-${b.spent}`;
      if (alertedRef.current.has(key)) return;
      const pct = b.limit > 0 ? (b.spent / b.limit) * 100 : 0;
      if (pct >= 100) {
        toast.error(`Budget exceeded for ${b.category}! Spent ${formatCurrency(b.spent)} of ${formatCurrency(b.limit)}`);
        alertedRef.current.add(key);
      } else if (pct >= 80) {
        toast.warning(`Budget warning for ${b.category}: ${Math.round(pct)}% used (${formatCurrency(b.spent)} of ${formatCurrency(b.limit)})`);
        alertedRef.current.add(key);
      }
    });
  }, [budgets, loading]);

  const totalBudgeted = budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const overBudgetCount = budgets.filter((b) => b.spent > b.limit).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Budgets</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Set and track your spending limits
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-muted/50 border-border text-foreground h-9 w-44"
          />
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger render={
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                <Plus className="h-4 w-4" />
                Add Budget
              </Button>
            } />
            <DialogContent className="bg-card border-border sm:max-w-sm">
              <DialogHeader>
                <DialogTitle className="text-foreground">Add Budget</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Set a spending limit for a category in {formatMonthYear(selectedMonth)}.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAdd}>
                <div className="space-y-4 py-2">
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
                  <div className="space-y-1.5">
                    <Label className="text-foreground text-sm">Monthly Limit (₹)</Label>
                    <Input
                      name="limit"
                      type="number"
                      min="1"
                      step="100"
                      required
                      disabled={isSubmitting}
                      className="bg-muted/50 border-border text-foreground h-9"
                      placeholder="5000"
                    />
                  </div>
                </div>
                <DialogFooter className="mt-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} className="border-border text-foreground hover:bg-muted">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground hover:bg-primary/90">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary row */}
      {budgets.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Budgeted</p>
              <p className="text-xl font-bold text-foreground mt-1">{formatCurrency(totalBudgeted)}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Spent</p>
              <p className="text-xl font-bold text-foreground mt-1">{formatCurrency(totalSpent)}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Over Budget</p>
              <p className={cn('text-xl font-bold mt-1', overBudgetCount > 0 ? 'text-sky-700' : 'text-blue-700')}>
                {overBudgetCount} categor{overBudgetCount !== 1 ? 'ies' : 'y'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Budget Cards */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40 w-full bg-muted rounded-xl" />)}
        </div>
      ) : budgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Target className="h-12 w-12 mb-3 opacity-20" />
          <p className="font-medium">No budgets for {formatMonthYear(selectedMonth)}</p>
          <p className="text-sm mt-1">Add a budget to start tracking spending</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => {
            const pct = budget.limit > 0 ? Math.min(Math.round((budget.spent / budget.limit) * 100), 100) : 0;
            const isOver = budget.spent > budget.limit;
            const remaining = budget.limit - budget.spent;

            return (
              <Card key={budget.id} className={cn(
                'bg-card border-border',
                isOver && 'border-destructive/30'
              )}>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-foreground capitalize">{budget.category}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatMonthYear(budget.month)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs border',
                          isOver
                            ? 'border-destructive/30 text-destructive bg-destructive/10'
                            : pct >= 80
                              ? 'border-sky-500/30 text-sky-700 bg-sky-500/10'
                              : 'border-blue-500/30 text-blue-700 bg-blue-500/10'
                        )}
                      >
                        {pct}%
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(budget.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Progress
                      value={pct}
                      className={cn(
                        'h-2 bg-muted',
                        isOver ? '[&>div]:bg-sky-600' : pct >= 80 ? '[&>div]:bg-sky-400' : '[&>div]:bg-blue-600'
                      )}
                    />
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        Spent: <span className={isOver ? 'text-destructive font-semibold' : 'text-foreground font-medium'}>{formatCurrency(budget.spent)}</span>
                      </span>
                      <span className="text-muted-foreground">
                        Limit: <span className="text-foreground font-medium">{formatCurrency(budget.limit)}</span>
                      </span>
                    </div>
                  </div>

                  <div className={cn(
                    'text-xs font-medium rounded-lg px-3 py-1.5 text-center',
                    isOver
                      ? 'bg-destructive/10 text-destructive'
                      : 'bg-muted text-muted-foreground'
                  )}>
                    {isOver
                      ? `${formatCurrency(Math.abs(remaining))} over budget`
                      : `${formatCurrency(remaining)} remaining`}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
