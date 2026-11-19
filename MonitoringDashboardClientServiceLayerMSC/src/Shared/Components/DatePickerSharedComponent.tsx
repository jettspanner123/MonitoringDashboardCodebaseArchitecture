import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import ApplicationHapticsUtility from '../../Utilities/ApplicationHapticsUtility';

export interface DatePickerSharedComponentProps {
  label?: string;
  // ISO date key, 'YYYY-MM-DD', in the viewer's local calendar - not a full
  // ISO timestamp, and not UTC-normalized (matches how the rest of this app
  // already buckets runs into calendar days).
  value: string | null;
  onChange: (dateKey: string) => void;
  // Generic availability predicate - this component has no idea what a
  // "run" is; the caller decides which dates can be picked.
  isDateDisabled?: (dateKey: string) => boolean;
  placeholder?: string;
  size?: 'sm' | 'md';
  className?: string;
}

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function fromDateKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function addMonths(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + amount);
  return next;
}

function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function getCalendarWeeks(visibleMonth: Date): Date[][] {
  const firstOfMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
  const gridStart = addDays(firstOfMonth, -firstOfMonth.getDay());
  const weeks: Date[][] = [];
  let cursor = gridStart;
  for (let week = 0; week < 6; week++) {
    const days: Date[] = [];
    for (let day = 0; day < 7; day++) {
      days.push(cursor);
      cursor = addDays(cursor, 1);
    }
    weeks.push(days);
  }
  return weeks;
}

const monthYearFormatter = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' });
const fullDateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});
const displayFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

// Generic, fully keyboard-accessible single-date picker (WAI-ARIA APG grid
// pattern - roving tabindex, arrow/Home/End/PageUp/PageDown navigation,
// Enter/Space to select, Escape to close). Knows nothing about what a date
// is "for" - availability is entirely caller-defined via isDateDisabled.
export default function DatePickerSharedComponent({
  label,
  value,
  onChange,
  isDateDisabled,
  placeholder = 'Select date...',
  size = 'md',
  className = 'w-full',
}: DatePickerSharedComponentProps): React.JSX.Element {
  const today = new Date();
  const [isOpen, setIsOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => (value ? fromDateKey(value) : today));
  const [focusedKey, setFocusedKey] = useState(() => value ?? toDateKey(today));

  const containerRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);

  const disabledCheck = (dateKey: string): boolean => (isDateDisabled ? isDateDisabled(dateKey) : false);

  useEffect(() => {
    if (!isOpen) return;

    setVisibleMonth(value ? fromDateKey(value) : today);
    setFocusedKey(value ?? toDateKey(today));

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    // Keep the focused day scrolled/visible and move real DOM focus there so
    // arrow keys work immediately without an extra click.
    const button = gridRef.current?.querySelector<HTMLButtonElement>(`[data-date-key="${focusedKey}"]`);
    button?.focus();
  }, [isOpen, focusedKey, visibleMonth]);

  const moveFocus = (nextDate: Date): void => {
    if (!isSameMonth(nextDate, visibleMonth)) {
      setVisibleMonth(nextDate);
    }
    setFocusedKey(toDateKey(nextDate));
  };

  const handleSelect = (dateKey: string): void => {
    if (disabledCheck(dateKey)) return;
    ApplicationHapticsUtility.current.triggerHapticFeedback(12);
    onChange(dateKey);
    setIsOpen(false);
  };

  const handleGridKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    const focusedDate = fromDateKey(focusedKey);

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        moveFocus(addDays(focusedDate, -1));
        return;
      case 'ArrowRight':
        event.preventDefault();
        moveFocus(addDays(focusedDate, 1));
        return;
      case 'ArrowUp':
        event.preventDefault();
        moveFocus(addDays(focusedDate, -7));
        return;
      case 'ArrowDown':
        event.preventDefault();
        moveFocus(addDays(focusedDate, 7));
        return;
      case 'Home':
        event.preventDefault();
        moveFocus(addDays(focusedDate, -focusedDate.getDay()));
        return;
      case 'End':
        event.preventDefault();
        moveFocus(addDays(focusedDate, 6 - focusedDate.getDay()));
        return;
      case 'PageUp':
        event.preventDefault();
        moveFocus(addMonths(focusedDate, event.shiftKey ? -12 : -1));
        return;
      case 'PageDown':
        event.preventDefault();
        moveFocus(addMonths(focusedDate, event.shiftKey ? 12 : 1));
        return;
      case 'Enter':
      case ' ':
        event.preventDefault();
        handleSelect(focusedKey);
        return;
      case 'Escape':
        event.preventDefault();
        setIsOpen(false);
        return;
      default:
        return;
    }
  };

  const heightClass = size === 'sm' ? 'h-11 sm:h-9 px-3.5 sm:px-2.5 text-sm sm:text-xs' : 'h-11 sm:h-10 px-3.5 sm:px-3 text-sm sm:text-xs';
  const weeks = getCalendarWeeks(visibleMonth);
  const todayKey = toDateKey(today);
  const monthYearId = React.useId();

  return (
    <div className={`relative self-start ${className}`} ref={containerRef}>
      {label && <label className="text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1 block">{label}</label>}

      <button
        type="button"
        onPointerDown={() => ApplicationHapticsUtility.current.triggerHapticFeedback(12)}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={value ? `Selected date: ${fullDateFormatter.format(fromDateKey(value))}` : 'Choose a date'}
        className={`${className.includes('w-') ? 'w-full' : ''} ${heightClass} rounded-xl sm:rounded-lg bg-white dark:bg-[#0a0a0c] text-slate-900 dark:text-zinc-100 border border-slate-200/80 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 transition-colors focus:outline-none flex items-center justify-between gap-2 cursor-pointer select-none`}
      >
        <div className="flex items-center gap-2 truncate font-medium">
          <CalendarDays className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 shrink-0" />
          <span className="truncate font-semibold">{value ? displayFormatter.format(fromDateKey(value)) : placeholder}</span>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="dialog"
            aria-label="Choose date"
            initial={{ opacity: 0, scale: 0.96, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 4 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 top-full mt-1.5 z-50 w-72 bg-white dark:bg-[#0c0c0e] border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl p-3 text-xs"
          >
            <div className="flex items-center justify-between mb-2.5">
              <button
                type="button"
                onClick={() => setVisibleMonth((prev) => addMonths(prev, -1))}
                aria-label="Previous month"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span id={monthYearId} aria-live="polite" className="font-bold text-sm text-slate-900 dark:text-zinc-100">
                {monthYearFormatter.format(visibleMonth)}
              </span>
              <button
                type="button"
                onClick={() => setVisibleMonth((prev) => addMonths(prev, 1))}
                aria-label="Next month"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div
              ref={gridRef}
              role="grid"
              aria-labelledby={monthYearId}
              onKeyDown={handleGridKeyDown}
              className="outline-none"
            >
              <div role="row" className="grid grid-cols-7 mb-1">
                {WEEKDAY_LABELS.map((weekday, index) => (
                  <div
                    key={`${weekday}-${index}`}
                    role="columnheader"
                    aria-label={weekday}
                    className="h-7 flex items-center justify-center text-[10px] font-mono uppercase text-slate-400 dark:text-zinc-500"
                  >
                    {weekday}
                  </div>
                ))}
              </div>

              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} role="row" className="grid grid-cols-7">
                  {week.map((date) => {
                    const dateKey = toDateKey(date);
                    const isDisabled = disabledCheck(dateKey);
                    const isOutsideMonth = !isSameMonth(date, visibleMonth);
                    const isSelected = value === dateKey;
                    const isToday = dateKey === todayKey;
                    const isFocusTarget = dateKey === focusedKey;

                    return (
                      <div key={dateKey} role="gridcell" aria-selected={isSelected}>
                        <button
                          type="button"
                          data-date-key={dateKey}
                          tabIndex={isFocusTarget ? 0 : -1}
                          aria-disabled={isDisabled}
                          aria-label={fullDateFormatter.format(date)}
                          onClick={() => handleSelect(dateKey)}
                          onFocus={() => setFocusedKey(dateKey)}
                          className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-mono transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0C2086] ${
                            isSelected
                              ? 'bg-[#0C2086] text-white font-bold'
                              : isDisabled
                                ? 'text-slate-300 dark:text-zinc-700 cursor-not-allowed'
                                : isOutsideMonth
                                  ? 'text-slate-300 dark:text-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800/80 cursor-pointer'
                                  : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/80 cursor-pointer'
                          } ${isToday && !isSelected ? 'ring-1 ring-inset ring-slate-300 dark:ring-zinc-700' : ''}`}
                        >
                          {date.getDate()}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
