/**
 * Domain math & data transformers for the multi-bank dashboard.
 *
 * Every aggregation in this module is currency-aware: cashflow and category
 * spending are computed for the primary UAH settlement currency, while
 * foreign-currency vaults are reported separately and never mixed into
 * UAH totals.
 */

import type { 
  Transaction,
  BankScope,
  CardVault,
  FinancialSummary,
  CategorySpending,
  BalancePoint
} from '@/types';

export type { Transaction, BankScope, CardVault, FinancialSummary, CategorySpending, BalancePoint };

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const FALLBACK_CURRENCY = 'UAH';
const UNKNOWN = 'UNKNOWN';
const UNCATEGORIZED = 'Інше';

/** Coerces any value into a finite number, defaulting to 0. */
function toSafeNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Coerces a nullable value into a finite number while preserving null. */
function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Currency `tx.amount` is denominated in (normalized, e.g. 'UAH'). */
function resolveAmountCurrency(tx: Transaction): string {
  return String(tx.currency || FALLBACK_CURRENCY).trim().toUpperCase();
}

/** Currency `tx.balance_after` is denominated in (normalized, e.g. 'UAH'). */
function resolveSettlementCurrency(tx: Transaction): string {
  return String(tx.balance_currency || tx.currency || FALLBACK_CURRENCY).trim().toUpperCase();
}

/**
 * Parses a raw date string into a millisecond timestamp. Understands ISO
 * strings, 'DD.MM.YYYY' dates and bare epoch values (seconds or milliseconds).
 * Returns null when the value cannot be interpreted.
 */
function parseTimestamp(raw: string | null | undefined): number | null {
  if (typeof raw !== 'string' || raw.trim() === '') return null;
  const trimmed = raw.trim();

  const direct = Date.parse(trimmed);
  if (Number.isFinite(direct)) return direct;

// 'DD.MM.YYYY' with optional 'HH:mm:ss'
  const dotted = /^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/.exec(trimmed);
  if (dotted) {
    const day = Number(dotted[1]);
    const month = Number(dotted[2]);
    const year = Number(dotted[3]);
    const hour = Number(dotted[4] ?? 0);
    const min = Number(dotted[5] ?? 0);
    const sec = Number(dotted[6] ?? 0);
    const time = new Date(year, month - 1, day, hour, min, sec).getTime();
    if (Number.isFinite(time)) return time;
  }
  // Bare epoch values supplied as strings (seconds or milliseconds).
  const numeric = Number(trimmed);
  if (Number.isFinite(numeric)) return numeric < 1e11 ? numeric * 1000 : numeric;

  return null;
}

/** Normalizes any supported date representation to a 'YYYY-MM-DD' day key. */
function toDayKey(raw: string): string {
  // ISO-like dates: slicing keeps the literal calendar day (timezone-safe).
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);

  const ts = parseTimestamp(raw);
  if (ts !== null) {
    const d = new Date(ts);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
  }

  return raw;
}

/** Formats a 'YYYY-MM-DD' day key as 'DD.MM'. */
function formatDayLabel(dayKey: string): string {
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dayKey);
  if (!parts) return dayKey;
  return `${parts[3] ?? ''}.${parts[2] ?? ''}`;
}

/** Chronological order: ascending date, ties broken by ascending id. */
function byDateAsc(a: Transaction, b: Transaction): number {
  const at = parseTimestamp(a.date) ?? 0;
  const bt = parseTimestamp(b.date) ?? 0;
  if (at !== bt) return at - bt;
  return (Number(a.id) || 0) - (Number(b.id) || 0);
}

/** Recency order: descending date, ties broken by descending id. */
function byRecencyDesc(a: Transaction, b: Transaction): number {
  const at = parseTimestamp(a.date) ?? 0;
  const bt = parseTimestamp(b.date) ?? 0;
  if (at !== bt) return bt - at;
  return (Number(b.id) || 0) - (Number(a.id) || 0);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Narrows the ledger to a single bank (case-insensitive comparison).
 * The 'ALL' scope returns every transaction untouched.
 */
export function filterByBankScope(transactions: Transaction[], scope: BankScope): Transaction[] {
  if (String(scope).trim().toUpperCase() === 'ALL') return transactions;

  const normalizedScope = String(scope).trim().toLowerCase();
  return transactions.filter(
    (tx) => String(tx.bank ?? '').trim().toLowerCase() === normalizedScope,
  );
}

/**
 * Full dashboard snapshot for the selected scope: UAH cashflow with a savings
 * rate, per-card vaults with their latest balances, and net worth split into
 * a UAH total plus per-currency foreign vault sums.
 */
export function computeFinancialSummary(
  transactions: Transaction[],
  scope: BankScope,
): FinancialSummary {
  const scoped = filterByBankScope(transactions, scope);

  // --- Cashflow (primary UAH settlement currency only) ---
  let totalIncome = 0;
  let totalExpenses = 0;

  for (const tx of scoped) {
    if (resolveAmountCurrency(tx) !== 'UAH') continue;

    const amount = toSafeNumber(tx.amount);
    if (amount > 0) {
      totalIncome += amount;
    } else if (amount < 0) {
      totalExpenses += Math.abs(amount);
    }
  }

  let savingsRate = 0;
  if (totalIncome > 0) {
    const ratio = ((totalIncome - totalExpenses) / totalIncome) * 100;
    savingsRate = Math.min(100, Math.max(0, Math.round(ratio)));
  }

  // --- Card vaults: latest known state per bank/card/currency ---
  const buckets = new Map<string, Transaction[]>();
  for (const tx of scoped) {
    const key = `${tx.bank}_${tx.card?.trim() || UNKNOWN}_${resolveSettlementCurrency(tx)}`;
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.push(tx);
    } else {
      buckets.set(key, [tx]);
    }
  }

  const vaults: CardVault[] = [];
  buckets.forEach((bucket) => {
    // Newest row wins: latest timestamp, highest id as the tiebreaker.
    const sorted = [...bucket].sort(byRecencyDesc);
    const latest = sorted[0];
    if (!latest) return;

    const latestWithBalance = sorted.find((tx) => toNullableNumber(tx.balance_after) !== null);

    vaults.push({
      bank: String(latest.bank ?? UNKNOWN),
      card: latest.card?.trim() || UNKNOWN,
      currency: resolveSettlementCurrency(latest),
      latestBalance: latestWithBalance ? toNullableNumber(latestWithBalance.balance_after) : null,
      lastActiveDate: latest.date,
    });
  });

  // Most recently active vault first for deterministic rendering.
  vaults.sort(
    (a, b) => (parseTimestamp(b.lastActiveDate) ?? 0) - (parseTimestamp(a.lastActiveDate) ?? 0),
  );

  // --- Net worth ---
  let netWorthUAH = 0;
  const foreignVaults: Record<string, number> = {};

  for (const vault of vaults) {
    if (vault.latestBalance === null) continue;

    if (vault.currency === 'UAH') {
      netWorthUAH += vault.latestBalance;
    } else {
      foreignVaults[vault.currency] = (foreignVaults[vault.currency] ?? 0) + vault.latestBalance;
    }
  }

  Object.keys(foreignVaults).forEach((curr) => {
    foreignVaults[curr] = round2(foreignVaults[curr]);
  });

  return { 
    totalIncome: round2(totalIncome), 
    totalExpenses: round2(totalExpenses), 
    savingsRate, 
    vaults, 
    netWorthUAH: round2(netWorthUAH), 
    foreignVaults
  };
}

/**
 * Expense distribution per category for the selected scope. Only UAH expenses
 * count; uncategorized rows fall into 'Інше'. Sorted by amount, descending.
 */
export function generateCategoryBreakdown(
  transactions: Transaction[],
  scope: BankScope,
): CategorySpending[] {
  const scoped = filterByBankScope(transactions, scope);

  const totals = new Map<string, { amount: number; count: number}>();
  let totalExpenses = 0;

  for (const tx of scoped) {
    if (resolveAmountCurrency(tx) !== 'UAH') continue;

    const amount = toSafeNumber(tx.amount);
    if (amount >= 0) continue; // strictly expenses

    const category = tx.category?.trim() || UNCATEGORIZED;
    const spent = Math.abs(amount);

const existing = totals.get(category) ?? { amount: 0, count: 0 };
    totals.set(category, {
      amount: existing.amount + spent,
      count: existing.count + 1,
    });
    totalExpenses += spent;
  }

  const breakdown: CategorySpending[] = [];
  totals.forEach(({amount, count}, category) => {
    breakdown.push({
      category,
      amount,
      count,
      percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
    });
  });

  return breakdown.sort((a, b) => b.amount - a.amount);
}

/**
 * Daily closing-balance series for UAH accounts, ascending by date. When
 * several transactions share a calendar day, only the latest one is kept.
 */
export function generateBalanceHistory(
  transactions: Transaction[],
  scope: BankScope,
): BalancePoint[] {
  const scoped = filterByBankScope(transactions, scope);

  const eligible = scoped.filter((tx) => {
    if (toNullableNumber(tx.balance_after) === null) return false;
    return resolveSettlementCurrency(tx) === 'UAH';
  });

  if (eligible.length === 0) return [];
  
// Group transactions by unique card stream
  const cardStreams = new Map<string, Transaction[]>();
  for (const tx of eligible) {
    const cardKey = `${tx.bank}_${tx.card?.trim() || UNKNOWN}`;
    const stream = cardStreams.get(cardKey);
    if (stream) {
      stream.push(tx);
    } else {
      cardStreams.set(cardKey, [tx]);
    }
  }

  // Determine starting baseline balance for each card:
  // Baseline = balance_after of first transaction - amount of first transaction
  const runningCardBalances = new Map<string, number>();
  cardStreams.forEach((stream, cardKey) => {
    const chronological = [...stream].sort(byDateAsc);
    const firstTx = chronological[0];
    if (firstTx) {
      const balAfter = toNullableNumber(firstTx.balance_after) ?? 0;
      const amt = toSafeNumber(firstTx.amount);
      runningCardBalances.set(cardKey, balAfter - amt);
    }
  });

  // Ascending order so the "last write wins" pass below keeps the latest
  // transaction (latest timestamp, highest id) of every calendar day.
  const allChronological = [...eligible].sort(byDateAsc);

  const dayGroups = new Map<string, Transaction[]>();
  for (const tx of allChronological) {
    const dayKey = toDayKey(tx.date);
    const group = dayGroups.get(dayKey);
    if (group) {
      group.push(tx);
    } else {
      dayGroups.set(dayKey, [tx]);
    }
  } 

  const points: BalancePoint[] = [];

  dayGroups.forEach((dayTxs, dayKey) => {
    let latestTs = 0;

for (const tx of dayTxs) {
      const cardKey = `${tx.bank}_${tx.card?.trim() || UNKNOWN}`;
      const bal = toNullableNumber(tx.balance_after);
      if (bal !== null) {
        runningCardBalances.set(cardKey, bal);
      }
      const ts = parseTimestamp(tx.date) ?? 0;
      if (ts > latestTs) latestTs = ts;
    }

    let dailyNetTotal = 0;
    runningCardBalances.forEach((bal) => {
      dailyNetTotal += bal;
    });

    points.push({
      date: formatDayLabel(dayKey),
      timestamp: latestTs,
      balance: dailyNetTotal,
    });
  });

  return points.sort((a, b) => a.timestamp - b.timestamp);
}
