import React from 'react';
import ModalSharedComponent from './ModalSharedComponent';

export interface ApplicationEndpointResponseModalSharedComponentProps {
  isOpen: boolean;
  onClose: () => void;
  label: string;
  responseBody: unknown;
}

export default function ApplicationEndpointResponseModalSharedComponent({
  isOpen,
  onClose,
  label,
  responseBody,
}: ApplicationEndpointResponseModalSharedComponentProps): React.JSX.Element {
  return (
    <ModalSharedComponent isOpen={isOpen} onClose={onClose} title={label} subtitle="Response" maxWidth="lg">
      <pre className="text-[11px] font-mono text-slate-700 dark:text-zinc-300 bg-slate-50 dark:bg-zinc-900/60 rounded-lg p-4 overflow-auto whitespace-pre-wrap break-all">
        {typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody, null, 2)}
      </pre>
    </ModalSharedComponent>
  );
}
