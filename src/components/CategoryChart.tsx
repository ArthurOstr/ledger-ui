import { useMemo } from 'react';
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import type { CategorySpending } from '@/types';

/** Chart slice with the optional transaction count added by the analytics layer. */
interface CategorySlice extends CategorySpending {
  count?: number;
}

interface CategoryChartProps {
  data: CategorySpending[];
  title?: string;
}

const PALETTE = [
  '#10b981',
  '#3b82f6',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#6b7280',
] as const;

/** Tailwind equivalents of PALETTE for the legend dots (JIT-safe literals). */
const DOT_CLASSES = [
  'bg-[#10b981]',
  'bg-[#3b82f6]',
  'bg-[#f59e0b]',
  'bg-[#8b5cf6]',
  'bg-[#ec4899]',
  'bg-[#06b6d4]',
  'bg-[#6b7280]',
] as const;

const MAX_VISIBLE_SLICES = 6;
const OTHER_LABEL = 'Інше (Other)';

/** Exact UAH amount with thousands separators. */
function formatExactUAH(value: number): string {
  const safe = Number(value) || 0;
  return `${new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 2 }).format(safe)} ₴`;
}

/**
 * Keeps the donut readable: when more than 7 categories are present, only the
 * top 6 stay standalone and everything else collapses into 'Інше (Other)'.
 */
function buildSlices(data: CategorySpending[]): CategorySlice[] {
  const sorted: CategorySlice[] = [...data].sort(
    (a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0),
  );

  if (sorted.length <= MAX_VISIBLE_SLICES + 1) {
    return sorted.map((slice) => ({ ...slice }));
  }

  const top = sorted.slice(0, MAX_VISIBLE_SLICES).map((slice) => ({ ...slice }));
  const rest = sorted.slice(MAX_VISIBLE_SLICES);

  const otherAmount = rest.reduce((sum, slice) => sum + (Number(slice.amount) || 0), 0);
  const otherCount = rest.reduce((sum, slice) => sum + (slice.count ?? 0), 0);
  const totalAmount = sorted.reduce((sum, slice) => sum + (Number(slice.amount) || 0), 0);

  const other: CategorySlice = {
    category: OTHER_LABEL,
    amount: otherAmount,
    count: otherCount,
    percentage: totalAmount > 0 ? Math.round((otherAmount / totalAmount) * 100) : 0,
  };

  return [...top, other];
}

interface TooltipEntry {
  payload?: CategorySlice;
}

interface CategoryTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
}

function CategoryTooltip({ active, payload }: CategoryTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const slice = payload[0]?.payload;
  if (!slice) return null;

  return (
    <div className="rounded-lg border border-white/10 bg-[#0f0f0e] px-3 py-2 shadow-xl">
      <p className="mb-1 text-xs font-medium text-[#f0ede8]">{slice.category}</p>
      <p className="text-sm text-[#f0ede8] tabular-nums">{formatExactUAH(slice.amount)}</p>
      <div className="mt-1 flex items-center gap-2 text-xs text-[#6b6864]">
        <span>{slice.count ?? 0} transactions</span>
        <span aria-hidden="true">·</span>
        <span className="tabular-nums">{slice.percentage}%</span>
      </div>
    </div>
  );
}

export default function CategoryChart({ data, title = 'Spending by Category' }: CategoryChartProps) {
  const slices = useMemo(() => buildSlices(data), [data]);
  const hasData = slices.length > 0;

  return (
    <div className="bg-[#1c1c1b] border border-white/10 rounded-xl p-5">
      <div className="mb-4 flex items-center gap-2">
        <PieChartIcon size={16} className="shrink-0 text-[#a09d98]" />
        <h3 className="text-sm font-medium text-[#f0ede8]">{title}</h3>
      </div>

      {hasData ? (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Tooltip content={<CategoryTooltip />} />
              <Pie
                data={slices}
                dataKey="amount"
                nameKey="category"
                innerRadius={58}
                outerRadius={84}
                paddingAngle={3}
                stroke="#1c1c1b"
                strokeWidth={2}
                label={false}
                labelLine={false}
              >
                {slices.map((slice, index) => (
                  <Cell key={slice.category} fill={PALETTE[index % PALETTE.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <ul className="mt-4 space-y-2">
            {slices.map((slice, index) => (
              <li key={slice.category} className="flex items-center gap-2 text-sm">
                <span
                  className={`h-2 w-2 rounded-full shrink-0 ${DOT_CLASSES[index % DOT_CLASSES.length]}`}
                />
                <span className="truncate text-[#f0ede8]">{slice.category}</span>
                <span className="ml-1 rounded-full border border-white/5 bg-white/5 px-1.5 py-0.5 text-[10px] leading-none text-[#a09d98] tabular-nums">
                  {slice.percentage}%
                </span>
                <span className="ml-auto text-[#f0ede8] tabular-nums">
                  {formatExactUAH(slice.amount)}
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="flex h-[220px] items-center justify-center">
          <p className="text-sm text-[#6b6864]">No expenses recorded for this period</p>
        </div>
      )}
    </div>
  );
}
