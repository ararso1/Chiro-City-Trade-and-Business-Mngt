import { BusinessesService } from './businesses.service';
import { CreateBusinessDto, UpdateBusinessDto } from './dto/business.dto';
export declare class BusinessesController {
    private businesses;
    constructor(businesses: BusinessesService);
    create(dto: CreateBusinessDto): Promise<({
        licenses: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            expiryDate: Date | null;
            traderId: string;
            businessId: string;
            licenseNo: string;
            licenseType: string | null;
            issueDate: Date | null;
            qrCode: string | null;
            issuedById: string | null;
            renewalReminderSent: boolean;
        }[];
        trader: {
            id: string;
            email: string | null;
            fullName: string;
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
    }) | null>;
    findAll(search?: string, status?: string, traderId?: string, skip?: string, take?: string): Promise<{
        items: ({
            licenses: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                status: string;
                expiryDate: Date | null;
                traderId: string;
                businessId: string;
                licenseNo: string;
                licenseType: string | null;
                issueDate: Date | null;
                qrCode: string | null;
                issuedById: string | null;
                renewalReminderSent: boolean;
            }[];
            trader: {
                id: string;
                email: string | null;
                fullName: string;
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
        })[];
        total: number;
    }>;
    findOne(id: string): Promise<({
        licenses: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            expiryDate: Date | null;
            traderId: string;
            businessId: string;
            licenseNo: string;
            licenseType: string | null;
            issueDate: Date | null;
            qrCode: string | null;
            issuedById: string | null;
            renewalReminderSent: boolean;
        }[];
        inspections: ({
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
        })[];
        documents: {
            id: string;
            name: string;
            type: string;
            businessId: string;
            filePath: string;
            mimeType: string | null;
            sizeBytes: number | null;
            uploadedAt: Date;
        }[];
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
        payments: ({
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
    }) | null>;
    update(id: string, dto: UpdateBusinessDto): Promise<({
        licenses: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            expiryDate: Date | null;
            traderId: string;
            businessId: string;
            licenseNo: string;
            licenseType: string | null;
            issueDate: Date | null;
            qrCode: string | null;
            issuedById: string | null;
            renewalReminderSent: boolean;
        }[];
        trader: {
            id: string;
            email: string | null;
            fullName: string;
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
    }) | null>;
    remove(id: string): Promise<{
        success: true;
        id: string;
    }>;
}
