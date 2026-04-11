import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTransactions, useBudgets } from '@/hooks';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Target,
} from 'lucide-react';
import { formatCurrency, formatCurrencyCompact, formatDateShort, getCurrentMonth } from '@/lib/utils/formatters';
import type { TransactionType } from '@/types';

function typeColor(type: TransactionType) {
  return type === 'income' ? 'text-emerald-400' : 'text-destructive';
}

function typeBg(type: TransactionType) {
  return type === 'income' ? 'bg-emerald-400/10' : 'bg-destructive/10';
}

export default function PersonalDashboardPage() {
  const { appUser } = useAuth();
  const { transactions, loading: txLoading } = useTransactions();
  const currentMonth = getCurrentMonth();
  const { budgets, loading: budgetLoading } = useBudgets(currentMonth);

  const displayName = appUser?.name || appUser?.email?.split('@')[0] || 'there';

  const thisMonthTx = useMemo(() => {
    return transactions.filter((t) => {
      const d = t.date.toDate();
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return monthStr === currentMonth;
    });
  }, [transactions, currentMonth]);

  const totalIncome = thisMonthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = thisMonthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const netBalance = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.round((netBalance / totalIncome) * 100) : 0;

  // Income vs expenses by month (last 6)
  const chartData = useMemo(() => {
    const map: Record<string, { income: number; expenses: number }> = {};
    transactions.forEach((t) => {
      const d = t.date.toDate();
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!map[key]) map[key] = { income: 0, expenses: 0 };
      if (t.type === 'income') map[key].income += t.amount;
      else map[key].expenses += t.amount;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, data]) => {
        const [year, m] = month.split('-');
        const date = new Date(parseInt(year), parseInt(m) - 1);
        return {
          month: date.toLocaleDateString('en-IN', { month: 'short' }),
          income: data.income,
          expenses: data.expenses,
        };
      });
  }, [transactions]);

  const recentTransactions = transactions.slice(0, 5);

  const summaryCards = [
    {
      label: 'Income This Month',
      value: formatCurrencyCompact(totalIncome),
      icon: TrendingUp,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
    },
    {
      label: 'Expenses This Month',
      value: formatCurrencyCompact(totalExpenses),
      icon: TrendingDown,
      color: 'text-destructive',
      bg: 'bg-destructive/10',
    },
    {
      label: 'Net Balance',
      value: formatCurrencyCompact(netBalance),
      icon: Wallet,
      color: netBalance >= 0 ? 'text-primary' : 'text-destructive',
      bg: netBalance >= 0 ? 'bg-primary/10' : 'bg-destructive/10',
    },
    {
      label: 'Savings Rate',
      value: `${savingsRate}%`,
      icon: Target,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back, {displayName} 👋
        </h1>
        <p className="text-muted-foreground mt-0.5 text-sm">
          Here's your personal finance overview for this month.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.label} className="bg-card border-border">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{card.label}</p>
                  {txLoading ? (
                    <Skeleton className="h-8 w-20 bg-muted" />
                  ) : (
                    <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                  )}
                </div>
                <div className={`p-2.5 rounded-xl ${card.bg}`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Income vs Expenses Chart */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-foreground text-base">Income vs Expenses</CardTitle>
            <CardDescription className="text-muted-foreground text-xs">Last 6 months trend</CardDescription>
          </CardHeader>
          <CardContent>
            {txLoading ? (
              <Skeleton className="h-52 w-full bg-muted rounded-lg" />
            ) : chartData.length === 0 ? (
              <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">
                No transaction data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrencyCompact(v)} />
                  <Tooltip
                    contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(v) => (typeof v === 'number' ? formatCurrency(v) : String(v))}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Area type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={2} fill="url(#incomeGrad)" />
                  <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={2} fill="url(#expenseGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-foreground text-base">Recent Transactions</CardTitle>
              <CardDescription className="text-muted-foreground text-xs mt-0.5">Last 5 transactions</CardDescription>
            </div>
            <Link to="/personal/transactions" className="flex items-center text-xs text-primary hover:text-primary/80 font-medium">
              View all
              <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {txLoading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full bg-muted" />)}
              </div>
            ) : recentTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No transactions yet
              </div>
            ) : (
              recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30">
                  <div className={`p-1.5 rounded-lg shrink-0 ${typeBg(tx.type)}`}>
                    {tx.type === 'income'
                      ? <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                      : <TrendingDown className="h-3.5 w-3.5 text-destructive" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{tx.title}</p>
                    <p className="text-xs text-muted-foreground">{tx.category} · {formatDateShort(tx.date)}</p>
                  </div>
                  <span className={`text-sm font-semibold shrink-0 ${typeColor(tx.type)}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrencyCompact(tx.amount)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Budget Overview */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-foreground text-base">Budget Overview</CardTitle>
            <CardDescription className="text-muted-foreground text-xs mt-0.5">
              Current month spending limits
            </CardDescription>
          </div>
          <Link to="/personal/budgets" className="flex items-center text-xs text-primary hover:text-primary/80 font-medium">
            Manage
            <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </CardHeader>
        <CardContent>
          {budgetLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full bg-muted" />)}
            </div>
          ) : budgets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No budgets set for this month.{' '}
              <Link to="/personal/budgets" className="text-primary hover:underline">
                Add one →
              </Link>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {budgets.map((budget) => {
                const pct = budget.limit > 0 ? Math.min(Math.round((budget.spent / budget.limit) * 100), 100) : 0;
                const isOver = budget.spent > budget.limit;
                return (
                  <div key={budget.id} className="space-y-2 p-3 rounded-xl bg-muted/30 border border-border">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground capitalize">{budget.category}</p>
                      <Badge
                        variant="outline"
                        className={isOver ? 'border-destructive/30 text-destructive bg-destructive/10 text-xs' : 'border-border text-muted-foreground text-xs'}
                      >
                        {pct}%
                      </Badge>
                    </div>
                    <Progress
                      value={pct}
                      className={`h-1.5 bg-muted ${isOver ? '[&>div]:bg-destructive' : '[&>div]:bg-primary'}`}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatCurrencyCompact(budget.spent)} spent</span>
                      <span>of {formatCurrencyCompact(budget.limit)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
