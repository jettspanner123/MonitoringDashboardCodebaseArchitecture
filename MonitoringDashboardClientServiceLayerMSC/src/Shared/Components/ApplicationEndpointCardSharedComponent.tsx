import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, FileJson } from 'lucide-react';
import CardSharedComponent from './CardSharedComponent';
import ButtonSharedComponent from './ButtonSharedComponent';
import ShimmerOverlaySharedComponent from './ShimmerOverlaySharedComponent';
import ApplicationEndpointResponseModalSharedComponent from './ApplicationEndpointResponseModalSharedComponent';
import TanstackQueryClientService from '../../Services/TanstackQueryClientService';
import type { ApplicationEndpoint, EndpointHitResult } from '../../Types';

export interface ApplicationEndpointCardSharedComponentProps {
  endpoint: ApplicationEndpoint;
}

function formatConfigSummary(config: unknown): string | null {
  if (!config || typeof config !== 'object') return null;
  const { method, path } = config as { method?: string; path?: string };
  if (!method || !path) return null;
  return `${method} ${path}`;
}

// Mirrors PageLoadCheckCardSharedComponent's own tone mapping exactly -
// neutral/slate before a result exists, then emerald/rose once one does.
function resultTone(result: EndpointHitResult | undefined): { gradient: string; iconBg: string } {
  if (!result) {
    return { gradient: 'from-slate-500/5 via-slate-500/2', iconBg: 'bg-slate-500 dark:bg-zinc-700' };
  }
  return result.success
    ? { gradient: 'from-emerald-600/7 via-slate-600/3', iconBg: 'bg-emerald-800' }
    : { gradient: 'from-rose-600/7 via-slate-600/3', iconBg: 'bg-rose-800' };
}

function formatDuration(durationMs: number): string {
  if (durationMs < 1000) return `${durationMs}ms`;
  return `${(durationMs / 1000).toFixed(1)}s`;
}

export default function ApplicationEndpointCardSharedComponent({
  endpoint,
}: ApplicationEndpointCardSharedComponentProps): React.JSX.Element {
  const hitMutation = TanstackQueryClientService.current.applicationMonitor.useHitEndpointMutation();
  const configSummary = formatConfigSummary(endpoint.config);
  // A fresh click always wins; otherwise fall back to the last recorded hit
  // (from the page's own initial load) so the card stays populated across
  // navigation and reloads instead of resetting to "never hit".
  const result = hitMutation.data ?? endpoint.lastHit ?? undefined;
  const [isResponseModalOpen, setIsResponseModalOpen] = useState<boolean>(false);
  const hasResponseBody = result ? result.responseBody !== null && result.responseBody !== undefined : false;
  const tone = resultTone(result);

  return (
    <motion.div layout transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
      <ShimmerOverlaySharedComponent isLoading={hitMutation.isPending} className="rounded-xl">
        <CardSharedComponent className={`!p-0 overflow-hidden bg-gradient-to-br ${tone.gradient} to-transparent dark:bg-[#0d0d10]`}>
          <div className="flex items-center justify-between gap-3 px-5 pt-5">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg ${tone.iconBg} text-white dark:bg-zinc-800/90 dark:text-zinc-200 flex items-center justify-center shadow-xs shrink-0`}
              >
                <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 font-mono truncate">
                  {endpoint.label}
                </div>
                <div className="text-[11px] text-slate-400 dark:text-zinc-500 -mt-0.5 leading-tight truncate">
                  {configSummary || 'Endpoint check'}
                </div>
              </div>
            </div>
            <ButtonSharedComponent
              variant="outline"
              size="sm"
              onClick={() => hitMutation.mutate(endpoint.id)}
              disabled={hitMutation.isPending}
              isLoading={hitMutation.isPending}
              className="shrink-0"
            >
              Hit
            </ButtonSharedComponent>
          </div>

          <div className="mx-5 mt-4 border-t border-slate-300/70 dark:border-zinc-800/80" />

          <div className="grid grid-cols-2 divide-x divide-slate-200 dark:divide-zinc-800">
            <div className="px-5 py-4 text-left">
              <div className="font-mono font-extrabold text-3xl text-slate-900 dark:text-zinc-50 leading-none tracking-tight">
                {result?.statusCode ?? '—'}
              </div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-zinc-500 mt-2.5">
                HTTP Status
              </div>
            </div>
            <div className="px-5 py-4 text-right">
              <div className="font-mono font-extrabold text-3xl text-slate-900 dark:text-zinc-50 leading-none tracking-tight">
                {result ? formatDuration(result.durationMs) : '—'}
              </div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-zinc-500 mt-2.5">
                Response Time
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={!result ? 'idle' : hasResponseBody ? 'view-response' : 'message'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="px-5 py-3.5 mt-3 border-t border-slate-100 dark:border-zinc-800/60 bg-slate-50/60 dark:bg-zinc-900/30"
            >
              {!result && (
                <p className="text-[11px] text-slate-400 dark:text-zinc-500">Click "Hit" to check this endpoint.</p>
              )}
              {result && hasResponseBody && (
                <ButtonSharedComponent
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsResponseModalOpen(true)}
                  icon={<FileJson className="w-3.5 h-3.5" />}
                  className="!h-auto !p-0 text-[11px]"
                >
                  View Response
                </ButtonSharedComponent>
              )}
              {result && !hasResponseBody && (
                <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                  {result.errorMessage || 'No additional details.'}
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </CardSharedComponent>
      </ShimmerOverlaySharedComponent>

      <ApplicationEndpointResponseModalSharedComponent
        isOpen={isResponseModalOpen}
        onClose={() => setIsResponseModalOpen(false)}
        label={endpoint.label}
        responseBody={result?.responseBody}
      />
    </motion.div>
  );
}
