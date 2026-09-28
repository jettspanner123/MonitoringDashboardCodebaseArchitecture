import React from 'react';

export interface RunDetailPageCheckDetailsStaticComponentProps {
  details: Record<string, unknown> | null;
}

export default function RunDetailPageCheckDetailsStaticComponent({
  details,
}: RunDetailPageCheckDetailsStaticComponentProps): React.JSX.Element | null {
  if (!details) return null;

  const entries = Object.entries(details);
  if (entries.length === 0) return null;

  // QueueStatus's `states` array gets its own small table instead of a raw dump.
  const states = details.states;
  const otherEntries = entries.filter(([key]) => key !== 'states');

  return (
    <div className="flex flex-col gap-1.5 font-mono text-[11px] text-slate-500 dark:text-zinc-400">
      {otherEntries.map(([key, value]) => (
        <div key={key} className="flex gap-1.5">
          <span className="text-slate-400 dark:text-zinc-500">{key}:</span>
          <span className="text-slate-700 dark:text-zinc-300">{String(value)}</span>
        </div>
      ))}

      {Array.isArray(states) && states.length > 0 && (
        <div className="overflow-x-auto mt-1">
          <table className="text-[11px]">
            <tbody>
              {states.map((state, index) => {
                const row = state as Record<string, unknown>;
                return (
                  <tr key={index} className="border-t border-slate-100 dark:border-zinc-800/60">
                    <td className="py-1 pr-3 text-slate-700 dark:text-zinc-300 font-medium">{String(row.state)}</td>
                    <td className="py-1 pr-3">{String(row.lessThan10Min)}</td>
                    <td className="py-1 pr-3">{String(row.lessThan1Hour)}</td>
                    <td className="py-1 pr-3">{String(row.lessThan4Hours)}</td>
                    <td className="py-1">{String(row.greaterThan4Hours)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
