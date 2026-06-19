import { InspectionsService } from './inspections.service';
export declare class InspectionsController {
    private inspections;
    constructor(inspections: InspectionsService);
    create(body: {
        businessId: string;
        scheduledAt: string;
        status?: string;
    }, userId: string): Promise<{
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
    findAll(businessId?: string, status?: string, skip?: string, take?: string): Promise<{
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
                email: string | null;
                phone: string | null;
                userId: string | null;
                fullName: string;
                gender: string | null;
                nationalId: string | null;
                address: string | null;
                tin: string | null;
                typeOfJob: string | null;
                plateNumber: string | null;
                associationType: string | null;
                businessArea: string | null;
                category: string | null;
                licenseRegistrationType: string | null;
                licenseRegistrationDate: Date | null;
                status: string;
                createdById: string | null;
                approvedById: string | null;
                mesobRef: string | null;
                licenseExpiryDate: Date | null;
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
    updateResult(id: string, body: {
        conductedAt?: string;
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
    addViolation(id: string, body: {
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
