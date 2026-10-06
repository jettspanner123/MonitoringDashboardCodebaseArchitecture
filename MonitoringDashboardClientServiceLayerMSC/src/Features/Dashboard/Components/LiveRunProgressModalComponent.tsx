import React, { useEffect, useRef, useState } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import ModalSharedComponent from '../../../Shared/Components/ModalSharedComponent';
import ApplicationNetworkAPIConfiguration from '../../../Configurations/ApplicationNetworkAPIConfiguration';

export interface LiveRunProgressModalComponentProps {
  isOpen: boolean;
  onClose: () => void;
  // Null only for the instant between "modal is opening" and "the trigger
  // response came back" - the effect below no-ops until this is set.
  testRunId: string | null;
}

interface CheckProgressEntry {
  name: string;
  status: 'running' | 'completed';
}

interface RunProgressSnapshot {
  running: string[];
  completed: string[];
  finished: boolean;
}

// Doesn't distinguish pass/fail here on purpose - this is just "is it done
// yet", the same way Playwright's own terminal output shows a check
// finishing. Full pass/fail detail is already on the dashboard once the run
// lands.
export default function LiveRunProgressModalComponent({
  isOpen,
  onClose,
  testRunId,
}: LiveRunProgressModalComponentProps): React.JSX.Element {
  const [checks, setChecks] = useState<CheckProgressEntry[]>([]);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  // Insertion order of check names as they're first seen - a snapshot's own
  // array order can shift between ticks, and re-sorting the list on every
  // poll would make rows jump around instead of just flipping their icon.
  const seenOrderRef = useRef<string[]>([]);

  useEffect(() => {
    if (!isOpen || !testRunId) return;

    setChecks([]);
    setIsFinished(false);
    seenOrderRef.current = [];

    const socket = new WebSocket(`${ApplicationNetworkAPIConfiguration.WS_BASE_URL}/api/v1/runs/${testRunId}/live`);

    socket.onmessage = (event: MessageEvent<string>) => {
      const snapshot: RunProgressSnapshot = JSON.parse(event.data);
      const completedSet = new Set(snapshot.completed);

      for (const name of [...snapshot.running, ...snapshot.completed]) {
        if (!seenOrderRef.current.includes(name)) {
          seenOrderRef.current.push(name);
        }
      }

      setChecks(
        seenOrderRef.current.map((name) => ({
          name,
          status: completedSet.has(name) ? 'completed' : 'running',
        }))
      );
      setIsFinished(snapshot.finished);
    };

    return () => {
      socket.close();
    };
  }, [isOpen, testRunId]);

  return (
    <ModalSharedComponent
      isOpen={isOpen}
      onClose={onClose}
      title="Smoke Test In Progress"
      subtitle={isFinished ? 'Run finished' : 'Running now…'}
      maxWidth="md"
    >
      <div className="space-y-1.5">
        {checks.length === 0 && (
          <p className="text-xs text-slate-400 dark:text-zinc-500">Waiting for the run to start…</p>
        )}
        {checks.map((check) => (
          <div
            key={check.name}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-900/40 text-xs font-mono"
          >
            {check.status === 'completed' ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <Loader2 className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 animate-spin shrink-0" />
            )}
            <span className="text-slate-700 dark:text-zinc-300">{check.name}</span>
          </div>
        ))}
      </div>
      {isFinished && checks.length > 0 && (
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-3 text-center">
          Run finished — close this and refresh to see the results.
        </p>
      )}
    </ModalSharedComponent>
  );
}
