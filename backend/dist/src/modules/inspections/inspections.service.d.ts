import { PrismaService } from '../../prisma/prisma.service';
export declare class InspectionsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(data: {
        businessId: string;
        inspectorId: string;
        scheduledAt: Date;
        status?: string;
    }): Promise<{
        business: {
            name: string;
        };
        inspector: {
            name: string;
            email: string;
        };
    } & {
        id: string;
        createdAt: Date;
        result: string | null;
        updatedAt: Date;
        summary: string | null;
        status: string;
        conductedAt: Date | null;
        scheduledAt: Date;
        businessId: string;
        inspectorId: string;
    }>;
    findAll(params?: {
        businessId?: string;
        status?: string;
        skip?: number;
        take?: number;
    }): Promise<{
        items: ({
            business: {
                id: string;
                name: string;
                address: string | null;
            };
            violations: {
                id: string;
                code: string;
                createdAt: Date;
                description: string;
                updatedAt: Date;
                inspectionId: string;
                severity: string;
                resolvedAt: Date | null;
                resolution: string | null;
            }[];
            inspector: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            result: string | null;
            updatedAt: Date;
            summary: string | null;
            status: string;
            conductedAt: Date | null;
            scheduledAt: Date;
            businessId: string;
            inspectorId: string;
        })[];
        total: number;
    }>;
    findOne(id: string): Promise<({
        business: {
            trader: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                email: string;
                phone: string;
                userId: string | null;
                fullName: string;
                gender: string | null;
                dob: Date | null;
                nationalId: string | null;
                address: string | null;
                woreda: string | null;
                kebele: string | null;
                photoUrl: string | null;
                status: string;
                createdById: string | null;
                approvedById: string | null;
                mesobRef: string | null;
            };
        } & {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            email: string | null;
            phone: string | null;
            type: string | null;
            address: string | null;
            woreda: string | null;
            kebele: string | null;
            status: string;
            mesobRef: string | null;
            startDate: Date | null;
            traderId: string;
            category: string;
            shopNo: string | null;
            tradeName: string | null;
            subCategory: string | null;
            tin: string | null;
        };
        violations: {
            id: string;
            code: string;
            createdAt: Date;
            description: string;
            updatedAt: Date;
            inspectionId: string;
            severity: string;
            resolvedAt: Date | null;
            resolution: string | null;
        }[];
        inspector: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            roleId: string;
            email: string;
            passwordHash: string;
            phone: string | null;
            isActive: boolean;
            mesobUserId: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        result: string | null;
        updatedAt: Date;
        summary: string | null;
        status: string;
        conductedAt: Date | null;
        scheduledAt: Date;
        businessId: string;
        inspectorId: string;
    }) | null>;
    updateResult(id: string, data: {
        conductedAt?: Date;
        status?: string;
        result?: string;
        summary?: string;
    }): Promise<{
        violations: {
            id: string;
            code: string;
            createdAt: Date;
            description: string;
            updatedAt: Date;
            inspectionId: string;
            severity: string;
            resolvedAt: Date | null;
            resolution: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        result: string | null;
        updatedAt: Date;
        summary: string | null;
        status: string;
        conductedAt: Date | null;
        scheduledAt: Date;
        businessId: string;
        inspectorId: string;
    }>;
    addViolation(inspectionId: string, data: {
        code: string;
        description: string;
        severity: string;
    }): Promise<{
        id: string;
        code: string;
        createdAt: Date;
        description: string;
        updatedAt: Date;
        inspectionId: string;
        severity: string;
        resolvedAt: Date | null;
        resolution: string | null;
    }>;
}
