import { ReportsService } from './reports.service';
export declare class ReportsController {
    private reports;
    constructor(reports: ReportsService);
    getDashboardStats(): Promise<{
        totalTraders: number;
        activeLicenses: number;
        expiredLicenses: number;
        totalRevenue: number;
        totalViolations: number;
        openComplaints: number;
        fiscalYear: {
            label: string;
            calendarType: string;
        } | null;
    }>;
    getExportSummary(from?: string, to?: string): Promise<{
        period: {
            from: Date | undefined;
            to: Date | undefined;
        };
        tradersRegistered: number;
        businessesRegistered: number;
        totalPayments: number;
        totalRevenue: number;
    }>;
}
