import type { HealthType } from './HealthType';
import type { PageCheckType } from './PageCheckType';

export interface RunSummary {
  id: string;
  createdAt: string;
  health: HealthType;
  pageCheckCount: number;
}

export interface RunDetail {
  id: string;
  createdAt: string;
  health: HealthType;
  pageChecks: PageCheckType[];
}

