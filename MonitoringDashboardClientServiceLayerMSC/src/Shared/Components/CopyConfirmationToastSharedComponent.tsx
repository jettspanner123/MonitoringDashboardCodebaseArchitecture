import React from 'react';
import { Check, AlertTriangle } from 'lucide-react';

export interface CopyConfirmationToastSharedComponentProps {
  label: string;
  isError?: boolean;
}

// Rendered via sonner's toast.custom() with toastOptions={{ unstyled: true }} -
// sonner contributes positioning/stacking/dismissal only, all visuals here
// match this app's own card/menu surface language instead of sonner's defaults.
export default function CopyConfirmationToastSharedComponent({
  label,
  isError = false,
}: CopyConfirmationToastSharedComponentProps): React.JSX.Element {
  return (
    <div
      className={`flex items-center gap-2.5 px-4 py-3 min-w-[220px] rounded-xl border shadow-xl shadow-slate-900/10 dark:shadow-black/60 backdrop-blur-md text-xs font-medium ${
        isError
          ? 'bg-rose-50/95 dark:bg-rose-950/90 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300'
          : 'bg-white/95 dark:bg-[#0c0c0e]/95 border-slate-200/90 dark:border-white/10 text-slate-700 dark:text-zinc-200'
      }`}
    >
      <span
        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
          isError
            ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300'
            : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400'
        }`}
      >
        {isError ? <AlertTriangle className="w-3 h-3" /> : <Check className="w-3 h-3" />}
      </span>
      <span className="truncate">{label}</span>
    </div>
  );
}
