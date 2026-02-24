import { PrismaService } from '../../prisma/prisma.service';
import { FiscalYearService } from '../fiscal-year/fiscal-year.service';
export declare class ReportsService {
    private prisma;
    private fiscalYear;
    constructor(prisma: PrismaService, fiscalYear: FiscalYearService);
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
    getExportSummary(params?: {
        from?: Date;
        to?: Date;
    }): Promise<{
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
