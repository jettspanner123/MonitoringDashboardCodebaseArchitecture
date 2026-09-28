import type HealthType from './HealthType';

export default interface RunSummaryDTO {
    id: string;
    createdAt: string;
    health: HealthType;
    pageCheckCount: number;
}
