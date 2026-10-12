import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { Globe, FileJson, Zap, Link2, ArrowUpFromLine, ArrowDownToLine } from 'lucide-react';
import CardSharedComponent from './CardSharedComponent';
import ButtonSharedComponent from './ButtonSharedComponent';
import ShimmerOverlaySharedComponent from './ShimmerOverlaySharedComponent';
import ApplicationEndpointResponseModalSharedComponent from './ApplicationEndpointResponseModalSharedComponent';
import ContextMenuSharedComponent, { type ContextMenuItem } from './ContextMenuSharedComponent';
import CopyConfirmationToastSharedComponent from './CopyConfirmationToastSharedComponent';
import EndpointWakeUpProgressModalSharedComponent from './EndpointWakeUpProgressModalSharedComponent';
import ApplicationMonitorService from '../../Services/ApplicationMonitorService';
import ApplicationNetworkAPIConfiguration from '../../Configurations/ApplicationNetworkAPIConfiguration';
import ClipboardUtility from '../../Utilities/ClipboardUtility';
import type { ApplicationEndpoint, EndpointHitResult, HitAttemptEntry, HitAttemptSnapshot } from '../../Types';

class ApplicationEndpointHitFlowCON {
  // Give a successful (server-was-already-awake) outcome a moment on screen
  // before the wake-up modal auto-closes, rather than instantly yanking it
  // away the same frame the card updates.
  public static readonly AUTO_CLOSE_ON_SUCCESS_DELAY_MS = 1500;
}

export interface ApplicationEndpointCardSharedComponentProps {
  endpoint: ApplicationEndpoint;
  baseUrl: string;
  enableContextMenu: boolean;
}

function formatConfigSummary(config: unknown): string | null {
  if (!config || typeof config !== 'object') return null;
  const { method, path } = config as { method?: string; path?: string };
  if (!method || !path) return null;
  return `${method} ${path}`;
}

class ApplicationEndpointCardHelper {
  public static getEndpointPath(config: unknown): string | null {
    if (!config || typeof config !== 'object') return null;
    const { path } = config as { path?: string };
    return path || null;
  }

  // Absent for today's GET-only health/ping checks - populated once
  // POST-style checks with an actual payload exist, mirroring the backend's
  // HttpEndpointConfigInterface.requestBody.
  public static getEndpointRequestBody(config: unknown): unknown {
    if (!config || typeof config !== 'object') return undefined;
    return (config as { requestBody?: unknown }).requestBody;
  }

  public static async copyToClipboardWithToast(text: string, successLabel: string): Promise<void> {
    const didSucceed = await ClipboardUtility.current.writeText(text);
    toast.custom(() => (
      <CopyConfirmationToastSharedComponent
        label={didSucceed ? successLabel : 'Copy failed - clipboard access denied'}
        isError={!didSucceed}
      />
    ));
  }
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
  baseUrl,
  enableContextMenu,
}: ApplicationEndpointCardSharedComponentProps): React.JSX.Element {
  const configSummary = formatConfigSummary(endpoint.config);
  const [isHitPending, setIsHitPending] = useState<boolean>(false);
  const [hitResult, setHitResult] = useState<EndpointHitResult | null>(null);
  const [liveAttempts, setLiveAttempts] = useState<HitAttemptEntry[]>([]);
  const [isWakeUpModalOpen, setIsWakeUpModalOpen] = useState<boolean>(false);
  const activeSocketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    return () => {
      activeSocketRef.current?.close();
    };
  }, []);

  const handleHit = async (): Promise<void> => {
    setIsHitPending(true);
    setLiveAttempts([]);

    try {
      const hitAttemptId = await ApplicationMonitorService.current.startHit(endpoint.id);
      const socket = new WebSocket(
        `${ApplicationNetworkAPIConfiguration.WS_BASE_URL}/api/v1/application-monitor/hit-attempts/${hitAttemptId}/live`
      );
      activeSocketRef.current = socket;

      socket.onmessage = (event: MessageEvent<string>) => {
        const snapshot: HitAttemptSnapshot = JSON.parse(event.data);
        setLiveAttempts(snapshot.attempts);

        // Only once the backend is actually detected as down (a retryable
        // 502/503/504) does the wake-up modal appear - a warm server that
        // resolves on its first attempt never shows it at all.
        if (snapshot.attempts.some((attempt) => attempt.outcome === 'retrying')) {
          setIsWakeUpModalOpen(true);
        }

        if (snapshot.finished) {
          socket.close();
          setIsHitPending(false);
          setHitResult(snapshot.result);
          if (snapshot.result?.success) {
            setTimeout(() => setIsWakeUpModalOpen(false), ApplicationEndpointHitFlowCON.AUTO_CLOSE_ON_SUCCESS_DELAY_MS);
          }
        }
      };

      socket.onerror = () => {
        setIsHitPending(false);
        setHitResult({
          success: false,
          statusCode: null,
          responseBody: null,
          durationMs: 0,
          errorMessage: 'Lost connection while watching the hit.',
        });
      };
    } catch (error) {
      setIsHitPending(false);
      setHitResult({
        success: false,
        statusCode: null,
        responseBody: null,
        durationMs: 0,
        errorMessage: error instanceof Error ? error.message : 'Failed to start the hit.',
      });
    }
  };

  // A fresh click always wins; otherwise fall back to the last recorded hit
  // (from the page's own initial load) so the card stays populated across
  // navigation and reloads instead of resetting to "never hit".
  const result = hitResult ?? endpoint.lastHit ?? undefined;
  const [isResponseModalOpen, setIsResponseModalOpen] = useState<boolean>(false);
  const hasResponseBody = result ? result.responseBody !== null && result.responseBody !== undefined : false;
  const tone = resultTone(result);

  const [contextMenu, setContextMenu] = useState<{ isOpen: boolean; x: number; y: number }>({
    isOpen: false,
    x: 0,
    y: 0,
  });

  const handleContextMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!enableContextMenu) return;
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({ isOpen: true, x: event.clientX, y: event.clientY });
  };

  const handleCloseContextMenu = () => {
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
  };

  // Same indigo as the card's own right-click ring, so the two dividers read
  // as part of the same "this card is targeted" highlight rather than their
  // own separate thing.
  const horizontalDividerClass = contextMenu.isOpen
    ? 'border-t-2 border-indigo-500/80 dark:border-indigo-400/80'
    : 'border-t border-slate-300/70 dark:border-zinc-800/80';
  const verticalDividerClass = contextMenu.isOpen
    ? 'border-l-2 border-indigo-500/80 dark:border-indigo-400/80'
    : 'border-l border-slate-200 dark:border-zinc-800';

  const endpointPath = ApplicationEndpointCardHelper.getEndpointPath(endpoint.config);
  const endpointUrl = endpointPath ? `${baseUrl}${endpointPath}` : null;
  const requestBody = ApplicationEndpointCardHelper.getEndpointRequestBody(endpoint.config);
  const hasRequestBody = requestBody !== undefined && requestBody !== null;

  const contextMenuItems: ContextMenuItem[] = [
    {
      id: 'hit',
      label: 'Hit',
      icon: <Zap className="w-3.5 h-3.5" />,
      disabled: isHitPending,
      onClick: () => void handleHit(),
    },
    {
      id: 'copy-url',
      label: 'Copy Endpoint URL',
      icon: <Link2 className="w-3.5 h-3.5" />,
      disabled: !endpointUrl,
      divider: true,
      onClick: () => {
        if (endpointUrl) void ApplicationEndpointCardHelper.copyToClipboardWithToast(endpointUrl, 'Endpoint URL copied');
      },
    },
    {
      id: 'copy-request',
      label: 'Copy Request JSON',
      icon: <ArrowUpFromLine className="w-3.5 h-3.5" />,
      disabled: !hasRequestBody,
      onClick: () => {
        if (hasRequestBody) {
          void ApplicationEndpointCardHelper.copyToClipboardWithToast(
            JSON.stringify(requestBody, null, 2),
            'Request JSON copied',
          );
        }
      },
    },
    {
      id: 'copy-response',
      label: 'Copy Response JSON',
      icon: <ArrowDownToLine className="w-3.5 h-3.5" />,
      disabled: !hasResponseBody,
      onClick: () => {
        if (hasResponseBody) {
          void ApplicationEndpointCardHelper.copyToClipboardWithToast(
            JSON.stringify(result?.responseBody, null, 2),
            'Response JSON copied',
          );
        }
      },
    },
  ];

  return (
    <motion.div layout transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
      <ShimmerOverlaySharedComponent isLoading={isHitPending} className="rounded-xl">
        <CardSharedComponent
          onContextMenu={handleContextMenu}
          className={`!p-0 overflow-hidden bg-gradient-to-br ${tone.gradient} to-transparent dark:bg-[#0d0d10] ${
            enableContextMenu ? 'cursor-pointer' : ''
          } ${contextMenu.isOpen ? 'ring-2 ring-indigo-500/80 dark:ring-indigo-400/80' : ''}`}
        >
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
              onClick={() => void handleHit()}
              disabled={isHitPending}
              isLoading={isHitPending}
              className="shrink-0"
            >
              Hit
            </ButtonSharedComponent>
          </div>

          <div className={`mx-5 mt-4 transition-colors duration-200 ${horizontalDividerClass}`} />

          <div className="grid grid-cols-2">
            <div className="px-5 py-4 text-left">
              <div className="font-mono font-extrabold text-3xl text-slate-900 dark:text-zinc-50 leading-none tracking-tight">
                {result?.statusCode ?? '—'}
              </div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-zinc-500 mt-2.5">
                HTTP Status
              </div>
            </div>
            <div className={`px-5 py-4 text-right transition-colors duration-200 ${verticalDividerClass}`}>
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
                  className="text-[11px]"
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

      <EndpointWakeUpProgressModalSharedComponent
        isOpen={isWakeUpModalOpen}
        onClose={() => setIsWakeUpModalOpen(false)}
        attempts={liveAttempts}
      />

      {enableContextMenu && (
        <ContextMenuSharedComponent
          isOpen={contextMenu.isOpen}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={handleCloseContextMenu}
          items={contextMenuItems}
          header={
            <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">
              {endpoint.label}
            </span>
          }
        />
      )}
    </motion.div>
  );
}
