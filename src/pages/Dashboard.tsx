import { useEffect, useState, useCallback } from 'react';
import { getTransactions } from '../api/client';
import type { Transaction } from '@/types';
import { useAuth } from '../context/AuthContext';

import TransactionTable from '../components/TransactionTable';
import FileUpload       from '../components/FileUpload';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton }          from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button }            from '@/components/ui/button';

import {
  TrendingUp,    // income card icon
  TrendingDown,  // expenses card icon
  Wallet,        // net card icon
  LogOut,        // logout button icon
  AlertCircle,   // error banner icon
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const formatAmount = (amount: number, currency = 'UAH') => {
  try {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
};

function summarise(transactions: Transaction[]) {
  const currency = transactions[0]?.currency ?? 'UAH';
  let income   = 0;
  let expenses = 0;

  for (const tx of transactions) {
    if (tx.amount > 0) income   += tx.amount;
    else               expenses += tx.amount; // negative, so net goes down
  }

  return {
    income,
    expenses,
    net: income + expenses, // expenses are already negative
    currency,
    count: transactions.length,
  };
}

// ---------------------------------------------------------------------------
// SummaryCard
// ---------------------------------------------------------------------------
function SummaryCard({
  title,
  value,
  icon,
  positive,
}: {
  title:    string;
  value:    string;
  icon:     React.ReactNode;
  positive: boolean | null; // null = neutral (net card)
}) {
  const valueColor =
    positive === null  ? 'text-[#f0ede8]'   // neutral — net balance
    : positive         ? 'text-emerald-400'  // income
                       : 'text-red-400';     // expenses

  return (
    <Card className="bg-[#1c1c1b] border-white/10">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-widest text-[#a09d98]">
          {title}
        </CardTitle>
        <span className="text-[#6b6864]" aria-hidden="true">
          {icon}
        </span>
      </CardHeader>
      <CardContent>
        <p className={`text-2xl font-semibold tabular-nums ${valueColor}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// LoadingSkeleton
// ---------------------------------------------------------------------------
function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Summary cards placeholder */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <Card key={i} className="bg-[#1c1c1b] border-white/10">
            <CardHeader className="pb-2">
              <Skeleton className="h-3 w-24 bg-white/10" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-36 bg-white/10" />
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Table placeholder */}
      <div className="space-y-2">
        <Skeleton className="h-10 w-full bg-white/10 rounded-xl" />
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-12 w-full bg-white/[0.05] rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dashboard (page)
// ---------------------------------------------------------------------------
export default function Dashboard() {
  const { logout } = useAuth();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);

  const fetchVaultData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTransactions();
      setTransactions(data);
    } catch (err) {
      setError('Failed to reach the vault. Is the backend server running?');
      // Remove console.error before shipping to production.
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVaultData();
  }, [fetchVaultData]);

  const summary = summarise(transactions);

  return (
    <div className="min-h-screen bg-[#0f0f0e] text-[#f0ede8]">

      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Financial Overview</h1>
          <p className="text-xs text-[#6b6864] mt-0.5">
            Live data from the PostgreSQL engine
          </p>
        </div>

        <div className="flex items-center gap-3">
          <FileUpload onUploadSuccess={fetchVaultData} />
          <Button
            variant="ghost"
            onClick={logout}
            className="text-red-400 hover:text-red-300 hover:bg-red-950/30 gap-2"
          >
            <LogOut size={15} aria-hidden="true" />
            Lock vault
          </Button>
        </div>
      </header>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <main className="px-6 py-6 space-y-6">

        {/* Loading state — skeleton layout */}
        {loading && <LoadingSkeleton />}
        {error && !loading && (
          <Alert
            variant="destructive"
            className="bg-red-950/40 border-red-900/50 text-red-400"
          >
            <AlertCircle size={14} aria-hidden="true" />
            <AlertDescription className="font-mono text-sm ml-2">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Happy path — summary cards + table */}
        {!loading && !error && (
          <>
            {/* ── Summary cards ──────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <SummaryCard
                title="Total income"
                value={formatAmount(summary.income, summary.currency)}
                icon={<TrendingUp size={16} />}
                positive={true}
              />
              <SummaryCard
                title="Total expenses"
                value={formatAmount(summary.expenses, summary.currency)}
                icon={<TrendingDown size={16} />}
                positive={false}
              />
              <SummaryCard
                title="Net"
                value={formatAmount(summary.net, summary.currency)}
                icon={<Wallet size={16} />}
                positive={null}
              />
            </div>

            {/* ── Transaction count ───────────────────────────────────── */}
            {transactions.length > 0 && (
              <p className="text-xs text-[#6b6864]">
                {summary.count} transaction{summary.count !== 1 ? 's' : ''} loaded
              </p>
            )}

            {/* ── Table ──────────────────────────────────────────────── */}
            <TransactionTable transactions={transactions} />
          </>
        )}
      </main>
    </div>
  );
}
