import React from 'react';
import ThemeToggleSharedComponent from '../../Shared/Components/ThemeToggleSharedComponent';
import NavigationCON from './Constants/NavigationCON';
import weplmLogo from '../../Assets/weplm.jpeg';

export interface NavigationControllerProps {
  currentTheme: string;
  onToggleTheme: () => void;
  onNavigateHome: () => void;
  children: React.ReactNode;
}

export default function NavigationController({
  currentTheme,
  onToggleTheme,
  onNavigateHome,
  children,
}: NavigationControllerProps): React.JSX.Element {
  return (
    <div className="min-h-screen bg-(--color-canvas) text-(--color-ink)">
      <header className="sticky top-0 z-40 w-full bg-white dark:bg-black sm:bg-white/90 sm:dark:bg-black/90 sm:backdrop-blur-md border-b border-slate-200/80 dark:border-zinc-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3 select-none shrink-0">
            <img
              src={weplmLogo}
              alt="We.PLM Logo"
              onClick={onNavigateHome}
              className="w-10 h-10 sm:w-8 sm:h-8 rounded-lg sm:rounded-sm object-cover shrink-0 shadow-sm border border-slate-200/80 dark:border-zinc-800 cursor-pointer"
            />
            <div className="flex flex-col justify-center cursor-pointer" onClick={onNavigateHome}>
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-white font-serif-headline leading-tight">
                {NavigationCON.BRAND_TITLE}
              </h1>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-zinc-400 font-mono mt-0.5 leading-none">
                {NavigationCON.BRAND_SUBTITLE}
              </p>
            </div>
          </div>
          <ThemeToggleSharedComponent currentTheme={currentTheme} onToggle={onToggleTheme} />
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
}
