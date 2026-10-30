export interface ClientMachineTokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface ClientMachine {
  id: string;
  hostname: string;
  nickname: string;
}

export interface ClientMachineServiceStatus {
  serviceName: string;
  stateCode: number | null;
  stateLabel: string | null;
  errorMessage: string | null;
}

export type ClientMachineServiceActionType = 'Start' | 'Stop' | 'Restart';

export type ServiceActionOutcome = 'running' | 'succeeded' | 'failed';
export type ServiceActionPhase = 'stopping' | 'starting' | 'checking';

export interface ServiceActionAttemptEntry {
  attemptNumber: number;
  phase: ServiceActionPhase;
  stateCode: number | null;
  stateLabel: string | null;
  attemptedAt: string;
  outcome: ServiceActionOutcome;
}

export interface ServiceActionResult {
  success: boolean;
  finalStateCode: number | null;
  finalStateLabel: string | null;
  errorMessage: string | null;
  durationMs: number;
}

export interface ServiceActionSnapshot {
  attempts: ServiceActionAttemptEntry[];
  finished: boolean;
  result: ServiceActionResult | null;
}
