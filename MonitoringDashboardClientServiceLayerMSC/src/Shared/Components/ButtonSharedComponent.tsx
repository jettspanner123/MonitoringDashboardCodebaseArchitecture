import React from 'react';
import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';

export interface ButtonSharedComponentProps {
  // Omit entirely (use ariaLabel instead) for a true icon-only button - any
  // children, including visually-hidden text, still occupies a flex slot
  // and throws off icon centering via the button's own gap spacing.
  children?: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  disabled?: boolean;
  isLoading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  title?: string;
  ariaLabel?: string;
}

export default function ButtonSharedComponent({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  icon,
  rightIcon,
  fullWidth = false,
  disabled = false,
  isLoading = false,
  type = 'button',
  className = '',
  title,
  ariaLabel,
}: ButtonSharedComponentProps): React.JSX.Element {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-md cursor-pointer select-none transition-colors duration-200 focus:outline-none whitespace-nowrap';

  let sizeStyles = '';
  if (size === 'sm') {
    sizeStyles = 'px-3 py-1.5 text-xs h-8 gap-1.5';
  } else if (size === 'lg') {
    sizeStyles = 'px-5 py-2.5 text-sm h-11 gap-2.5';
  } else {
    sizeStyles = 'px-4 py-2 text-sm h-9 gap-2';
  }

  let variantStyles = '';
  if (variant === 'primary') {
    variantStyles = '!bg-[#0C2086] hover:!bg-[#081765] !text-white border-none shadow-sm font-semibold';
  } else if (variant === 'ghost') {
    variantStyles =
      'bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 hairline-border';
  } else if (variant === 'outline') {
    variantStyles =
      'bg-transparent text-slate-700 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800/60 hairline-border-strong';
  } else if (variant === 'danger') {
    variantStyles = 'bg-red-600 text-white hover:bg-red-700 shadow-sm';
  }

  const widthStyle = fullWidth ? 'w-full' : '';
  const isButtonDisabled = disabled || isLoading;
  const disabledStyle = isButtonDisabled ? 'opacity-70 cursor-not-allowed pointer-events-none' : '';

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={isButtonDisabled}
      title={title}
      aria-label={ariaLabel}
      whileHover={isButtonDisabled ? {} : { scale: 1.01 }}
      whileTap={isButtonDisabled ? {} : { scale: 0.98 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${widthStyle} ${disabledStyle} ${className}`}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-current" />
      ) : (
        icon && <span className="inline-flex items-center shrink-0">{icon}</span>
      )}
      {children !== undefined && children !== null && (
        <span className="inline-flex items-center whitespace-nowrap">{children}</span>
      )}
      {!isLoading && rightIcon && <span className="inline-flex items-center shrink-0">{rightIcon}</span>}
    </motion.button>
  );
}
