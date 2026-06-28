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
            year: number;
            paidAt: Date | null;
            period: string | null;
            businessId: string;
            taxTypeId: string | null;
            currency: string;
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
            type: string | null;
            address: string | null;
            tin: string | null;
            plateNumber: string | null;
            associationType: string | null;
            businessArea: string | null;
            category: string;
            status: string;
            mesobRef: string | null;
            startDate: Date | null;
            traderId: string;
            woreda: string | null;
            kebele: string | null;
            shopNo: string | null;
            tradeName: string | null;
            subCategory: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        status: string;
        year: number;
        paidAt: Date | null;
        period: string | null;
        businessId: string;
        taxTypeId: string | null;
        currency: string;
        reference: string | null;
        notes: string | null;
    }>;
}
