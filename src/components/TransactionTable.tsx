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
import { ScrollArea } from '@/components/ui/scroll-area';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Intl.NumberFormat formats amounts correctly per locale.
// 'uk-UA' gives Ukrainian formatting: 1 234,50 ₴
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
  category: string | undefined
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
// TransactionTable
// ---------------------------------------------------------------------------
interface Props {
  transactions: Transaction[];
}

export default function TransactionTable({ transactions }: Props) {
  if (transactions.length === 0) {
    return <EmptyState />;
  }

  return (
    <ScrollArea className="h-[600px] rounded-xl border border-white/10">
      <Table>
        <TableHeader className="sticky top-0 bg-[#1c1c1b] z-10">
          <TableRow className="border-white/10 hover:bg-transparent">
            <TableHead className="text-[#a09d98] font-medium">Date</TableHead>
            <TableHead className="text-[#a09d98] font-medium">Description</TableHead>
            <TableHead className="text-[#a09d98] font-medium">Category</TableHead>
            <TableHead className="text-[#a09d98] font-medium text-right">Amount</TableHead>
            <TableHead className="text-[#a09d98] font-medium text-right">Balance</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {transactions.map((tx) => (
            <TableRow
              key={tx.id}
              className="border-white/5 hover:bg-white/[0.03] transition-colors"
            >
              {/* Date — toLocaleDateString uses the browser locale */}
              <TableCell className="text-[#a09d98] text-sm whitespace-nowrap">
                {new Date(tx.date).toLocaleDateString('uk-UA')}
              </TableCell>

              <TableCell
                className="text-[#f0ede8] text-sm max-w-[240px] truncate"
                title={tx.description} // full text on hover via native tooltip
              >
                {tx.description}
              </TableCell>

              <TableCell>
                <Badge
                  variant={categoryVariant(tx.category)}
                  className="text-[11px] border-white/10 text-[#a09d98] bg-white/5"
                >
                  {tx.category ?? '—'}
                </Badge>
              </TableCell>

              <TableCell
                className={[
                  'text-sm font-medium text-right whitespace-nowrap tabular-nums',
                  tx.amount < 0 ? 'text-red-400' : 'text-emerald-400',
                ].join(' ')}
              >
                {formatAmount(tx.amount, tx.currency)}
              </TableCell>

              {/* Balance after transaction */}
              <TableCell className="text-sm text-right text-[#6b6864] whitespace-nowrap tabular-nums">
                {formatAmount(tx.balance_after, tx.balance_currency)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
