import React from 'react';
import { motion } from 'motion/react';
import { Sun, Moon } from 'lucide-react';
import ApplicationThemeCON from '../../Constants/ApplicationThemeCON';

export interface ThemeToggleSharedComponentProps {
  currentTheme: string;
  onToggle: () => void;
}

export default function ThemeToggleSharedComponent({
  currentTheme,
  onToggle,
}: ThemeToggleSharedComponentProps): React.JSX.Element {
  const isDark = currentTheme === ApplicationThemeCON.DARK;

  return (
    <motion.button
      onClick={onToggle}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className="p-2 rounded-lg bg-slate-100 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 hairline-border hover:bg-slate-200 dark:hover:bg-zinc-700/80 transition-colors cursor-pointer"
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400" />
      ) : (
        <Moon className="w-4 h-4 text-slate-600" />
      )}
    </motion.button>
  );
}
