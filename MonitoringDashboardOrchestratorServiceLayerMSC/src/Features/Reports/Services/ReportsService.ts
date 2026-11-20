import type { Environment } from '@prisma/client';
import ApplicationDatabaseProvider from '../../../Providers/ApplicationDatabaseProvider';
import RunsService, { RUN_WITH_CHECKS_INCLUDE, type RunWithChecks } from '../../Runs/Services/RunsService';
import type PageCheckDTO from '../../Runs/Models/PageCheckDTO';
import type DayCompletenessStateType from '../Models/DayCompletenessStateType';
import type ReportCategoryKeyType from '../Models/ReportCategoryKeyType';
import type AvailableCategoriesDTO from '../Models/AvailableCategoriesDTO';
import type GeneratedReportDTO from '../Models/GeneratedReportDTO';
import type GeneratedReportContentDTO from '../Models/GeneratedReportContentDTO';
import type {
    RangeReportContentDTO,
    ReportCategorySummaryDTO,
    ReportFailureEntryDTO,
    SingleDayReportContentDTO,
} from '../Models/GeneratedReportContentDTO';

function toDayKey(date: Date): string {
    return date.toISOString().slice(0, 10);
}

export default class ReportsService {
    public static current = new ReportsService();

    // Every environment's smoke-test suite always attempts all 6 of these
    // (SmokePageConfiguration's commonPages - 3DSpace search w/ Atlas
    // Widgets, XPDMGW/Platform GW Queue Status - plus Authentication, run
    // unconditionally regardless of environment; only the extra page-load
    // pages vary). A day missing any of them is a genuinely incomplete run,
    // not just "this environment doesn't have that check".
    private static readonly ALL_CATEGORIES: ReportCategoryKeyType[] = [
        'AuthenticationLogin',
        'AuthenticationPing',
        'PageLoad',
        'AtlasWidget',
        'IndexingFreshness',
        'QueueStatus',
    ];

    public async getDayCompleteness(
        environment: Environment,
        monthStart: Date,
        monthEnd: Date
    ): Promise<Record<string, DayCompletenessStateType>> {
        const runs = await ApplicationDatabaseProvider.current.client.testRun.findMany({
            where: { environment, createdAt: { gte: monthStart, lte: monthEnd } },
            include: RUN_WITH_CHECKS_INCLUDE,
        });

        const categoriesPresentByDay = this.groupCategoriesPresentByDay(runs);
        const result: Record<string, DayCompletenessStateType> = {};

        for (const cursor = new Date(monthStart); cursor <= monthEnd; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
            const dayKey = toDayKey(cursor);
            result[dayKey] = this.classifyDay(categoriesPresentByDay.get(dayKey));
        }

        return result;
    }

    public async getAvailableCategories(environment: Environment, startDate: Date, endDate: Date): Promise<AvailableCategoriesDTO> {
        const runs = await ApplicationDatabaseProvider.current.client.testRun.findMany({
            where: { environment, createdAt: { gte: startDate, lte: endDate } },
            include: RUN_WITH_CHECKS_INCLUDE,
        });

        const pageLoad = new Set<string>();
        const atlasWidget = new Set<string>();
        const queueStatus = new Set<string>();

        for (const run of runs) {
            for (const check of RunsService.current.mapRunToPageChecks(run)) {
                if (check.checkType === 'PageLoad') {
                    (check.pageName.startsWith('AtlasWidget') ? atlasWidget : pageLoad).add(check.pageName);
                } else if (check.checkType === 'QueueStatus') {
                    queueStatus.add(check.pageName);
                }
            }
        }

        return {
            pageLoad: Array.from(pageLoad).sort(),
            atlasWidget: Array.from(atlasWidget).sort(),
            queueStatus: Array.from(queueStatus).sort(),
        };
    }

    public async generateReport(params: {
        environment: Environment;
        startDate: Date;
        endDate: Date;
        selectedKeys: string[];
    }): Promise<string> {
        const { environment, startDate, endDate, selectedKeys } = params;

        const runs = await ApplicationDatabaseProvider.current.client.testRun.findMany({
            where: { environment, createdAt: { gte: startDate, lte: endDate } },
            include: RUN_WITH_CHECKS_INCLUDE,
        });

        const isSingleDay = toDayKey(startDate) === toDayKey(endDate);
        const content: GeneratedReportContentDTO = isSingleDay
            ? this.buildSingleDayContent(runs, startDate, selectedKeys)
            : this.buildRangeContent(runs, startDate, endDate, selectedKeys);

        const report = await ApplicationDatabaseProvider.current.client.generatedReport.create({
            data: {
                environment,
                rangeStart: startDate,
                rangeEnd: endDate,
                selectedKeys: JSON.stringify(selectedKeys),
                content: JSON.stringify(content),
            },
        });

        return report.id;
    }

    public async getReportById(reportId: string): Promise<GeneratedReportDTO | null> {
        const report = await ApplicationDatabaseProvider.current.client.generatedReport.findUnique({ where: { id: reportId } });
        if (!report) {
            return null;
        }

        return {
            id: report.id,
            environment: report.environment,
            rangeStart: report.rangeStart.toISOString(),
            rangeEnd: report.rangeEnd.toISOString(),
            selectedKeys: JSON.parse(report.selectedKeys),
            content: JSON.parse(report.content),
            createdAt: report.createdAt.toISOString(),
        };
    }

    // Shared by getDayCompleteness and buildRangeContent - both need "which
    // of the 6 categories had at least one recorded check, per calendar
    // day" from an already-fetched run list, just over different ranges.
    private groupCategoriesPresentByDay(runs: RunWithChecks[]): Map<string, Set<ReportCategoryKeyType>> {
        const categoriesPresentByDay = new Map<string, Set<ReportCategoryKeyType>>();

        for (const run of runs) {
            const dayKey = toDayKey(run.createdAt);
            const presentCategories = categoriesPresentByDay.get(dayKey) ?? new Set<ReportCategoryKeyType>();
            for (const check of RunsService.current.mapRunToPageChecks(run)) {
                presentCategories.add(this.toReportCategoryKey(check));
            }
            categoriesPresentByDay.set(dayKey, presentCategories);
        }

        return categoriesPresentByDay;
    }

    private classifyDay(presentCategories: Set<ReportCategoryKeyType> | undefined): DayCompletenessStateType {
        const presentCount = presentCategories?.size ?? 0;
        if (presentCount === 0) return 'empty';
        if (presentCount >= ReportsService.ALL_CATEGORIES.length) return 'complete';
        return 'partial';
    }

    // Splits PageLoad into PageLoad/AtlasWidget by the pageName prefix -
    // the exact discriminator DashboardScreenController already uses
    // client-side (specs/001-generate-report/research.md §3). Every other
    // checkType already matches a ReportCategoryKeyType value as-is.
    private toReportCategoryKey(check: PageCheckDTO): ReportCategoryKeyType {
        if (check.checkType === 'PageLoad' && check.pageName.startsWith('AtlasWidget')) {
            return 'AtlasWidget';
        }
        return check.checkType;
    }

    // The flat key scheme a selection resolves to - bare category for the
    // 3 categories with no sub-items, "<category>:<pageName>" for the 3
    // that have them (specs/001-generate-report/data-model.md).
    private toSelectionKey(check: PageCheckDTO): string {
        const categoryKey = this.toReportCategoryKey(check);
        if (categoryKey === 'PageLoad' || categoryKey === 'AtlasWidget' || categoryKey === 'QueueStatus') {
            return `${categoryKey}:${check.pageName}`;
        }
        return categoryKey;
    }

    private buildSingleDayContent(runs: RunWithChecks[], date: Date, selectedKeys: string[]): SingleDayReportContentDTO {
        const selectedSet = new Set(selectedKeys);
        const categories: SingleDayReportContentDTO['categories'] = {};

        for (const run of runs) {
            for (const check of RunsService.current.mapRunToPageChecks(run)) {
                if (!selectedSet.has(this.toSelectionKey(check))) continue;

                const categoryKey = this.toReportCategoryKey(check);
                const bucket = categories[categoryKey] ?? { checks: [] };
                bucket.checks.push(check);
                categories[categoryKey] = bucket;
            }
        }

        return { mode: 'single-day', date: toDayKey(date), categories };
    }

    private buildRangeContent(runs: RunWithChecks[], startDate: Date, endDate: Date, selectedKeys: string[]): RangeReportContentDTO {
        const selectedSet = new Set(selectedKeys);
        const categoriesPresentByDay = this.groupCategoriesPresentByDay(runs);
        const summaries = new Map<string, ReportCategorySummaryDTO>();
        const failures: ReportFailureEntryDTO[] = [];

        for (const run of runs) {
            const dayKey = toDayKey(run.createdAt);
            for (const check of RunsService.current.mapRunToPageChecks(run)) {
                const selectionKey = this.toSelectionKey(check);
                if (!selectedSet.has(selectionKey)) continue;

                const summary = summaries.get(selectionKey) ?? { total: 0, passed: 0, failed: 0, passRate: 0 };
                summary.total += 1;
                const isPass = check.status === 'Pass';
                if (isPass) {
                    summary.passed += 1;
                } else {
                    summary.failed += 1;
                    failures.push({ date: dayKey, category: this.toReportCategoryKey(check), pageName: check.pageName, message: check.message });
                }
                summary.passRate = Math.round((summary.passed / summary.total) * 1000) / 10;
                summaries.set(selectionKey, summary);
            }
        }

        const dayCompleteness: Record<string, DayCompletenessStateType> = {};
        for (const cursor = new Date(startDate); cursor <= endDate; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
            const dayKey = toDayKey(cursor);
            dayCompleteness[dayKey] = this.classifyDay(categoriesPresentByDay.get(dayKey));
        }

        return {
            mode: 'range',
            categories: Object.fromEntries(summaries),
            dayCompleteness,
            failures,
        };
    }
}
