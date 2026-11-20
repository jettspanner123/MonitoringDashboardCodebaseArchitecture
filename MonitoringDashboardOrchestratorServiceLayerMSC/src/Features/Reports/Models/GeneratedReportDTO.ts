import type { Environment } from '@prisma/client';
import type GeneratedReportContentDTO from './GeneratedReportContentDTO';

export default interface GeneratedReportDTO {
    id: string;
    environment: Environment;
    rangeStart: string;
    rangeEnd: string;
    selectedKeys: string[];
    content: GeneratedReportContentDTO;
    createdAt: string;
}
