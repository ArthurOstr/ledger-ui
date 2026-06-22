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
const formatAmount = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    // If currency code is unknown (e.g. custom bank code), fall back to plain number
    return `${amount.toFixed(2)} ${currency}`;
  }
};

// Maps category strings to a Badge color variant.
const categoryVariant = (
  category: string | null | undefined
): 'default' | 'secondary' | 'outline' => {
  if (!category) return 'outline';
  const lower = category.toLowerCase();
  if (['food', 'groceries', 'dining'].some((k) => lower.includes(k))) return 'default';
  if (['transport', 'fuel', 'transit'].some((k) => lower.includes(k))) return 'secondary';
  return 'outline';
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
// TransactionTable Engine
// ---------------------------------------------------------------------------
interface Props {
  transactions: Transaction[];
}

const ROWS_PER_PAGE = 50;

export default function TransactionTable({ transactions }: Props) {
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

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / ROWS_PER_PAGE));

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
    return filteredTransactions.slice(startIndex, startIndex + ROWS_PER_PAGE);
  }, [filteredTransactions, currentPage]);

  // Reset pagination if the user types new query
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>)=> {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
  }

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
            placeholder="Search descriptions or categories..."
            value={searchQuery}
            onChange={handleSearch}
            className="pl-9 pr-9 bg-[#1c1c1b] border-white/10 text-[#f0ede8] focus-visible:ring-1 focus-visible:ring-white/20"
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
          Showing {filteredTransactions.length} results
        </div>
      </div>

      {/* The Data Grid */}
      <div className="rounded-xl border border-white/10 bg-[#1c1c1b] overflow-hidden">
        <Table>
          <TableHeader className="bg-black/20">
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-[#a09d98] font-medium py-3">Date</TableHead>
              <TableHead className="text-[#a09d98] font-medium py-3">Description</TableHead>
              <TableHead className="text-[#a09d98] font-medium py-3">Category</TableHead>
              <TableHead className="text-[#a09d98] font-medium py-3 text-right">Amount</TableHead>
              <TableHead className="text-[#a09d98] font-medium py-3 text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTransactions.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="text-center py-8 text-[#6b6864]">
                  No transactions match your search.
                </TableCell>
              </TableRow>
            ) : (
              paginatedTransactions.map((tx) => (
                <TableRow key={tx.id} className="border-white/5 hover:bg-white/[0.03] transition-colors">
                  <TableCell className="text-[#a09d98] text-sm whitespace-nowrap">
                    {new Date(tx.date).toLocaleDateString('uk-UA')}
                  </TableCell>
                  <TableCell className="text-[#f0ede8] text-sm max-w-[240px] truncate" title={tx.description ?? undefined}>
                    {tx.description}
                  </TableCell>
                  <TableCell>
                    <Badge variant={categoryVariant(tx.category)} className="text-[11px] border-white/10 text-[#a09d98] bg-white/5 font-normal">
                      {tx.category ?? '—'}
                    </Badge>
                  </TableCell>
                  <TableCell className={`text-sm font-medium text-right whitespace-nowrap tabular-nums ${tx.amount < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {formatAmount(tx.amount, tx.currency)}
                  </TableCell>
                  <TableCell className="text-sm text-right text-[#6b6864] whitespace-nowrap tabular-nums">
                    {formatAmount(tx.balance_after, tx.balance_currency)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 bg-black/10">
          <div className="text-xs text-[#6b6864]">
            Page <span className="font-medium text-[#f0ede8]">{currentPage}</span> of {totalPages}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="bg-transparent border-white/10 text-[#a09d98] hover:bg-white/5 hover:text-[#f0ede8] h-8 px-2"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
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