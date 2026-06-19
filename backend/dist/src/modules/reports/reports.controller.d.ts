import { ReportsService } from './reports.service';
export declare class ReportsController {
    private reports;
    constructor(reports: ReportsService);
    getDashboardStats(): Promise<{
        totalTraders: number;
        activeTraders: number;
        submittedTraders: number;
        totalBusinesses: number;
        activeBusinesses: number;
        pendingBusinesses: number;
        totalLicenses: number;
        activeLicenses: number;
        expiredLicenses: number;
        pendingLicenses: number;
        renewalLicenses: number;
        licensesExpiringSoon: number;
        totalRevenue: number;
        totalViolations: number;
        openComplaints: number;
        scheduledInspections: number;
        completedInspections: number;
        pendingPayments: number;
        overduePayments: number;
        paidPayments: number;
        totalDocuments: number;
        traderDocuments: number;
        businessDocuments: number;
        recentTraders: {
            id: string;
            createdAt: Date;
            fullName: string;
            tin: string | null;
            status: string;
        }[];
        recentBusinesses: {
            id: string;
            name: string;
            createdAt: Date;
            trader: {
                fullName: string;
            };
            category: string;
            status: string;
        }[];
        generatedAt: Date;
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
