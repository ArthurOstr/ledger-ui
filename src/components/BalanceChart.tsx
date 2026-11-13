import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import type { BalancePoint } from '@/types';

interface BalanceChartProps {
  data: BalancePoint[];
  title?: string;
}

/** Compact UAH tick formatting: 12000 -> '12k ₴', 12500 -> '12.5k ₴'. */
function formatCompactUAH(value: number): string {
  const safe = Number(value) || 0;
  const abs = Math.abs(safe);

  if (abs >= 1_000_000) {
    return `${(safe / 1_000_000).toFixed(1).replace(/\.0$/, '')}M ₴`;
  }
  if (abs >= 1_000) {
    return `${(safe / 1_000).toFixed(1).replace(/\.0$/, '')}k ₴`;
  }
  return `${Math.round(safe)} ₴`;
}

/** Exact UAH amount with thousands separators for tooltip display. */
function formatExactUAH(value: number): string {
  const safe = Number(value) || 0;
  return `${new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 2 }).format(safe)} ₴`;
}

/** 'DD.MM.YYYY' from a millisecond timestamp, falling back to the raw label. */
function formatTooltipDate(timestamp: number, fallback: string): string {
  const date = new Date(timestamp);
  if (!Number.isFinite(date.getTime())) return fallback;

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}.${date.getFullYear()}`;
}

interface TooltipEntry {
  payload?: BalancePoint;
}

interface BalanceTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
}

function BalanceTooltip({ active, payload }: BalanceTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="rounded-lg border border-white/10 bg-[#0f0f0e] px-3 py-2 shadow-xl">
      <p className="mb-1 text-xs text-[#6b6864]">
        {formatTooltipDate(point.timestamp, point.date)}
      </p>
      <p className="text-sm font-medium text-[#f0ede8] tabular-nums">
        {formatExactUAH(point.balance)}
      </p>
    </div>
  );
}

export default function BalanceChart({ data, title = 'Balance Trajectory (UAH)' }: BalanceChartProps) {
  const hasData = data.length > 0;

  return (
    <div className="bg-[#1c1c1b] border border-white/10 rounded-xl p-5">
      <div className="mb-4 flex items-center gap-2">
        <TrendingUp size={16} className="shrink-0 text-emerald-400" />
        <h3 className="text-sm font-medium text-[#f0ede8]">{title}</h3>
      </div>

      {hasData ? (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: 8 }}>
            <defs>
              <linearGradient id="balanceAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="rgba(255,255,255,0.06)"
              strokeDasharray="4 4"
              vertical={false}
            />

            <XAxis
              dataKey="date"
              tick={{ fill: '#6b6864', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />

            <YAxis
              width={72}
              domain={['auto', 'auto']}
              tickFormatter={formatCompactUAH}
              tick={{ fill: '#6b6864', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />

            <Tooltip
              content={<BalanceTooltip />}
              cursor={{ stroke: 'rgba(255,255,255,0.15)', strokeDasharray: '4 4' }}
            />

            <Area
              type="monotone"
              dataKey="balance"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#balanceAreaGradient)"
              dot={false}
              activeDot={{ r: 4, fill: '#10b981', stroke: '#0f0f0e', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-[280px] items-center justify-center">
          <p className="text-sm text-[#6b6864]">No balance history available for this period</p>
        </div>
      )}
    </div>
  );
}
