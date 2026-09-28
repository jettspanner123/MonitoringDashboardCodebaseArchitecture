import React from 'react';

export interface BadgeSharedComponentProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  showDot?: boolean;
  className?: string;
}

export default function BadgeSharedComponent({
  children,
  variant = 'neutral',
  size = 'md',
  showDot = false,
  className = '',
}: BadgeSharedComponentProps): React.JSX.Element {
  const baseStyles = 'inline-flex items-center font-mono font-medium rounded-full';
  const sizeStyles = size === 'sm' ? 'text-[10px] px-2 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5';

  let variantStyles = '';
  let dotStyles = '';

  switch (variant) {
    case 'success':
      variantStyles = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
      dotStyles = 'bg-emerald-500';
      break;
    case 'warning':
      variantStyles = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
      dotStyles = 'bg-amber-500';
      break;
    case 'danger':
      variantStyles = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20';
      dotStyles = 'bg-rose-500';
      break;
    case 'info':
      variantStyles = 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20';
      dotStyles = 'bg-sky-500';
      break;
    case 'neutral':
    default:
      variantStyles = 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700';
      dotStyles = 'bg-slate-400 dark:bg-zinc-500';
      break;
  }

  return (
    <span className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}>
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${dotStyles} animate-pulse shrink-0`} />}
      {children}
    </span>
  );
}
