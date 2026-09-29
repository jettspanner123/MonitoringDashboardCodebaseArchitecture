import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MoreVertical, RotateCcw } from 'lucide-react';
import ConfirmationModalSharedComponent from './ConfirmationModalSharedComponent';

// Small kebab-menu button meant to sit opposite a card's header icon. Only
// one item exists today ("Restart Test"), identical on every card, so it's
// self-contained rather than driven by an options prop. It's a placeholder
// for now — same spirit as the Run Smoke Test modal, which already explains
// that manually triggering a run from this dashboard isn't wired up yet.
export default function CardOptionsMenuSharedComponent(): React.JSX.Element {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isRestartInfoModalOpen, setIsRestartInfoModalOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handlePointerDown);
      document.addEventListener('touchstart', handlePointerDown);
    }, 10);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [isMenuOpen]);

  const handleRestartTestClick = () => {
    setIsMenuOpen(false);
    setIsRestartInfoModalOpen(true);
  };

  return (
    <div className="relative shrink-0" ref={containerRef}>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setIsMenuOpen((prev) => !prev);
        }}
        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-slate-400 dark:text-zinc-500 hover:bg-slate-100 dark:hover:bg-zinc-800/80 hover:text-slate-600 dark:hover:text-zinc-300 flex items-center justify-center transition-colors cursor-pointer"
        aria-label="Card options"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-9 sm:top-10 z-30 w-44 bg-white dark:bg-[#0c0c0e] border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl p-1.5 text-xs"
          >
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleRestartTestClick();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0" />
              <span>Restart Test</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmationModalSharedComponent
        isOpen={isRestartInfoModalOpen}
        onClose={() => setIsRestartInfoModalOpen(false)}
        onConfirm={() => setIsRestartInfoModalOpen(false)}
        title="Restart Test"
        subtitle="Single-Check Rerun"
        description="Restarting an individual check from this dashboard isn't available yet. Full smoke test runs happen automatically every morning via the scheduled MorningSmokeTestAutomation script."
        confirmText="Got It"
        cancelText="Close"
        variant="primary"
        maxWidth="sm"
      />
    </div>
  );
}
