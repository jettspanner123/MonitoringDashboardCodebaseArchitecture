import React from 'react';
import { motion } from 'motion/react';
import ApplicationHapticsUtility from '../../Utilities/ApplicationHapticsUtility';

export interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface SegmentedControlSharedComponentProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedControlOption<T>[];
  layoutId: string;
  className?: string;
  fullWidthOnMobile?: boolean;
  // Unlike fullWidthOnMobile (which reacts to the page's viewport width via
  // Tailwind's sm: breakpoint), this fills whatever parent it's actually in,
  // at any viewport size - for small fixed-width containers (a dropdown
  // panel, a modal) where "mobile vs desktop" isn't the relevant axis.
  alwaysFullWidth?: boolean;
  hapticFeedback?: boolean;
  desktopOnly?: boolean;
  activeTextClassName?: string;
  inactiveTextClassName?: string;
}

export default function SegmentedControlSharedComponent<T extends string>({
  value,
  onChange,
  options,
  layoutId,
  className = '',
  fullWidthOnMobile = false,
  alwaysFullWidth = false,
  hapticFeedback = false,
  desktopOnly = false,
  activeTextClassName = 'text-slate-900 dark:text-white font-bold',
  inactiveTextClassName = 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white',
}: SegmentedControlSharedComponentProps<T>): React.JSX.Element {
  const displayClassName = desktopOnly ? 'hidden md:flex' : 'flex';

  const containerClassName = alwaysFullWidth
    ? `${displayClassName} items-center p-1 rounded-xl bg-slate-100 dark:bg-zinc-800/80 border border-slate-200/60 dark:border-zinc-700/60 h-11 sm:h-9 w-full`
    : fullWidthOnMobile
      ? `${displayClassName} items-center p-1 rounded-xl bg-slate-100 dark:bg-zinc-800/80 border border-slate-200/60 dark:border-zinc-700/60 h-11 sm:h-9 w-full sm:w-auto`
      : `${displayClassName} items-center p-1 rounded-xl bg-slate-100 dark:bg-zinc-800/80 border border-slate-200/60 dark:border-zinc-700/60 h-9 w-auto`;

  const buttonClassName = alwaysFullWidth
    ? 'flex-1 relative flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 h-9 sm:h-7 rounded-lg sm:rounded-md text-xs font-bold transition-colors select-none'
    : fullWidthOnMobile
      ? 'flex-1 sm:flex-initial relative flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 h-9 sm:h-7 rounded-lg sm:rounded-md text-xs font-bold transition-colors select-none'
      : 'relative flex items-center justify-center gap-1.5 px-3.5 py-1.5 h-7 rounded-md text-xs font-bold transition-colors select-none';

  return (
    <div className={`${containerClassName} ${className}`.trim()}>
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            disabled={option.disabled}
            onPointerDown={
              hapticFeedback && !option.disabled
                ? () => ApplicationHapticsUtility.current.triggerHapticFeedback(12)
                : undefined
            }
            onClick={option.disabled ? undefined : () => onChange(option.value)}
            title={option.label}
            className={`${buttonClassName} ${
              option.disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId={layoutId}
                className="absolute inset-0 bg-white dark:bg-zinc-700 rounded-lg sm:rounded-md shadow-xs"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span
              className={`relative z-10 flex items-center gap-1.5 ${
                isActive
                  ? activeTextClassName
                  : option.disabled
                    ? 'text-slate-400 dark:text-zinc-500'
                    : inactiveTextClassName
              }`}
            >
              {option.icon}
              <span>{option.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
