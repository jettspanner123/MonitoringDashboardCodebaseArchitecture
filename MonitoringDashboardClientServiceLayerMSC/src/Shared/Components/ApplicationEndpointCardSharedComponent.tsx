import React from 'react';
import { Zap, CheckCircle2, XCircle } from 'lucide-react';
import CardSharedComponent from './CardSharedComponent';
import PrimaryActionButtonSharedComponent from './PrimaryActionButtonSharedComponent';
import TanstackQueryClientService from '../../Services/TanstackQueryClientService';
import type { ApplicationEndpoint } from '../../Types';

export interface ApplicationEndpointCardSharedComponentProps {
  endpoint: ApplicationEndpoint;
}

function formatConfigSummary(config: unknown): string | null {
  if (!config || typeof config !== 'object') return null;
  const { method, path } = config as { method?: string; path?: string };
  if (!method || !path) return null;
  return `${method} ${path}`;
}

export default function ApplicationEndpointCardSharedComponent({
  endpoint,
}: ApplicationEndpointCardSharedComponentProps): React.JSX.Element {
  const hitMutation = TanstackQueryClientService.current.applicationMonitor.useHitEndpointMutation();
  const configSummary = formatConfigSummary(endpoint.config);
  const result = hitMutation.data;

  return (
    <CardSharedComponent className="!p-0 overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 pt-5">
        <div className="min-w-0">
          <div className="text-sm font-bold text-slate-900 dark:text-zinc-100 truncate">{endpoint.label}</div>
          {configSummary && (
            <div className="text-[11px] font-mono text-slate-400 dark:text-zinc-500 mt-0.5 truncate">
              {configSummary}
            </div>
          )}
        </div>
        <PrimaryActionButtonSharedComponent
          onClick={() => hitMutation.mutate(endpoint.id)}
          disabled={hitMutation.isPending}
          isLoading={hitMutation.isPending}
          icon={<Zap className="w-3.5 h-3.5 !text-white" />}
          className="!h-9 px-3.5 text-xs font-bold shrink-0"
        >
          Hit
        </PrimaryActionButtonSharedComponent>
      </div>

      <div className="mx-5 mt-4 border-t border-slate-300/70 dark:border-zinc-800/80" />

      <div className="px-5 py-4">
        {!result && !hitMutation.isError && (
          <p className="text-xs text-slate-400 dark:text-zinc-500">Click "Hit" to call this endpoint.</p>
        )}

        {hitMutation.isError && (
          <div className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400">
            <XCircle className="w-4 h-4 shrink-0" />
            {hitMutation.error instanceof Error ? hitMutation.error.message : 'Failed to hit the endpoint.'}
          </div>
        )}

        {result && (
          <div className="space-y-3">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                {result.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                )}
                <span className={result.success ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}>
                  {result.success ? 'Reached' : 'Failed'}
                </span>
              </div>
              {result.statusCode !== null && (
                <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">HTTP {result.statusCode}</span>
              )}
              <span className="text-xs font-mono text-slate-400 dark:text-zinc-500">{result.durationMs}ms</span>
            </div>

            {result.errorMessage && (
              <p className="text-xs text-rose-600 dark:text-rose-400">{result.errorMessage}</p>
            )}

            {result.responseBody !== null && result.responseBody !== undefined && (
              <pre className="text-[11px] font-mono text-slate-600 dark:text-zinc-300 bg-slate-50 dark:bg-zinc-900/60 rounded-lg p-3 max-h-64 overflow-auto whitespace-pre-wrap break-all">
                {typeof result.responseBody === 'string'
                  ? result.responseBody
                  : JSON.stringify(result.responseBody, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    </CardSharedComponent>
  );
}
