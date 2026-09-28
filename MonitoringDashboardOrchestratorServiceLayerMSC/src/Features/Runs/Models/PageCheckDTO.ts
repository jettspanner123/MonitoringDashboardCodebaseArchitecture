import type StatusType from './StatusType';

// The check-type each raw table row is translated from. Not part of
// CONTEXT.md's vocabulary directly, but needed since one Page can have
// several kinds of check (e.g. 3DSpace search has both a PageLoad and an
// IndexingFreshness check) and the frontend needs to tell them apart.
export type PageCheckKindType = 'AuthenticationPing' | 'AuthenticationLogin' | 'PageLoad' | 'IndexingFreshness' | 'QueueStatus';

export default interface PageCheckDTO {
    id: string;
    pageName: string;
    checkType: PageCheckKindType;
    status: StatusType;
    message: string;
    details: Record<string, unknown> | null;
    createdAt: string;
}
