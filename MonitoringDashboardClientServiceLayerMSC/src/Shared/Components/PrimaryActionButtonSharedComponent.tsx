import React from 'react';
import { Plus } from 'lucide-react';
import ButtonSharedComponent from './ButtonSharedComponent';

export interface PrimaryActionButtonSharedComponentProps {
  label?: string;
  children?: React.ReactNode;
  onClick?: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  isLoading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: 'navy' | 'green';
}

export default function PrimaryActionButtonSharedComponent({
  label,
  children,
  onClick,
  icon = <Plus className="w-3.5 h-3.5 !text-white" />,
  disabled = false,
  isLoading = false,
  type = 'button',
  className = '',
  size = 'sm',
  color = 'navy',
}: PrimaryActionButtonSharedComponentProps): React.JSX.Element {
  const colorStyles = color === 'green' ? '!bg-emerald-600 hover:!bg-emerald-700' : '';

  return (
    <ButtonSharedComponent
      variant="primary"
      size={size}
      type={type}
      onClick={onClick}
      disabled={disabled}
      isLoading={isLoading}
      className={`${colorStyles} shrink-0 ${className}`}
      icon={icon}
    >
      <span className="!text-white font-medium">{children || label}</span>
    </ButtonSharedComponent>
  );
}
