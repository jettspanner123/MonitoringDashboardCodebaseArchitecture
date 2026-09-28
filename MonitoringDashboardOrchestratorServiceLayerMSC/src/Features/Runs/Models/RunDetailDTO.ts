import type HealthType from './HealthType';
import type PageCheckDTO from './PageCheckDTO';

export default interface RunDetailDTO {
    id: string;
    createdAt: string;
    health: HealthType;
    pageChecks: PageCheckDTO[];
}
