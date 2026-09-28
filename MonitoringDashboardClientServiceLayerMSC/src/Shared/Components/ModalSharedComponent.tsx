import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

export interface ModalSharedComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Extra controls rendered in the header row, just to the left of the close (X) button.
   * Hidden below the `sm` breakpoint when `headerActionsMobileRow` is also provided. */
  headerActions?: React.ReactNode;
  /** Mobile-only (hidden at `sm` and up) full-width row rendered directly below the title/close
   * row - e.g. a page-switcher segmented control that needs more room than the header can spare
   * next to the title on a narrow screen. */
  headerActionsMobileRow?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl';
  /** Animated minimum body height in pixels. Driven via framer-motion's `animate` (not a CSS
   * class) because CSS transitions cannot interpolate min-height to/from its default `auto`. */
  minHeightPx?: number;
  scrollMode?: 'backdrop' | 'body';
  /** 'capped' (default) keeps the existing ~90dvh dialog cap with an internally-scrolling body.
   * 'full' removes that cap entirely so the dialog grows to whatever height its content needs,
   * relying on the outer portal container's own scroll instead - a true "classic", backdrop-
   * scrollable modal. Opt-in only: existing modals are unaffected unless they pass this. */
  heightMode?: 'capped' | 'full';
  animationType?: 'scale' | 'slide-up';
  exitDirection?: 'down' | 'up';
  headerCloseDirection?: 'down' | 'up';
  zIndex?: number;
}

export default function ModalSharedComponent({
  isOpen,
  onClose,
  title,
  subtitle,
  headerActions,
  headerActionsMobileRow,
  children,
  footer,
  maxWidth = '2xl',
  minHeightPx,
  scrollMode = 'backdrop',
  heightMode = 'capped',
  animationType = 'slide-up',
  exitDirection: exitDirectionProp = 'down',
  headerCloseDirection = 'down',
  zIndex = 50,
}: ModalSharedComponentProps): React.JSX.Element | null {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const dialogCardRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const minHeightAnimFrameRef = useRef<number | null>(null);
  const [internalExitDirection, setInternalExitDirection] = useState<'down' | 'up'>(exitDirectionProp);
  const prevOpenRef = useRef(isOpen);

  // Manually rAF-driven instead of a framer-motion `animate` prop: min-height did not reliably
  // pick up animated numeric values through motion's style engine in testing, so this drives the
  // inline style directly, which is guaranteed to work regardless of that.
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const target = minHeightPx ?? 0;
    const start = parseFloat(el.style.minHeight) || 0;
    if (start === target) return;

    if (minHeightAnimFrameRef.current !== null) {
      cancelAnimationFrame(minHeightAnimFrameRef.current);
    }

    const duration = 350;
    const startTime = performance.now();
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const value = start + (target - start) * easeOutCubic(progress);
      el.style.minHeight = `${value}px`;
      if (progress < 1) {
        minHeightAnimFrameRef.current = requestAnimationFrame(tick);
      } else {
        minHeightAnimFrameRef.current = null;
      }
    };

    minHeightAnimFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (minHeightAnimFrameRef.current !== null) {
        cancelAnimationFrame(minHeightAnimFrameRef.current);
      }
    };
  }, [minHeightPx]);

  useEffect(() => {
    setInternalExitDirection(exitDirectionProp);
  }, [exitDirectionProp]);

  useEffect(() => {
    if (isOpen && !prevOpenRef.current) {
      setInternalExitDirection(exitDirectionProp || 'down');
    }
    prevOpenRef.current = isOpen;
  }, [isOpen, exitDirectionProp]);

  const getScrollAwareDirection = (): 'down' | 'up' => {
    if (scrollMode === 'backdrop' && scrollContainerRef.current) {
      return scrollContainerRef.current.scrollTop > 40 ? 'up' : 'down';
    }
    return 'down';
  };

  const handleBackdropClick = () => {
    const direction = getScrollAwareDirection();
    setInternalExitDirection(direction);
    setTimeout(() => onClose(), 0);
  };

  const handleEscapeKey = () => {
    const direction = getScrollAwareDirection();
    setInternalExitDirection(direction);
    setTimeout(() => onClose(), 0);
  };

  const handleHeaderClose = () => {
    setInternalExitDirection(headerCloseDirection);
    setTimeout(() => onClose(), 0);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleEscapeKey();
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen]);

  // Prevent background page scroll while the modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  let widthClass = 'max-w-2xl';
  if (maxWidth === 'sm') widthClass = 'max-w-sm';
  if (maxWidth === 'md') widthClass = 'max-w-md';
  if (maxWidth === 'lg') widthClass = 'max-w-lg';
  if (maxWidth === 'xl') widthClass = 'max-w-xl';
  if (maxWidth === '2xl') widthClass = 'max-w-2xl';
  if (maxWidth === '3xl') widthClass = 'max-w-3xl';
  if (maxWidth === '4xl') widthClass = 'max-w-4xl';
  if (maxWidth === '5xl') widthClass = 'max-w-5xl';
  if (maxWidth === '6xl') widthClass = 'max-w-6xl';
  if (maxWidth === '7xl') widthClass = 'max-w-7xl';

  const isSlideUp = animationType === 'slide-up';
  const activeExitDirection: 'down' | 'up' =
    exitDirectionProp === 'up' || internalExitDirection === 'up' ? 'up' : 'down';

  const getExitDistance = (dir: 'down' | 'up'): number => {
    if (typeof window === 'undefined') return dir === 'up' ? -1500 : 1500;
    const vh = window.innerHeight || 800;
    const cardHeight = dialogCardRef.current?.offsetHeight || 600;
    const scrollTop = scrollContainerRef.current?.scrollTop || 0;
    return dir === 'up' ? -(cardHeight + vh + scrollTop + 400) : cardHeight + vh + 400;
  };

  const modalVariants = {
    initial: {
      y: isSlideUp ? (typeof window !== 'undefined' ? window.innerHeight + 600 : '120vh') : 8,
      opacity: isSlideUp ? 1 : 0,
      scale: isSlideUp ? 1 : 0.96,
    },
    animate: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const },
    },
    exit: (customDir?: 'down' | 'up') => {
      const dir = customDir || activeExitDirection;
      const distance = getExitDistance(dir);
      return {
        y: isSlideUp ? distance : (dir === 'up' ? -16 : 16),
        opacity: isSlideUp ? 1 : 0,
        scale: isSlideUp ? 1 : 0.96,
        transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as const },
      };
    },
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence custom={activeExitDirection}>
      {isOpen && (
        <motion.div
          key="modal-portal-container"
          ref={scrollContainerRef}
          style={{ zIndex }}
          className="fixed inset-0 flex items-end sm:items-start justify-center p-0 sm:p-6 overflow-y-auto overflow-x-hidden w-[100dvw] h-[100dvh]"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 1, transition: { duration: 0.55 } }}
        >
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
            onClick={handleBackdropClick}
            className="fixed inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm w-[100dvw] h-[100dvh] cursor-pointer"
          />

          <motion.div
            key="modal-dialog-card"
            ref={dialogCardRef}
            custom={activeExitDirection}
            variants={modalVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={`relative w-[100dvw] sm:w-full ${widthClass} bg-white dark:bg-[#0a0a0c] hairline-border-strong rounded-t-2xl rounded-b-none sm:rounded-2xl shadow-2xl z-10 my-0 sm:my-8 flex flex-col shrink-0 max-h-[92dvh] ${
              heightMode === 'full' ? 'sm:max-h-none' : 'sm:max-h-[90vh]'
            }`}
          >
            {(title || subtitle) && (
              <div className="border-b border-slate-200 dark:border-zinc-800/80 shrink-0">
                <div className="px-5 sm:px-6 py-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    {title && (
                      <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-zinc-100 font-serif-headline">
                        {title}
                      </h2>
                    )}
                    {subtitle && (
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                        {subtitle}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {headerActions && (
                      <div className={headerActionsMobileRow ? 'hidden sm:flex' : 'flex'}>{headerActions}</div>
                    )}
                    <button
                      onClick={handleHeaderClose}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                {headerActionsMobileRow && (
                  <div className="px-5 pb-3 -mt-1 sm:hidden">{headerActionsMobileRow}</div>
                )}
              </div>
            )}

            <div
              ref={bodyRef}
              className={`p-5 sm:p-6 flex-1 overflow-y-auto max-h-[calc(92dvh-130px)] ${
                heightMode === 'full' ? 'sm:max-h-none sm:overflow-visible' : 'sm:max-h-none'
              }`}
            >
              {children}
            </div>

            {footer && (
              <div
                className="px-5 sm:px-6 py-3.5 sm:py-4 border-t border-slate-200 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-[#08080a] shrink-0 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-4"
              >
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
