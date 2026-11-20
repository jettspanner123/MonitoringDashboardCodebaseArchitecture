import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CalendarRange, ChevronLeft, ChevronRight } from 'lucide-react';
import ApplicationHapticsUtility from '../../Utilities/ApplicationHapticsUtility';

export interface DateRangeType {
  start: string;
  end: string;
}

export interface DateRangePickerSharedComponentProps {
  label?: string;
  // ISO date keys ('YYYY-MM-DD'), inclusive on both ends - same local-calendar
  // key convention DatePickerSharedComponent already uses.
  value: DateRangeType | null;
  onChange: (range: DateRangeType) => void;
  // Called whenever the visible month changes (open, or month nav), so a
  // caller can fetch per-day coloring data for whatever's now in view.
  onVisibleMonthChange?: (monthStart: string, monthEnd: string) => void;
  // Optional extra class per day (e.g. completeness coloring) - this
  // component has no idea what a day's state means, only how to render it.
  dayClassName?: (dateKey: string) => string;
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

function formatRangeLabel(range: DateRangeType | null): string | null {
  if (!range) return null;
  if (range.start === range.end) return displayFormatter.format(fromDateKey(range.start));
  return `${displayFormatter.format(fromDateKey(range.start))} – ${displayFormatter.format(fromDateKey(range.end))}`;
}

// Sibling to DatePickerSharedComponent (same visual language - weekday
// header, month nav, WAI-ARIA grid) rather than a retrofit of it, since
// range selection and per-day custom coloring are a genuinely different
// prop contract from that component's many existing single-date callers.
export default function DateRangePickerSharedComponent({
  label,
  value,
  onChange,
  onVisibleMonthChange,
  dayClassName,
  placeholder = 'Select date range...',
  size = 'md',
  className = 'w-full',
}: DateRangePickerSharedComponentProps): React.JSX.Element {
  const today = new Date();
  const [isOpen, setIsOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => (value ? fromDateKey(value.start) : today));
  // Tracks an in-progress selection (first click made, second not yet) -
  // null once a range is either fully picked or not yet started.
  const [pendingStart, setPendingStart] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setVisibleMonth(value ? fromDateKey(value.start) : today);
    setPendingStart(null);

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
    if (!onVisibleMonthChange) return;
    const weeks = getCalendarWeeks(visibleMonth);
    onVisibleMonthChange(toDateKey(weeks[0][0]), toDateKey(weeks[weeks.length - 1][6]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleMonth]);

  const handleDayClick = (dateKey: string): void => {
    ApplicationHapticsUtility.current.triggerHapticFeedback(12);

    if (!pendingStart) {
      setPendingStart(dateKey);
      return;
    }

    const [start, end] = pendingStart <= dateKey ? [pendingStart, dateKey] : [dateKey, pendingStart];
    setPendingStart(null);
    onChange({ start, end });
    setIsOpen(false);
  };

  const heightClass = size === 'sm' ? 'h-11 sm:h-9 px-3.5 sm:px-2.5 text-sm sm:text-xs' : 'h-11 sm:h-10 px-3.5 sm:px-3 text-sm sm:text-xs';
  const weeks = getCalendarWeeks(visibleMonth);
  const todayKey = toDateKey(today);
  const monthYearId = React.useId();
  const rangeLabel = formatRangeLabel(value);

  // While mid-selection, highlight from the pending start through whatever
  // day is currently hovered/focused isn't tracked here - keeping this to
  // the simple "start and end both highlighted, nothing in between" is
  // enough for a modal picker and avoids a hover-tracking state nobody asked for.
  const isInRange = (dateKey: string): boolean => {
    if (pendingStart) return dateKey === pendingStart;
    if (!value) return false;
    return dateKey >= value.start && dateKey <= value.end;
  };
  const isRangeEndpoint = (dateKey: string): boolean => {
    if (pendingStart) return dateKey === pendingStart;
    return value !== null && (dateKey === value.start || dateKey === value.end);
  };

  return (
    <div className={`relative self-start ${className}`} ref={containerRef}>
      {label && <label className="text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1 block">{label}</label>}

      <button
        type="button"
        onPointerDown={() => ApplicationHapticsUtility.current.triggerHapticFeedback(12)}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={rangeLabel ? `Selected range: ${rangeLabel}` : 'Choose a date range'}
        className={`${className.includes('w-') ? 'w-full' : ''} ${heightClass} rounded-xl sm:rounded-lg bg-white dark:bg-[#0a0a0c] text-slate-900 dark:text-zinc-100 border border-slate-200/80 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 transition-colors focus:outline-none flex items-center justify-between gap-2 cursor-pointer select-none`}
      >
        <div className="flex items-center gap-2 truncate font-medium">
          <CalendarRange className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 shrink-0" />
          <span className="truncate font-semibold">{rangeLabel ?? placeholder}</span>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="dialog"
            aria-label="Choose date range"
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

            <p className="text-[11px] text-slate-400 dark:text-zinc-500 mb-2">
              {pendingStart ? 'Pick the end date…' : 'Pick a start date (click the same day twice for a single day).'}
            </p>

            <div role="grid" aria-labelledby={monthYearId}>
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
                    const isOutsideMonth = !isSameMonth(date, visibleMonth);
                    const isToday = dateKey === todayKey;
                    const inRange = isInRange(dateKey);
                    const isEndpoint = isRangeEndpoint(dateKey);
                    const extraClass = dayClassName?.(dateKey) ?? '';

                    return (
                      <div key={dateKey} role="gridcell" aria-selected={isEndpoint}>
                        <button
                          type="button"
                          onClick={() => handleDayClick(dateKey)}
                          aria-label={fullDateFormatter.format(date)}
                          className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-mono transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0C2086] ${
                            isEndpoint
                              ? 'bg-[#0C2086] text-white font-bold'
                              : inRange
                                ? 'bg-[#0C2086]/15 text-[#0C2086] dark:text-zinc-100 font-semibold'
                                : isOutsideMonth
                                  ? 'text-slate-300 dark:text-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800/80 cursor-pointer'
                                  : `text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/80 cursor-pointer ${extraClass}`
                          } ${isToday && !isEndpoint ? 'ring-1 ring-inset ring-slate-300 dark:ring-zinc-700' : ''}`}
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
