import React from 'react';
import { Loader2 } from 'lucide-react';
import ModalSharedComponent from '../../../Shared/Components/ModalSharedComponent';

export interface ReportGenerationLoadingModalComponentProps {
  isOpen: boolean;
}

// Control-free by design (FR-007): no title/subtitle (so ModalSharedComponent
// renders no header, no close button) and onClose is a no-op, so a backdrop
// click or Escape cannot dismiss it while generation is in flight.
//
// shortcut: this spinner is a placeholder - swap it for the real loading
// animation asset once supplied (spec Assumptions).
export default function ReportGenerationLoadingModalComponent({
  isOpen,
}: ReportGenerationLoadingModalComponentProps): React.JSX.Element {
  return (
    <ModalSharedComponent isOpen={isOpen} onClose={() => {}} maxWidth="sm">
      <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
        <Loader2 className="w-10 h-10 text-[#0C2086] dark:text-zinc-100 animate-spin" />
        <div>
          <p className="font-semibold text-slate-900 dark:text-zinc-100">Generating report…</p>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">This won't take long.</p>
        </div>
      </div>
    </ModalSharedComponent>
  );
}
