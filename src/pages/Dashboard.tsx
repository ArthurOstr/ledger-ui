import { useEffect, useState, useCallback, useMemo } from 'react';
import { getTransactions } from '../api/client';
import type { Transaction, BankScope, CardVault } from '@/types';
import { useAuth } from '../context/AuthContext';

import TransactionTable from '../components/TransactionTable';
import FileUpload       from '../components/FileUpload';
import RuleSheet        from '../components/RuleSheet';
import BalanceChart     from '../components/BalanceChart';
import CategoryChart    from '../components/CategoryChart';

import {
  computeFinancialSummary,
  generateCategoryBreakdown,
  generateBalanceHistory,
  filterByBankScope,
} from '@/lib/ledgerAnalytics';

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
  Wallet,        // net worth card icon
  PiggyBank,     // savings rate card icon
  LogOut,        // logout button icon
  AlertCircle,   // error banner icon
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const formatAmount = (amount: number, currency = 'UAH') => {
  const num = Number(amount);

  if (isNaN(num)) return `0.00 ${currency}`;

  try {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(num);
  } catch {
    return `${num.toFixed(2)} ${currency}`;
  }
};

/** Capitalizes a raw bank slug for display, e.g. 'monobank' -> 'Monobank'. */
const formatBankName = (bank: string) => bank.charAt(0).toUpperCase() + bank.slice(1);

/** Subtle context label for the savings-rate KPI badge. */
const savingsBadgeLabel = (rate: number, income: number): string => {
  if (income <= 0) return 'No income';
  if (rate >= 20) return 'Healthy';
  if (rate >= 10) return 'Stable';
  return 'Low';
};

// ---------------------------------------------------------------------------
// Bank scope switcher (segmented pill toggle)
// ---------------------------------------------------------------------------
const SCOPE_OPTIONS: { value: BankScope; label: string }[] = [
  { value: 'ALL',        label: 'Consolidated' },
  { value: 'monobank',   label: 'Monobank' },
  { value: 'privatbank', label: 'PrivatBank' },
];

function ScopeSwitcher({
  scope,
  onChange,
}: {
  scope: BankScope;
  onChange: (next: BankScope) => void;
}) {
  return (
    <div className="inline-flex items-center bg-[#1c1c1b] border border-white/10 p-1 rounded-xl">
      {SCOPE_OPTIONS.map((option) => {
        const isActive = scope === option.value;

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(option.value)}
            className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
              isActive
                ? 'bg-white text-black font-medium'
                : 'text-[#a09d98] hover:text-[#f0ede8] hover:bg-white/5'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SummaryCard
// ---------------------------------------------------------------------------
function SummaryCard({
  title,
  value,
  icon,
  positive,
  badge,
  emphasized = false,
}: {
  title:       string;
  value:       string;
  icon:        React.ReactNode;
  positive:    boolean | null; // null = neutral (net worth / savings rate)
  badge?:      string;
  emphasized?: boolean;
}) {
  const valueColor =
    positive === null  ? 'text-[#f0ede8]'   // neutral — net worth / rate
    : positive         ? 'text-emerald-400'  // income
                       : 'text-red-400';     // expenses

  return (
    <Card className={`bg-[#1c1c1b] border-white/10 ${emphasized ? 'ring-1 ring-white/20' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-widest text-[#a09d98]">
          {title}
        </CardTitle>
        <span className="text-[#6b6864]" aria-hidden="true">
          {icon}
        </span>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <p className={`${emphasized ? 'text-3xl' : 'text-2xl'} font-semibold tabular-nums ${valueColor}`}>
            {value}
          </p>
          {badge && (
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-[#a09d98]">
              {badge}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Active card vaults strip
//
// One compact pill per bank/card/currency vault, plus secondary badges for
// foreign-currency totals. Foreign vaults are never mixed into UAH totals.
// ---------------------------------------------------------------------------
function VaultsStrip({
  vaults,
  foreignVaults,
}: {
  vaults: CardVault[];
  foreignVaults: Record<string, number>;
}) {
  const foreignEntries = Object.entries(foreignVaults);

  if (vaults.length === 0 && foreignEntries.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {vaults.map((vault) => (
        <div
          key={`${vault.bank}-${vault.card}-${vault.currency}`}
          title={`Last activity: ${vault.lastActiveDate}`}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#1c1c1b] px-3 py-1.5 text-xs"
        >
          <span className="font-medium text-[#f0ede8]">{formatBankName(vault.bank)}</span>
          <span className="text-[#6b6864]">{vault.card}</span>
          <span className="text-[#a09d98] tabular-nums">
            {vault.latestBalance === null ? '—' : formatAmount(vault.latestBalance, vault.currency)}
          </span>
        </div>
      ))}

      {foreignEntries.map(([currency, total]) => (
        <span
          key={currency}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[#a09d98]"
        >
          {currency}:
          <span className="text-[#f0ede8] tabular-nums">{formatAmount(total, currency)}</span>
        </span>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// LoadingSkeleton
// ---------------------------------------------------------------------------
function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Summary cards placeholder */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
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
  const [scope, setScope]               = useState<BankScope>('ALL');
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);

  const fetchVaultData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTransactions();
      setTransactions(data);
    } catch (err) {
      setError('Unable to load transactions. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleUploadSuccess = useCallback(() => {
    setLoading(true);
    const previousCount = transactions.length;
    let attempts = 0;
    const maxAttempts = 8;

    const pollForNewData = async () => {
      attempts++;
      try {
        const data = await getTransactions();

        if (data.length > previousCount) {
          setTransactions(data);
          setLoading(false);
          return;
        }
        if (attempts >= maxAttempts) {
          setTransactions(data);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error("Polling failed during background processing", err);
      }
      setTimeout(pollForNewData, 1500);
    };
    setTimeout(pollForNewData, 1000);
  }, [transactions.length]);

  useEffect(() => {
    fetchVaultData();
  }, [fetchVaultData]);

  // ── Scope-aware analytics ────────────────────────────────────────────────
  // All aggregations live in ledgerAnalytics and are currency-aware: cashflow,
  // category spending and balance history are UAH-anchored, while foreign
  // vaults are reported separately and never mixed into UAH totals.
  const scopedTransactions = useMemo(
    () => filterByBankScope(transactions, scope),
    [transactions, scope]
  );

  const summary = useMemo(
    () => computeFinancialSummary(transactions, scope),
    [transactions, scope]
  );

  const categoryData = useMemo(
    () => generateCategoryBreakdown(transactions, scope),
    [transactions, scope]
  );

  const balanceHistory = useMemo(
    () => generateBalanceHistory(transactions, scope),
    [transactions, scope]
  );

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
          <RuleSheet
            transactions={transactions}
            onRuleCreated={fetchVaultData}
          />
          <FileUpload onUploadSuccess={handleUploadSuccess} />
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
      <main className="px-6 py-6 space-y-8">

        {/* Bank scope switcher */}
        <ScopeSwitcher scope={scope} onChange={setScope} />

        {/* Loading state — skeleton layout */}
        {loading && <LoadingSkeleton />}

        {/* Error state — alert banner */}
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

        {/* Happy path — vaults, KPIs, charts, ledger */}
        {!loading && !error && (
          <>
            {/* ── Active card vaults strip ───────────────────────────── */}
            <VaultsStrip
              vaults={summary.vaults}
              foreignVaults={summary.foreignVaults}
            />

            {/* ── UAH anchor KPI cards ───────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <SummaryCard
                title="Net Worth (UAH)"
                value={formatAmount(summary.netWorthUAH, 'UAH')}
                icon={<Wallet size={16} />}
                positive={null}
                emphasized
              />
              <SummaryCard
                title="Period Income"
                value={formatAmount(summary.totalIncome, 'UAH')}
                icon={<TrendingUp size={16} />}
                positive={true}
              />
              <SummaryCard
                title="Period Expenses"
                value={formatAmount(summary.totalExpenses, 'UAH')}
                icon={<TrendingDown size={16} />}
                positive={false}
              />
              <SummaryCard
                title="Savings Rate"
                value={`${summary.savingsRate}%`}
                icon={<PiggyBank size={16} />}
                positive={null}
                badge={savingsBadgeLabel(summary.savingsRate, summary.totalIncome)}
              />
            </div>

            {/* ── Visual analytics grid ──────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8">
                <BalanceChart data={balanceHistory} />
              </div>
              <div className="lg:col-span-4">
                <CategoryChart data={categoryData} />
              </div>
            </div>

            {/* ── Total Data Loaded ──────────────────────────────────── */}
            {transactions.length > 0 && (
              <p className="text-xs text-[#6b6864] pt-4">
                {transactions.length} total transaction{transactions.length !== 1 ? 's' : ''} loaded from database
              </p>
            )}

            {/* ── Transaction Ledger ─────────────────────────────────── */}
            <TransactionTable transactions={scopedTransactions} showBankBadge={true} />
          </>
        )}
      </main>
    </div>
  );
}
