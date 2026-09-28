import React from 'react';
import ModalSharedComponent from './ModalSharedComponent';
import ButtonSharedComponent from './ButtonSharedComponent';

export type ConfirmationVariant = 'danger' | 'warning' | 'primary';

export interface ConfirmationModalSharedComponentProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  subtitle?: string;
  description: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmationVariant;
  isLoading?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  additionalContent?: React.ReactNode;
}

export default function ConfirmationModalSharedComponent({
  isOpen,
  onClose,
  onConfirm,
  title,
  subtitle,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
  maxWidth = 'md',
  additionalContent,
}: ConfirmationModalSharedComponentProps): React.JSX.Element {
  const [exitDirection, setExitDirection] = React.useState<'down' | 'up'>('down');
  const prevIsOpenRef = React.useRef(isOpen);

  React.useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      setExitDirection('down');
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen]);

  const handleCancel = () => {
    setExitDirection('down');
    onClose();
  };

  const handleConfirm = async () => {
    setExitDirection('down');
    await onConfirm();
  };

  const getConfirmButtonClasses = () => {
    if (variant === 'danger') {
      return '!bg-rose-600 hover:!bg-rose-700 active:!bg-rose-800 !text-white border-none shadow-sm font-semibold';
    }
    if (variant === 'warning') {
      return '!bg-amber-600 hover:!bg-amber-700 active:!bg-amber-800 !text-white border-none shadow-sm font-semibold';
    }
    return '!bg-[#0C2086] hover:!bg-[#081765] active:!bg-[#051047] !text-white border-none shadow-sm font-semibold';
  };

  return (
    <ModalSharedComponent
      isOpen={isOpen}
      onClose={onClose}
      exitDirection={exitDirection}
      title={title}
      subtitle={subtitle}
      maxWidth={maxWidth}
    >
      <div className="flex flex-col justify-between h-full text-xs">
        <div className="space-y-4 py-1">
          <div className="text-sm text-slate-600 dark:text-zinc-300 leading-relaxed font-normal">
            {description}
          </div>
          {additionalContent && <div>{additionalContent}</div>}
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-end gap-3 pt-4 mt-6 border-t border-slate-200 dark:border-zinc-800 shrink-0 pb-2 sm:pb-0">
          <ButtonSharedComponent
            variant="outline"
            size="md"
            onClick={handleCancel}
            disabled={isLoading}
            className="w-full sm:w-auto justify-center"
          >
            {cancelText}
          </ButtonSharedComponent>
          <ButtonSharedComponent
            type="button"
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="md"
            disabled={isLoading}
            onClick={handleConfirm}
            className={`w-full sm:w-auto justify-center ${getConfirmButtonClasses()}`}
            icon={
              isLoading ? (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
              ) : undefined
            }
          >
            <span className="!text-white font-bold">{confirmText}</span>
          </ButtonSharedComponent>
        </div>
      </div>
    </ModalSharedComponent>
  );
}
