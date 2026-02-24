import { FinanceService } from './finance.service';
export declare class FinanceController {
    private finance;
    constructor(finance: FinanceService);
    getTaxTypes(): Promise<{
        id: string;
        code: string;
        name: string;
        createdAt: Date;
        description: string | null;
        updatedAt: Date;
        isActive: boolean;
        amount: import("@prisma/client/runtime/library").Decimal;
        isPercent: boolean;
    }[]>;
    getPayments(businessId?: string, year?: string, status?: string, skip?: string, take?: string): Promise<{
        items: ({
            taxType: {
                id: string;
                code: string;
                name: string;
                createdAt: Date;
                description: string | null;
                updatedAt: Date;
                isActive: boolean;
                amount: import("@prisma/client/runtime/library").Decimal;
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
            amount: import("@prisma/client/runtime/library").Decimal;
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
    getRevenueSummary(year?: string): Promise<{
        totalRevenue: number | import("@prisma/client/runtime/library").Decimal;
        paymentCount: number;
        year: string | number;
    }>;
    recordPayment(body: {
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
            amount: import("@prisma/client/runtime/library").Decimal;
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
        amount: import("@prisma/client/runtime/library").Decimal;
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
}
