import { FiscalYearService } from './fiscal-year.service';
export declare class FiscalYearController {
    private fiscalYear;
    constructor(fiscalYear: FiscalYearService);
    getConfig(): Promise<{
        calendarType: "EC" | "GC";
        activeFiscalYearId: string | null;
    }>;
    getActiveRange(): Promise<import("./fiscal-year.service").FiscalDateRange | null>;
    setConfig(body: {
        calendarType?: 'EC' | 'GC';
        activeFiscalYearId?: string | null;
    }): Promise<{
        calendarType: "EC" | "GC";
        activeFiscalYearId: string | null;
    }>;
    list(calendarType?: 'EC' | 'GC'): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        calendarType: string;
        label: string;
        startDate: Date;
        endDate: Date;
    }[]>;
    create(body: {
        calendarType: 'EC' | 'GC';
        label: string;
        startDate: string;
        endDate: string;
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
    update(id: string, body: {
        label?: string;
        startDate?: string;
        endDate?: string;
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
    delete(id: string): Promise<{
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
