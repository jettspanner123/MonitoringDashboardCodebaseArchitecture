import React from 'react';

export interface CardSharedComponentProps {
  children: React.ReactNode;
  variant?: 'card' | 'elevated' | 'deep';
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export default function CardSharedComponent({
  children,
  variant = 'card',
  className = '',
  onClick,
  hoverable = false,
}: CardSharedComponentProps): React.JSX.Element {
  let surfaceStyle = '';
  if (variant === 'elevated') {
    surfaceStyle = 'bg-white dark:bg-[#121215] border border-slate-300 dark:border-zinc-700/80 shadow-md dark:shadow-xs';
  } else if (variant === 'deep') {
    surfaceStyle = 'bg-slate-50 dark:bg-[#08080a] border border-slate-300/80 dark:border-zinc-800 shadow-xs dark:shadow-none';
  } else {
    surfaceStyle = 'bg-white dark:bg-[#0d0d10] border border-slate-300/90 dark:border-zinc-800 shadow-sm dark:shadow-2xs';
  }

  const hoverClass = hoverable
    ? 'hover:border-slate-400 dark:hover:border-zinc-600 hover:shadow-lg dark:hover:shadow-md transition-all cursor-pointer'
    : '';

  return (
    <div
      onClick={onClick}
      className={`rounded-xl p-5 relative transition-all duration-200 ${surfaceStyle} ${hoverClass} ${className}`}
    >
      {children}
    </div>
  );
}
