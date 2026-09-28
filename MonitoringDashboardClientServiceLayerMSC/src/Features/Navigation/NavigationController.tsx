import React, { useState } from 'react';
import ProfileDropdownStaticComponent from './Components/static/ProfileDropdownStaticComponent';
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
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);

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
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsProfileOpen((prev) => !prev)}
              title={`${NavigationCON.PROFILE_DISPLAY_NAME} - Profile & Settings`}
              className="h-10 w-10 sm:h-9 sm:w-9 rounded-xl sm:rounded-lg bg-slate-100 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 hairline-border hover:bg-slate-200 dark:hover:bg-zinc-700/80 transition-colors cursor-pointer relative flex items-center justify-center select-none"
            >
              <div className="w-7 h-7 sm:w-6 sm:h-6 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 flex items-center justify-center font-bold text-xs sm:text-[10px] font-mono">
                {NavigationCON.PROFILE_INITIALS}
              </div>
            </button>
            <ProfileDropdownStaticComponent
              isOpen={isProfileOpen}
              onClose={() => setIsProfileOpen(false)}
              currentTheme={currentTheme}
              onToggleTheme={onToggleTheme}
            />
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
}
