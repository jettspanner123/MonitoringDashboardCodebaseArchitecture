import type { StatusType } from './StatusType';

export type PageCheckKindType = 'AuthenticationPing' | 'AuthenticationLogin' | 'PageLoad' | 'IndexingFreshness' | 'QueueStatus';

export interface PageCheckType {
  id: string;
  pageName: string;
  checkType: PageCheckKindType;
  status: StatusType;
  message: string;
  details: Record<string, unknown> | null;
  createdAt: string;
}

