import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, X } from 'lucide-react';
import RunsService from '../../Services/RunsService';
import type { RunSummary } from '../../Types';

// Persisted (not just a React ref) so a page reload doesn't re-alarm for a
// run this browser has already seen - only a genuinely new run newer than
// the last one observed can ever trigger it, matching "no alarm on load".
const LAST_SEEN_RUN_ID_KEY = 'observacore_last_seen_run_id_for_alarm';
const POLL_INTERVAL_MS = 60000;

// Pulsing tone via the Web Audio API rather than an audio file asset -
// continuous, loud, and needs nothing to ship/host. Browsers only allow
// audio once the page has seen *some* user interaction this session (a
// click, a keypress, anything) - on a tab that's been sitting completely
// untouched, the very first alarm may be silent until that happens; nothing
// in-page can get around that autoplay restriction.
function startAlarmTone(): { stop: () => void } {
  const audioContext = new AudioContext();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  oscillator.type = 'square';
  oscillator.frequency.value = 880;
  gainNode.gain.value = 0;
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.start();

  let isOn = false;
  const pulse = setInterval(() => {
    isOn = !isOn;
    gainNode.gain.value = isOn ? 0.2 : 0;
  }, 350);

  return {
    stop: () => {
      clearInterval(pulse);
      oscillator.stop();
      void audioContext.close();
    },
  };
}

// Mounted once, near the app root, regardless of which screen/environment
// filter is currently showing - a Production failure shouldn't go silent
// just because someone has a different environment selected in the
// dashboard's own filter dropdown.
export default function RunFailureAlarmSharedComponent(): React.JSX.Element | null {
  const [alarmingRun, setAlarmingRun] = useState<RunSummary | null>(null);
  const alarmToneRef = useRef<{ stop: () => void } | null>(null);

  const { data: runs } = useQuery({
    queryKey: ['runs-failure-alarm-watch'],
    queryFn: () => RunsService.current.getRuns(),
    refetchInterval: POLL_INTERVAL_MS,
    staleTime: POLL_INTERVAL_MS,
  });

  useEffect(() => {
    if (!runs || runs.length === 0) return;
    const newestRun = runs[0];

    const lastSeenId = localStorage.getItem(LAST_SEEN_RUN_ID_KEY);
    const isGenuinelyNew = lastSeenId !== null && lastSeenId !== newestRun.id;
    const isUnhealthy = newestRun.health === 'Degraded' || newestRun.health === 'Failed';

    if (isGenuinelyNew && isUnhealthy) {
      setAlarmingRun(newestRun);
    }

    localStorage.setItem(LAST_SEEN_RUN_ID_KEY, newestRun.id);
  }, [runs]);

  useEffect(() => {
    if (alarmingRun) {
      alarmToneRef.current = startAlarmTone();
    }
    return () => {
      alarmToneRef.current?.stop();
      alarmToneRef.current = null;
    };
  }, [alarmingRun]);

  if (!alarmingRun) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[100] flex justify-center px-4 pt-4 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-3 rounded-xl shadow-2xl px-4 py-3 bg-rose-600 text-white border border-rose-700">
        <AlertTriangle className="w-5 h-5 shrink-0" />
        <div className="text-sm font-semibold">
          {alarmingRun.environment ?? 'A'} run came back {alarmingRun.health}
        </div>
        <button
          type="button"
          onClick={() => setAlarmingRun(null)}
          className="ml-2 p-1 rounded-lg hover:bg-rose-700/60 transition-colors cursor-pointer shrink-0"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
