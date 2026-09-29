import React from 'react';
import { ListOrdered } from 'lucide-react';
import CardSharedComponent from './CardSharedComponent';
import BadgeSharedComponent from './BadgeSharedComponent';
import CardOptionsMenuSharedComponent from './CardOptionsMenuSharedComponent';
import type { PageCheckType } from '../../Types';

export interface QueueStatusCardSharedComponentProps {
  check: PageCheckType;
}

interface QueueStateRow {
  state: string;
  lessThan10Min: string;
  lessThan1Hour: string;
  lessThan4Hours: string;
  greaterThan4Hours: string;
}

const BUCKETS: Array<{ key: keyof Omit<QueueStateRow, 'state'>; label: string }> = [
  { key: 'lessThan10Min', label: '<10m' },
  { key: 'lessThan1Hour', label: '<1h' },
  { key: 'lessThan4Hours', label: '<4h' },
  { key: 'greaterThan4Hours', label: '>4h' },
];

function isQueueStateRow(value: unknown): value is QueueStateRow {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return typeof row.state === 'string';
}

function parseBucketValue(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string') {
    const parsed = Number.parseFloat(raw);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

export default function QueueStatusCardSharedComponent({
  check,
}: QueueStatusCardSharedComponentProps): React.JSX.Element {
  const rawStates = check.details?.states;
  const states: QueueStateRow[] = Array.isArray(rawStates) ? rawStates.filter(isQueueStateRow) : [];

  return (
    <CardSharedComponent className="space-y-2.5 bg-gradient-to-br from-indigo-500/10 via-slate-500/5 to-transparent dark:bg-[#0d0d10]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-800 text-white dark:bg-zinc-800/90 dark:text-zinc-200 flex items-center justify-center shadow-xs shrink-0">
            <ListOrdered className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 font-mono truncate">
              {check.pageName || 'Queue Status'}
            </div>
            <div className="text-[11px] text-slate-400 dark:text-zinc-500 -mt-0.5 leading-tight truncate">
              Queue state breakdown
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <BadgeSharedComponent variant="neutral" size="sm">
            {states.length} state{states.length === 1 ? '' : 's'}
          </BadgeSharedComponent>
          <CardOptionsMenuSharedComponent />
        </div>
      </div>

      <div className="border-t border-slate-200/70 dark:border-zinc-800/80" />

      {states.length === 0 ? (
        <p className="text-xs text-slate-400 dark:text-zinc-500">No queue state data captured.</p>
      ) : (
        <div className="space-y-2.5 mt-4">
          {states.map((row, index) => {
            const values = BUCKETS.map((bucket) => parseBucketValue(row[bucket.key]));
            const numericValues = values.filter((value): value is number => value !== null);
            const maxValue = numericValues.length > 0 ? Math.max(...numericValues, 1) : 0;
            const allNumeric = numericValues.length === BUCKETS.length;

            return (
              <div key={`${row.state}-${index}`} className="space-y-1">
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 truncate">
                  {row.state}
                </div>
                {allNumeric ? (
                  <div className="grid grid-cols-4 gap-2">
                    {BUCKETS.map((bucket, bucketIndex) => {
                      const value = values[bucketIndex] ?? 0;
                      const widthPct = maxValue > 0 ? Math.max((value / maxValue) * 100, value > 0 ? 10 : 4) : 4;
                      return (
                        <div key={bucket.key} className="space-y-1 min-w-0">
                          <div className="text-base sm:text-lg font-extrabold font-mono tracking-tight text-slate-900 dark:text-zinc-50 tabular-nums truncate">
                            {value}
                          </div>
                          <div className="h-1 rounded-full bg-slate-200/70 dark:bg-zinc-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-indigo-600 dark:bg-indigo-400"
                              style={{ width: `${widthPct}%` }}
                            />
                          </div>
                          <div className="text-[9px] uppercase tracking-wider font-mono text-slate-400 dark:text-zinc-500">
                            {bucket.label}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] font-mono text-slate-500 dark:text-zinc-400">
                    {BUCKETS.map((bucket) => (
                      <div key={bucket.key} className="flex items-center justify-between">
                        <span>{bucket.label}</span>
                        <span className="text-slate-700 dark:text-zinc-200 font-semibold">
                          {String(row[bucket.key] ?? '—')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="pt-2 border-t border-slate-200/60 dark:border-zinc-800/80 flex items-start gap-1.5 text-[11px] font-mono text-slate-500 dark:text-zinc-400">
        <span className="w-1.5 h-1.5 rounded-full mt-1 shrink-0 bg-indigo-600" />
        <span className="leading-relaxed">{check.message || 'No additional details.'}</span>
      </div>
    </CardSharedComponent>
  );
}
