import React from 'react';
import { Sun, Moon } from 'lucide-react';
import ApplicationThemeCON from '../../Constants/ApplicationThemeCON';
import ApplicationThemeUtility from '../../Utilities/ApplicationThemeUtility';

export interface ThemeModeSegmentedToggleSharedComponentProps {
  currentTheme: string;
  onToggle: () => void;
}

export default function ThemeModeSegmentedToggleSharedComponent({
  currentTheme,
  onToggle,
}: ThemeModeSegmentedToggleSharedComponentProps): React.JSX.Element {
  const isDark = currentTheme === ApplicationThemeCON.DARK;

  return (
    <div
      style={{ viewTransitionName: 'auth-theme-toggle' } as React.CSSProperties}
      className="w-full"
    >
      <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 h-11 sm:h-9 w-full">
        <button
          type="button"
          onClick={(e) => {
            if (isDark) {
              ApplicationThemeUtility.current.executeAnimatedThemeToggle(e.currentTarget, onToggle);
            }
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 h-full rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            !isDark
              ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 dark:text-zinc-400'
          }`}
        >
          <Sun className="w-4 h-4" />
          Light
        </button>
        <button
          type="button"
          onClick={(e) => {
            if (!isDark) {
              ApplicationThemeUtility.current.executeAnimatedThemeToggle(e.currentTarget, onToggle);
            }
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 h-full rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            isDark
              ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 dark:text-zinc-400'
          }`}
        >
          <Moon className="w-4 h-4" />
          Dark
        </button>
      </div>
    </div>
  );
}
