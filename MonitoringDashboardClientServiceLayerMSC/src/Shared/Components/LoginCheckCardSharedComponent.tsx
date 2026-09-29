import React from 'react';
import { KeyRound } from 'lucide-react';
import CardSharedComponent from './CardSharedComponent';
import type { PageCheckType } from '../../Types';

export interface LoginCheckCardSharedComponentProps {
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

export default function LoginCheckCardSharedComponent({
  check,
}: LoginCheckCardSharedComponentProps): React.JSX.Element {
  const username = typeof check.details?.username === 'string' ? check.details.username : null;
  const tone = statusTone(check.status);

  return (
    <CardSharedComponent className={`!p-0 overflow-hidden bg-gradient-to-br ${tone.gradient} to-transparent dark:bg-[#0d0d10]`}>
      <div className="flex items-center gap-3 px-5 pt-5">
        <div
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg ${tone.iconBg} text-white dark:bg-zinc-800/90 dark:text-zinc-200 flex items-center justify-center shadow-xs shrink-0`}
        >
          <KeyRound className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 font-mono truncate">
            Authentication Login
          </div>
          <div className="text-[11px] text-slate-400 dark:text-zinc-500 -mt-0.5 leading-tight truncate">
            Platform sign-in check
          </div>
        </div>
      </div>

      <div className="mx-5 mt-4 border-t border-slate-200/70 dark:border-zinc-800/80" />

      <div className="px-5 py-4 text-left min-w-0">
        <div className="font-mono font-extrabold text-3xl text-slate-900 dark:text-zinc-50 leading-none tracking-tight truncate">
          {username !== null ? username : '—'}
        </div>
        <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-zinc-500 mt-2.5">
          User
        </div>
      </div>

      <p className="text-[11px] text-slate-400 dark:text-zinc-500 px-5 py-3.5 mt-3 border-t border-slate-100 dark:border-zinc-800/60 bg-slate-50/60 dark:bg-zinc-900/30">
        {check.message || 'No additional details.'}
      </p>
    </CardSharedComponent>
  );
}
