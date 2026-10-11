import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import ModalSharedComponent from './ModalSharedComponent';
import DateFormatterUtility from '../../Utilities/DateFormatterUtility';
import type { HitAttemptEntry } from '../../Types';

export interface EndpointWakeUpProgressModalSharedComponentProps {
  isOpen: boolean;
  onClose: () => void;
  attempts: HitAttemptEntry[];
}

class HitAttemptPresentationHelper {
  private static readonly RETRYABLE_STATUS_LABELS: Record<number, string> = {
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout',
  };

  public static getLabel(attempt: HitAttemptEntry): string {
    if (attempt.outcome === 'succeeded') return 'Server awake';
    if (attempt.outcome === 'failed') return 'Still unreachable';
    if (attempt.statusCode) {
      return `${attempt.statusCode} ${HitAttemptPresentationHelper.RETRYABLE_STATUS_LABELS[attempt.statusCode] ?? 'Bad Gateway'}`;
    }
    return attempt.errorMessage ? 'Network error' : 'Unreachable';
  }
}

export default function EndpointWakeUpProgressModalSharedComponent({
  isOpen,
  onClose,
  attempts,
}: EndpointWakeUpProgressModalSharedComponentProps): React.JSX.Element {
  const isFinished = attempts.some((attempt) => attempt.outcome !== 'retrying');
  const didSucceed = attempts.some((attempt) => attempt.outcome === 'succeeded');

  return (
    <ModalSharedComponent
      isOpen={isOpen}
      onClose={onClose}
      title="Waking Up Sleeping Server"
      subtitle={
        !isFinished
          ? 'This backend sleeps after inactivity on its free hosting tier — retrying until it responds…'
          : didSucceed
          ? 'Server is awake'
          : "Server never came up — it's likely still asleep or down"
      }
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
                {attempt.outcome === 'retrying' && (
                  <motion.span key="retrying" layoutId={`attempt-icon-${attempt.attemptNumber}`} className="shrink-0">
                    <Loader2 className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 animate-spin" />
                  </motion.span>
                )}
                {attempt.outcome === 'succeeded' && (
                  <motion.span key="succeeded" layoutId={`attempt-icon-${attempt.attemptNumber}`} className="shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  </motion.span>
                )}
                {attempt.outcome === 'failed' && (
                  <motion.span key="failed" layoutId={`attempt-icon-${attempt.attemptNumber}`} className="shrink-0">
                    <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  </motion.span>
                )}
              </AnimatePresence>
              <span className="text-slate-700 dark:text-zinc-300 flex-1 truncate">
                Attempt {attempt.attemptNumber} — {HitAttemptPresentationHelper.getLabel(attempt)}
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
