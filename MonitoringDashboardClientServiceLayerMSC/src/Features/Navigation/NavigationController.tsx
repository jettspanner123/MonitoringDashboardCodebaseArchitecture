import React from 'react';
import { Activity } from 'lucide-react';
import ThemeToggleSharedComponent from '../../Shared/Components/ThemeToggleSharedComponent';

export interface NavigationControllerProps {
  currentTheme: string;
  onToggleTheme: () => void;
  children: React.ReactNode;
}

export default function NavigationController({
  currentTheme,
  onToggleTheme,
  children,
}: NavigationControllerProps): React.JSX.Element {
  return (
    <div className="min-h-screen bg-(--color-canvas) text-(--color-ink)">
      <header className="h-16 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#0C2086] dark:text-blue-400" />
          <span className="font-serif-headline font-semibold text-lg">Monitoring Dashboard</span>
        </div>
        <ThemeToggleSharedComponent currentTheme={currentTheme} onToggle={onToggleTheme} />
      </header>
      <main className="max-w-7xl mx-auto p-6">{children}</main>
    </div>
  );
}
