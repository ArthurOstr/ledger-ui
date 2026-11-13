import { useState, useMemo } from 'react';
import type { Transaction } from '@/types';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ChevronLeft, ChevronRight, X } from 'lucide-react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Intl.NumberFormat formats amounts correctly per locale.
// Accepts raw strings/nulls from the backend and never crashes on them.
const formatAmount = (
  amount: number | string | null | undefined,
  currency: string = 'UAH'
) => {
  if (amount === null || amount === undefined || amount === '') return '—';

  const num = Number(amount);
  if (isNaN(num)) return '—';

  try {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(num);
  } catch {
    // If currency code is unknown (e.g. custom bank code), fall back to plain number
    return `${num.toFixed(2)} ${currency}`;
  }
};

// Maps category strings to a Badge color variant.
// Matches both English and Ukrainian category substrings.
const categoryVariant = (
  category: string | null | undefined
): 'default' | 'secondary' | 'outline' => {
  if (!category) return 'outline';
  const lower = category.toLowerCase();
  if (['food', 'groceries', 'dining', 'продукт', 'супермаркет', 'кафе', 'ресторан'].some((k) => lower.includes(k)))
return 'default';
  if (['transport', 'fuel', 'transit', 'транспорт', 'авто', 'аптек', 'медиц'].some((k) => lower.includes(k))) 
    return 'secondary';
  return 'outline';
};

// Extracts the trailing 4 digits from masked card strings,
// e.g. "4441 **** **** 0233" -> "0233". Returns null when unavailable.
const extractCardLast4 = (card: string | null | undefined): string | null => {
  if (!card) return null;
  const digits = card.replace(/\D/g, '');
  return digits.length >= 4 ? digits.slice(-4) : null;
};

// Per-bank pill presentation: short label + subtle dark-theme styling.
const BANK_LABELS: Record<string, string> = {
  monobank: 'Mono',
  privatbank: 'Privat',
};

const BANK_PILL_STYLES: Record<string, string> = {
  monobank: 'bg-white/10 text-[#f0ede8] border-white/10',
  privatbank: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

const FALLBACK_PILL_STYLES = 'bg-white/5 text-[#a09d98] border-white/10';

interface BankPill {
  label: string;
  className: string;
}

// Builds the bank identification pill for a transaction row.
const buildBankPill = (tx: Transaction): BankPill | null => {
  const bank = (tx.bank || '').trim();
  if (!bank) return null;

  const key = bank.toLowerCase();
  const baseLabel = BANK_LABELS[key] ?? `${bank.charAt(0).toUpperCase()}${bank.slice(1)}`;
  const last4 = extractCardLast4(tx.card);

  return {
    label: last4 ? `${baseLabel} • ${last4}` : baseLabel,
    className: BANK_PILL_STYLES[key] ?? FALLBACK_PILL_STYLES,
  };
};

// Builds the muted FX subtitle for cross-currency transactions.
// Only rendered when the transaction currency differs from the settlement
// currency (case-insensitive) and an actual transaction amount exists.
const buildFxSubtitle = (tx: Transaction): string | null => {
  const txCurrency = (tx.transaction_currency || '').trim();
  const accountCurrency = (tx.currency || '').trim();

  if (!txCurrency) return null;
  if (txCurrency.toUpperCase() === accountCurrency.toUpperCase()) return null;
  if (tx.transaction_amount === null || tx.transaction_amount === undefined) return null;

  const txAmount = Number(tx.transaction_amount);
  if (Number.isNaN(txAmount)) return null;

  let subtitle = formatAmount(txAmount, txCurrency);

  const rate = tx.exchange_rate;
  if (rate != null && Number(rate) > 0) {
    subtitle += ` (@ ${Number(rate).toFixed(2)})`;
  }

  return subtitle;
};

// ---------------------------------------------------------------------------
// Empty state
//
// Shown when there are no transactions yet.
// Gives the user a clear next action rather than just a message.
// ---------------------------------------------------------------------------
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-4xl mb-4">🗄️</div>
      <p className="text-[#f0ede8] font-medium mb-1">The vault is empty</p>
      <p className="text-sm text-[#6b6864]">
        Upload a bank statement above to populate your ledger.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bank & card identification pill
// ---------------------------------------------------------------------------
function BankBadge({ tx }: { tx: Transaction }) {
  const pill = buildBankPill(tx);

  if (!pill) {
    return <span className="text-sm text-[#6b6864]">—</span>;
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap
${pill.className}`}
    >
      {pill.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// TransactionTable Engine
// ---------------------------------------------------------------------------
interface Props {
  transactions: Transaction[];
  showBankBadge?: boolean;
}

const ROWS_PER_PAGE = 50;

export default function TransactionTable({ transactions, showBankBadge = true }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return transactions;

    const query = searchQuery.toLowerCase();
    return transactions.filter((tx) =>
        (tx.description && tx.description.toLowerCase().includes(query)) ||
        (tx.category && tx.category.toLowerCase().includes(query))
    );
  }, [transactions, searchQuery]);

// Pagination engine

  const totalPages = useMemo(
      () => Math.max(1, Math.ceil(filteredTransactions.length / ROWS_PER_PAGE)),
    [filteredTransactions.length]
  );

  const safePage = Math.min(currentPage, totalPages);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (safePage - 1) * ROWS_PER_PAGE;
    return filteredTransactions.slice(startIndex, startIndex + ROWS_PER_PAGE);
  }, [filteredTransactions, safePage]);

 // Reset pagination if the user types new query
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>)=> {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
  };

  if (transactions.length === 0) {
    return <EmptyState />;
  }

return (
    <div className="space-y-4">
      {/* Search Bar / Controls */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#6b6864]" />
          <Input
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={handleSearch}
            className="pl-9 pr-9 bg-[#1c1c1b] border-white/10 text-[#f0ede8] focus-visible:ring-1
focus-visible:ring-white/20"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-2.5 top-2.5 text-[#6b6864] hover:text-[#f0ede8] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
          <div className="text-xs text-[#6b6864]">
           {filteredTransactions.length} result{filteredTransactions.length !== 1 ? 's' : ''} found
         </div>
      </div>

      {/* The Data Grid */}
      <div className="rounded-xl border border-white/10 bg-[#1c1c1b] overflow-hidden">
        <Table>
          <TableHeader className="bg-black/20">
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-[#a09d98] font-medium py-3">Date</TableHead>
              <TableHead className="text-[#a09d98] font-medium py-3">Description</TableHead>
              {showBankBadge && (
                <TableHead className="text-[#a09d98] font-medium py-3">Bank</TableHead>
              )}
              <TableHead className="text-[#a09d98] font-medium py-3">Category</TableHead>
              <TableHead className="text-[#a09d98] font-medium py-3 text-right">Amount</TableHead>
              <TableHead className="text-[#a09d98] font-medium py-3 text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTransactions.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={showBankBadge ? 6 : 5} className="text-center py-8 text-[#6b6864]">
                  No transactions match your search.
                </TableCell>
              </TableRow>
            ) : (
              paginatedTransactions.map((tx) => {
                const fxSubtitle = buildFxSubtitle(tx);

                return (
                  <TableRow key={tx.id} className="border-white/5 hover:bg-white/[0.03] transition-colors">
                    <TableCell className="text-[#a09d98] text-sm whitespace-nowrap">
                      {new Date(tx.date).toLocaleDateString('uk-UA')}
                    </TableCell>
                    <TableCell className="text-[#f0ede8] text-sm max-w-[240px] truncate" title={tx.description ?? undefined}>
                      {tx.description}
                    </TableCell>
                    {showBankBadge && (
                      <TableCell>
                        <BankBadge tx={tx} />
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge variant={categoryVariant(tx.category)} className="text-[11px] border-white/10 text-[#a09d98] bg-white/5 font-normal">
                        {tx.category ?? '—'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm font-medium text-right whitespace-nowrap tabular-nums">
                      <div className={tx.amount < 0 ? 'text-red-400' : 'text-emerald-400'}>
                        {formatAmount(tx.amount, tx.currency)}
                      </div>
                      {fxSubtitle && (
                        <div className="text-[11px] font-mono text-[#6b6864] font-normal">
                          {fxSubtitle}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-right text-[#a09d98] whitespace-nowrap tabular-nums">
                      {formatAmount(tx.balance_after, tx.balance_currency || tx.currency)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 bg-black/10">
          <div className="text-xs text-[#6b6864]">
            Page <span className="font-medium text-[#f0ede8]">{safePage}</span> of {totalPages}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="bg-transparent border-white/10 text-[#a09d98] hover:bg-white/5 hover:text-[#f0ede8] h-8 px-2"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="bg-transparent border-white/10 text-[#a09d98] hover:bg-white/5 hover:text-[#f0ede8] h-8 px-2"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}