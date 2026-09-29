import React from 'react';
import { KeyRound } from 'lucide-react';
import CardSharedComponent from './CardSharedComponent';
import type { PageCheckType } from '../../Types';

export interface LoginCheckCardSharedComponentProps {
  check: PageCheckType;
}

function statusTone(status: PageCheckType['status']): { gradient: string; dotColor: string; textColor: string } {
  if (status === 'Pass') {
    return {
      gradient: 'from-emerald-600/10 via-slate-600/5',
      dotColor: 'bg-emerald-500',
      textColor: 'text-emerald-600 dark:text-emerald-400',
    };
  }
  if (status === 'Warning') {
    return {
      gradient: 'from-amber-500/10 via-slate-500/5',
      dotColor: 'bg-amber-500',
      textColor: 'text-amber-600 dark:text-amber-400',
    };
  }
  return {
    gradient: 'from-rose-600/10 via-slate-600/5',
    dotColor: 'bg-rose-500',
    textColor: 'text-rose-600 dark:text-rose-400',
  };
}

export default function LoginCheckCardSharedComponent({
  check,
}: LoginCheckCardSharedComponentProps): React.JSX.Element {
  const username = typeof check.details?.username === 'string' ? check.details.username : null;
  const tone = statusTone(check.status);

  return (
    <CardSharedComponent className={`!p-0 overflow-hidden bg-gradient-to-br ${tone.gradient} to-transparent dark:bg-[#0d0d10]`}>
      <div className="flex items-center justify-between px-5 pt-5">
        <div className="flex items-center gap-2 min-w-0">
          <KeyRound className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 shrink-0" />
          <span className="text-xs font-mono uppercase tracking-[0.15em] text-slate-400 dark:text-zinc-500 truncate">
            Authentication Login
          </span>
        </div>
        <span className={`flex items-center gap-1.5 text-xs font-medium shrink-0 ${tone.textColor}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${tone.dotColor}`} />
          {check.status}
        </span>
      </div>

      <div className="px-5 py-4 mt-1 text-left min-w-0">
        <div className="font-mono font-extrabold text-4xl text-slate-900 dark:text-zinc-50 leading-none tracking-tight truncate">
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
