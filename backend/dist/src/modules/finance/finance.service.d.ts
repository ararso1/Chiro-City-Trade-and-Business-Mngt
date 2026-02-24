import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { FiscalYearService } from '../fiscal-year/fiscal-year.service';
export declare class FinanceService {
    private prisma;
    private fiscalYear;
    constructor(prisma: PrismaService, fiscalYear: FiscalYearService);
    getTaxTypes(): Promise<{
        id: string;
        code: string;
        name: string;
        createdAt: Date;
        description: string | null;
        updatedAt: Date;
        isActive: boolean;
        amount: Decimal;
        isPercent: boolean;
    }[]>;
    getPayments(params?: {
        businessId?: string;
        year?: number;
        status?: string;
        skip?: number;
        take?: number;
    }): Promise<{
        items: ({
            taxType: {
                id: string;
                code: string;
                name: string;
                createdAt: Date;
                description: string | null;
                updatedAt: Date;
                isActive: boolean;
                amount: Decimal;
                isPercent: boolean;
            } | null;
            business: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            amount: Decimal;
            status: string;
            paidAt: Date | null;
            businessId: string;
            year: number;
            taxTypeId: string | null;
            currency: string;
            period: string | null;
            reference: string | null;
            notes: string | null;
        })[];
        total: number;
    }>;
    recordPayment(data: {
        businessId: string;
        taxTypeId?: string;
        amount: number;
        year: number;
        period?: string;
        reference?: string;
        notes?: string;
    }): Promise<{
        taxType: {
            id: string;
            code: string;
            name: string;
            createdAt: Date;
            description: string | null;
            updatedAt: Date;
            isActive: boolean;
            amount: Decimal;
            isPercent: boolean;
        } | null;
        business: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            email: string | null;
            phone: string | null;
            address: string;
            woreda: string | null;
            kebele: string | null;
            status: string;
            mesobRef: string | null;
            traderId: string;
            tradeName: string | null;
            category: string;
            subCategory: string | null;
            tin: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        amount: Decimal;
        status: string;
        paidAt: Date | null;
        businessId: string;
        year: number;
        taxTypeId: string | null;
        currency: string;
        period: string | null;
        reference: string | null;
        notes: string | null;
    }>;
    getRevenueSummary(year?: number): Promise<{
        totalRevenue: number | Decimal;
        paymentCount: number;
        year: string | number;
    }>;
}
