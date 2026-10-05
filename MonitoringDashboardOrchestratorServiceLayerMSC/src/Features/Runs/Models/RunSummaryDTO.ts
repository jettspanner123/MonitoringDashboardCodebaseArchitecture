import type HealthType from './HealthType';

export default interface RunSummaryDTO {
    id: string;
    createdAt: string;
    environment: string | null;
    health: HealthType;
    pageCheckCount: number;
}
