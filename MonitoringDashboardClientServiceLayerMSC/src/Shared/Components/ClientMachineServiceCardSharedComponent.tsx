import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Settings2, Play, Square, RotateCw } from 'lucide-react';
import CardSharedComponent from './CardSharedComponent';
import ButtonSharedComponent from './ButtonSharedComponent';
import ShimmerOverlaySharedComponent from './ShimmerOverlaySharedComponent';
import ConfirmationModalSharedComponent from './ConfirmationModalSharedComponent';
import ClientMachineServiceActionProgressModalSharedComponent from './ClientMachineServiceActionProgressModalSharedComponent';
import ClientMachineServicesService from '../../Services/ClientMachineServicesService';
import ApplicationNetworkAPIConfiguration from '../../Configurations/ApplicationNetworkAPIConfiguration';
import type {
  ClientMachineServiceActionType,
  ClientMachineServiceStatus,
  ServiceActionAttemptEntry,
  ServiceActionSnapshot,
} from '../../Types';

export interface ClientMachineServiceCardSharedComponentProps {
  machineId: string;
  status: ClientMachineServiceStatus;
  // Called once an action's websocket reports finished:true, regardless of
  // success/failure - the parent refetches the service list rather than
  // this card trying to own/merge status state itself.
  onActionSettled: () => void;
}

class ClientMachineServiceCardHelper {
  public static getTone(status: ClientMachineServiceStatus): { gradient: string; iconBg: string } {
    if (status.stateCode === 4) return { gradient: 'from-emerald-600/7 via-slate-600/3', iconBg: 'bg-emerald-800' };
    if (status.stateCode === 1) return { gradient: 'from-rose-600/7 via-slate-600/3', iconBg: 'bg-rose-800' };
    return { gradient: 'from-slate-500/5 via-slate-500/2', iconBg: 'bg-slate-500 dark:bg-zinc-700' };
  }
}

class ClientMachineServiceActionCON {
  public static readonly AUTO_CLOSE_ON_SUCCESS_DELAY_MS = 1500;
}

export default function ClientMachineServiceCardSharedComponent({
  machineId,
  status,
  onActionSettled,
}: ClientMachineServiceCardSharedComponentProps): React.JSX.Element {
  const [isActionPending, setIsActionPending] = useState<boolean>(false);
  const [pendingConfirmAction, setPendingConfirmAction] = useState<'Stop' | 'Restart' | null>(null);
  const [liveAttempts, setLiveAttempts] = useState<ServiceActionAttemptEntry[]>([]);
  const [isRestartModalOpen, setIsRestartModalOpen] = useState<boolean>(false);
  const activeSocketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    return () => {
      activeSocketRef.current?.close();
    };
  }, []);

  const runAction = async (action: ClientMachineServiceActionType): Promise<void> => {
    setIsActionPending(true);
    setLiveAttempts([]);

    try {
      const actionAttemptId = await ClientMachineServicesService.current.startAction(machineId, status.serviceName, action);
      const socket = new WebSocket(
        `${ApplicationNetworkAPIConfiguration.WS_BASE_URL}/api/v1/client-machine-services/action-attempts/${actionAttemptId}/live`
      );
      activeSocketRef.current = socket;

      socket.onmessage = (event: MessageEvent<string>) => {
        const snapshot: ServiceActionSnapshot = JSON.parse(event.data);
        setLiveAttempts(snapshot.attempts);

        if (action === 'Restart' && snapshot.attempts.length > 0) {
          setIsRestartModalOpen(true);
        }

        if (snapshot.finished) {
          socket.close();
          setIsActionPending(false);
          onActionSettled();
          if (action === 'Restart' && snapshot.result?.success) {
            setTimeout(() => setIsRestartModalOpen(false), ClientMachineServiceActionCON.AUTO_CLOSE_ON_SUCCESS_DELAY_MS);
          }
          // On failure the restart modal stays open until manually closed.
        }
      };

      socket.onerror = () => {
        setIsActionPending(false);
      };
    } catch {
      setIsActionPending(false);
    }
  };

  const tone = ClientMachineServiceCardHelper.getTone(status);

  return (
    <motion.div layout transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
      <ShimmerOverlaySharedComponent isLoading={isActionPending} className="rounded-xl">
        <CardSharedComponent className={`!p-0 overflow-hidden bg-gradient-to-br ${tone.gradient} to-transparent dark:bg-[#0d0d10]`}>
          <div className="flex items-center justify-between gap-3 px-5 pt-5">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg ${tone.iconBg} text-white dark:bg-zinc-800/90 dark:text-zinc-200 flex items-center justify-center shadow-xs shrink-0`}
              >
                <Settings2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 font-mono truncate">
                  {status.serviceName}
                </div>
                <div className="text-[11px] text-slate-400 dark:text-zinc-500 -mt-0.5 leading-tight truncate">
                  {status.stateLabel ?? status.errorMessage ?? 'Unknown'}
                </div>
              </div>
            </div>
          </div>

          <div className="mx-5 mt-4 border-t border-slate-300/70 dark:border-zinc-800/80" />

          <div className="flex items-center gap-2 px-5 py-4">
            <ButtonSharedComponent
              variant="outline"
              size="sm"
              onClick={() => void runAction('Start')}
              disabled={isActionPending}
              icon={<Play className="w-3.5 h-3.5" />}
            >
              Start
            </ButtonSharedComponent>
            <ButtonSharedComponent
              variant="outline"
              size="sm"
              onClick={() => setPendingConfirmAction('Stop')}
              disabled={isActionPending}
              icon={<Square className="w-3.5 h-3.5" />}
            >
              Stop
            </ButtonSharedComponent>
            <ButtonSharedComponent
              variant="outline"
              size="sm"
              onClick={() => setPendingConfirmAction('Restart')}
              disabled={isActionPending}
              icon={<RotateCw className="w-3.5 h-3.5" />}
            >
              Restart
            </ButtonSharedComponent>
          </div>
        </CardSharedComponent>
      </ShimmerOverlaySharedComponent>

      <ConfirmationModalSharedComponent
        isOpen={pendingConfirmAction === 'Stop'}
        onClose={() => setPendingConfirmAction(null)}
        onConfirm={() => {
          setPendingConfirmAction(null);
          void runAction('Stop');
        }}
        title="Stop Service"
        subtitle={status.serviceName}
        description={`Are you sure you want to stop "${status.serviceName}"? Anything depending on it will be affected immediately.`}
        confirmText="Stop Service"
        variant="danger"
      />

      <ConfirmationModalSharedComponent
        isOpen={pendingConfirmAction === 'Restart'}
        onClose={() => setPendingConfirmAction(null)}
        onConfirm={() => {
          setPendingConfirmAction(null);
          void runAction('Restart');
        }}
        title="Restart Service"
        subtitle={status.serviceName}
        description={`Are you sure you want to restart "${status.serviceName}"? It will be briefly unavailable while it stops and starts back up.`}
        confirmText="Restart Service"
        variant="warning"
      />

      <ClientMachineServiceActionProgressModalSharedComponent
        isOpen={isRestartModalOpen}
        onClose={() => setIsRestartModalOpen(false)}
        attempts={liveAttempts}
      />
    </motion.div>
  );
}
