import { PrismaService } from '../../prisma/prisma.service';
export interface FiscalDateRange {
    startDate: Date;
    endDate: Date;
    fiscalYearId: string;
    label: string;
    calendarType: string;
}
export declare class FiscalYearService {
    private prisma;
    constructor(prisma: PrismaService);
    getConfig(): Promise<{
        calendarType: 'EC' | 'GC';
        activeFiscalYearId: string | null;
    }>;
    getActiveDateRange(): Promise<FiscalDateRange | null>;
    getDateFilterFor(field?: 'createdAt' | 'paidAt' | 'conductedAt' | 'scheduledAt'): Promise<{
        gte: Date;
        lte: Date;
    } | undefined>;
    setConfig(calendarType: 'EC' | 'GC', activeFiscalYearId: string | null): Promise<{
        calendarType: "EC" | "GC";
        activeFiscalYearId: string | null;
    }>;
    listFiscalYears(calendarType?: 'EC' | 'GC'): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        calendarType: string;
        label: string;
        startDate: Date;
        endDate: Date;
    }[]>;
    createFiscalYear(data: {
        calendarType: 'EC' | 'GC';
        label: string;
        startDate: Date;
        endDate: Date;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        calendarType: string;
        label: string;
        startDate: Date;
        endDate: Date;
    }>;
    updateFiscalYear(id: string, data: {
        label?: string;
        startDate?: Date;
        endDate?: Date;
        isActive?: boolean;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        calendarType: string;
        label: string;
        startDate: Date;
        endDate: Date;
    }>;
    deleteFiscalYear(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        calendarType: string;
        label: string;
        startDate: Date;
        endDate: Date;
    }>;
}
