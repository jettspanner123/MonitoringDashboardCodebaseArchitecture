import ApplicationNetworkAPIConfiguration from '../Configurations/ApplicationNetworkAPIConfiguration';
import type { ApiResponseType, AvailableCategoriesType, DayCompletenessStateType, GeneratedReportType } from '../Types';

export interface GenerateReportParams {
  environment: string;
  startDate: string;
  endDate: string;
  selectedKeys: string[];
}

export default class ReportService {
  public static current = new ReportService();

  public async getDayCompleteness(
    environment: string,
    monthStart: string,
    monthEnd: string
  ): Promise<Record<string, DayCompletenessStateType>> {
    const params = new URLSearchParams({ environment, monthStart, monthEnd });
    const response = await fetch(`${ApplicationNetworkAPIConfiguration.BASE_URL}/api/v1/reports/day-completeness?${params}`);
    const body: ApiResponseType<Record<string, DayCompletenessStateType>> = await response.json();
    if (!body.success || !body.data) {
      throw new Error(body.message || 'Failed to load day completeness.');
    }
    return body.data;
  }

  public async getAvailableCategories(environment: string, startDate: string, endDate: string): Promise<AvailableCategoriesType> {
    const params = new URLSearchParams({ environment, startDate, endDate });
    const response = await fetch(`${ApplicationNetworkAPIConfiguration.BASE_URL}/api/v1/reports/available-categories?${params}`);
    const body: ApiResponseType<AvailableCategoriesType> = await response.json();
    if (!body.success || !body.data) {
      throw new Error(body.message || 'Failed to load available categories.');
    }
    return body.data;
  }

  public async generateReport(params: GenerateReportParams): Promise<string> {
    const response = await fetch(`${ApplicationNetworkAPIConfiguration.BASE_URL}/api/v1/reports/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const body: ApiResponseType<{ reportId: string }> = await response.json();
    if (!body.success || !body.data) {
      throw new Error(body.message || 'Failed to generate the report.');
    }
    return body.data.reportId;
  }

  public async getReportById(reportId: string): Promise<GeneratedReportType> {
    const response = await fetch(`${ApplicationNetworkAPIConfiguration.BASE_URL}/api/v1/reports/${reportId}`);
    const body: ApiResponseType<GeneratedReportType> = await response.json();
    if (!body.success || !body.data) {
      throw new Error(body.message || 'Failed to load the report.');
    }
    return body.data;
  }
}
