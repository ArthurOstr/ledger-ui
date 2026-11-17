import { Calendar } from 'lucide-react';
import type { PeriodPreset, DateRange } from '@/types';

interface PeriodSelectorProps {
  preset: PeriodPreset;
  customRange: DateRange;
  onPresetChange: (preset: PeriodPreset) => void;
  onCustomRangeChange: (range: DateRange) => void;
}

/** Wall-clock period presets with an optional explicit custom date window. */
export default function PeriodSelector({
  preset,
  customRange,
  onPresetChange,
  onCustomRangeChange,
}: PeriodSelectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <Calendar
          size={14}
          aria-hidden="true"
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#a09d98]"
        />
        <select
          value={preset}
          onChange={(event) => onPresetChange(event.target.value as PeriodPreset)}
          aria-label="Reporting period"
          className="bg-[#1c1c1b] border border-white/10 text-[#f0ede8] rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-white/20"
        >
          <optgroup label="Overview">
            <option value="ALL_TIME">All Time</option>
          </optgroup>
          <optgroup label="Rolling Windows">
            <option value="LAST_30_DAYS">Last 30 Days</option>
            <option value="LAST_90_DAYS">Last 90 Days</option>
          </optgroup>
          <optgroup label="Calendar Periods">
            <option value="THIS_MONTH">This Month</option>
            <option value="LAST_MONTH">Last Month</option>
            <option value="THIS_QUARTER">This Quarter</option>
            <option value="LAST_QUARTER">Last Quarter</option>
            <option value="THIS_YEAR">This Year</option>
            <option value="LAST_YEAR">Last Year</option>
          </optgroup>
          <optgroup label="Custom">
            <option value="CUSTOM">Custom Range...</option>
          </optgroup>
        </select>
      </div>

      {preset === 'CUSTOM' && (
        <>
          <input
            type="date"
            value={customRange.startDate ?? ''}
            max={customRange.endDate || undefined}
            onChange={(event) =>
              onCustomRangeChange({ ...customRange, startDate: event.target.value || null })
            }
            aria-label="Custom range start"
            className="[color-scheme:dark] bg-[#1c1c1b] border border-white/10 text-[#f0ede8] rounded-lg px-2.5 py-1 text-xs"
          />
          <input
            type="date"
            value={customRange.endDate ?? ''}
            min={customRange.startDate || undefined}
            onChange={(event) =>
              onCustomRangeChange({ ...customRange, endDate: event.target.value || null })
            }
            aria-label="Custom range end"
            className="[color-scheme:dark] bg-[#1c1c1b] border border-white/10 text-[#f0ede8] rounded-lg px-2.5 py-1 text-xs"
          />
        </>
      )}
    </div>
  );
}
