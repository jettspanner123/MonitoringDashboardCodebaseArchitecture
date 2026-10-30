import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import ModalSharedComponent from './ModalSharedComponent';
import DateFormatterUtility from '../../Utilities/DateFormatterUtility';
import type { ServiceActionAttemptEntry } from '../../Types';

export interface ClientMachineServiceActionProgressModalSharedComponentProps {
  isOpen: boolean;
  onClose: () => void;
  attempts: ServiceActionAttemptEntry[];
}

class ServiceActionAttemptPresentationHelper {
  private static readonly PHASE_LABELS: Record<string, string> = {
    stopping: 'Stopping',
    starting: 'Starting',
    checking: 'Checking',
  };

  public static getLabel(attempt: ServiceActionAttemptEntry): string {
    const phaseLabel = ServiceActionAttemptPresentationHelper.PHASE_LABELS[attempt.phase] ?? attempt.phase;
    if (attempt.outcome === 'succeeded') return `${phaseLabel} — ${attempt.stateLabel ?? 'Done'}`;
    if (attempt.outcome === 'failed') return `${phaseLabel} — Failed`;
    return `${phaseLabel}${attempt.stateLabel ? ` — ${attempt.stateLabel}` : '…'}`;
  }
}

export default function ClientMachineServiceActionProgressModalSharedComponent({
  isOpen,
  onClose,
  attempts,
}: ClientMachineServiceActionProgressModalSharedComponentProps): React.JSX.Element {
  const isFinished = attempts.some((attempt) => attempt.outcome !== 'running');
  const didSucceed = isFinished && attempts.length > 0 && attempts[attempts.length - 1].outcome === 'succeeded';

  return (
    <ModalSharedComponent
      isOpen={isOpen}
      onClose={onClose}
      title="Restarting Service"
      subtitle={!isFinished ? 'Stopping, then starting back up…' : didSucceed ? 'Service restarted' : 'Restart did not complete'}
      maxWidth="md"
    >
      <div className="space-y-1.5">
        {attempts.length === 0 && <p className="text-xs text-slate-400 dark:text-zinc-500">Starting…</p>}
        <AnimatePresence initial={false}>
          {attempts.map((attempt) => (
            <motion.div
              key={attempt.attemptNumber}
              layout
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-900/40 text-xs font-mono"
            >
              <AnimatePresence mode="wait" initial={false}>
                {attempt.outcome === 'running' && (
                  <motion.span key="running" layoutId={`action-icon-${attempt.attemptNumber}`} className="shrink-0">
                    <Loader2 className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 animate-spin" />
                  </motion.span>
                )}
                {attempt.outcome === 'succeeded' && (
                  <motion.span key="succeeded" layoutId={`action-icon-${attempt.attemptNumber}`} className="shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  </motion.span>
                )}
                {attempt.outcome === 'failed' && (
                  <motion.span key="failed" layoutId={`action-icon-${attempt.attemptNumber}`} className="shrink-0">
                    <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  </motion.span>
                )}
              </AnimatePresence>
              <span className="text-slate-700 dark:text-zinc-300 flex-1 truncate">
                {ServiceActionAttemptPresentationHelper.getLabel(attempt)}
              </span>
              <span className="text-slate-400 dark:text-zinc-500 shrink-0">
                {DateFormatterUtility.current.formatTime(attempt.attemptedAt)}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ModalSharedComponent>
  );
}
