import React from 'react';
import ModalSharedComponent from './ModalSharedComponent';

export interface ApplicationEndpointResponseModalSharedComponentProps {
  isOpen: boolean;
  onClose: () => void;
  label: string;
  responseBody: unknown;
}

class ApplicationEndpointResponseModalCON {
  // Past either threshold a fixed "lg" modal either forces constant
  // horizontal scrolling (one very long line - a URL, token, base64 value)
  // or just feels cramped for a deep/verbose payload. Staying at "lg" below
  // both means a small ping response never gets an unnecessarily wide modal.
  public static readonly WIDE_TOTAL_LENGTH_THRESHOLD = 500;
  public static readonly WIDE_LINE_LENGTH_THRESHOLD = 80;
}

class ApplicationEndpointResponseModalHelper {
  public static formatResponseText(responseBody: unknown): string {
    return typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody, null, 2);
  }

  public static needsWideModal(responseText: string): boolean {
    if (responseText.length > ApplicationEndpointResponseModalCON.WIDE_TOTAL_LENGTH_THRESHOLD) return true;
    return responseText
      .split('\n')
      .some((line) => line.length > ApplicationEndpointResponseModalCON.WIDE_LINE_LENGTH_THRESHOLD);
  }
}

export default function ApplicationEndpointResponseModalSharedComponent({
  isOpen,
  onClose,
  label,
  responseBody,
}: ApplicationEndpointResponseModalSharedComponentProps): React.JSX.Element {
  const responseText = ApplicationEndpointResponseModalHelper.formatResponseText(responseBody);
  const isWide = ApplicationEndpointResponseModalHelper.needsWideModal(responseText);

  return (
    <ModalSharedComponent
      isOpen={isOpen}
      onClose={onClose}
      title={label}
      subtitle="Response"
      maxWidth={isWide ? '3xl' : 'lg'}
    >
      <pre className="text-[11px] font-mono text-slate-700 dark:text-zinc-300 bg-slate-50 dark:bg-zinc-900/60 rounded-lg p-4 overflow-auto whitespace-pre-wrap break-all">
        {responseText}
      </pre>
    </ModalSharedComponent>
  );
}
