import React from 'react';
import { KeyRound } from 'lucide-react';
import CardSharedComponent from './CardSharedComponent';
import BadgeSharedComponent from './BadgeSharedComponent';
import type { PageCheckType } from '../../Types';

export interface LoginCheckCardSharedComponentProps {
  check: PageCheckType;
}

function statusBadgeVariant(status: PageCheckType['status']): 'success' | 'warning' | 'danger' {
  if (status === 'Pass') return 'success';
  if (status === 'Warning') return 'warning';
  return 'danger';
}

function statusTone(status: PageCheckType['status']): { gradient: string; iconBg: string; dot: string } {
  if (status === 'Pass') return { gradient: 'from-emerald-600/10 via-slate-600/5', iconBg: 'bg-emerald-800', dot: 'bg-emerald-600' };
  if (status === 'Warning') return { gradient: 'from-amber-500/10 via-slate-500/5', iconBg: 'bg-amber-700', dot: 'bg-amber-500' };
  return { gradient: 'from-rose-600/10 via-slate-600/5', iconBg: 'bg-rose-800', dot: 'bg-rose-600' };
}

export default function LoginCheckCardSharedComponent({
  check,
}: LoginCheckCardSharedComponentProps): React.JSX.Element {
  const username = typeof check.details?.username === 'string' ? check.details.username : null;
  const tone = statusTone(check.status);

  return (
    <CardSharedComponent
      className={`space-y-3 bg-gradient-to-br ${tone.gradient} to-transparent dark:bg-[#0d0d10]`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-9 h-9 rounded-lg ${tone.iconBg} text-white dark:bg-zinc-800/90 dark:text-zinc-200 flex items-center justify-center shadow-xs shrink-0`}
          >
            <KeyRound className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-mono block truncate">
              Authentication
            </span>
            <span className="text-sm font-bold text-slate-900 dark:text-zinc-100 truncate block">Login Check</span>
          </div>
        </div>
        <BadgeSharedComponent variant={statusBadgeVariant(check.status)} size="sm">
          {check.status}
        </BadgeSharedComponent>
      </div>

      {username !== null && (
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="text-lg font-extrabold font-mono tracking-tight text-slate-900 dark:text-zinc-50 truncate">
            {username}
          </span>
          <span className="text-[10px] uppercase tracking-wider font-mono text-slate-400 dark:text-zinc-500 shrink-0">
            User
          </span>
        </div>
      )}

      <div className="pt-2.5 border-t border-slate-200/60 dark:border-zinc-800/80 flex items-start gap-1.5 text-[11px] font-mono text-slate-500 dark:text-zinc-400">
        <span className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${tone.dot}`} />
        <span className="leading-relaxed">{check.message || 'No additional details.'}</span>
      </div>
    </CardSharedComponent>
  );
}
