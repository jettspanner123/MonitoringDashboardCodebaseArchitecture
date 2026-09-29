import React from 'react';
import { Radio } from 'lucide-react';
import CardSharedComponent from './CardSharedComponent';
import type { PageCheckType } from '../../Types';

export interface PingCheckCardSharedComponentProps {
  check: PageCheckType;
}

function statusTone(status: PageCheckType['status']): { gradient: string; iconBg: string } {
  if (status === 'Pass') {
    return { gradient: 'from-emerald-600/10 via-slate-600/5', iconBg: 'bg-emerald-800' };
  }
  if (status === 'Warning') {
    return { gradient: 'from-amber-500/10 via-slate-500/5', iconBg: 'bg-amber-700' };
  }
  return { gradient: 'from-rose-600/10 via-slate-600/5', iconBg: 'bg-rose-800' };
}

export default function PingCheckCardSharedComponent({
  check,
}: PingCheckCardSharedComponentProps): React.JSX.Element {
  const statusCode = typeof check.details?.statusCode === 'number' ? check.details.statusCode : null;
  const tone = statusTone(check.status);

  return (
    <CardSharedComponent className={`!p-0 overflow-hidden bg-gradient-to-br ${tone.gradient} to-transparent dark:bg-[#0d0d10]`}>
      <div className="flex items-center gap-3 px-5 pt-5">
        <div
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg ${tone.iconBg} text-white dark:bg-zinc-800/90 dark:text-zinc-200 flex items-center justify-center shadow-xs shrink-0`}
        >
          <Radio className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 font-mono truncate">
            Authentication Ping
          </div>
          <div className="text-[11px] text-slate-400 dark:text-zinc-500 -mt-0.5 leading-tight truncate">
            Authentication reachability check
          </div>
        </div>
      </div>

      <div className="px-5 py-4 mt-1 text-left">
        <div className="font-mono font-extrabold text-4xl text-slate-900 dark:text-zinc-50 leading-none tracking-tight">
          {statusCode !== null ? statusCode : '—'}
        </div>
        <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-zinc-500 mt-2.5">
          HTTP Status
        </div>
      </div>

      <p className="text-[11px] text-slate-400 dark:text-zinc-500 px-5 py-3.5 mt-3 border-t border-slate-100 dark:border-zinc-800/60 bg-slate-50/60 dark:bg-zinc-900/30">
        {check.message || 'No additional details.'}
      </p>
    </CardSharedComponent>
  );
}
