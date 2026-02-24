import { BusinessesService } from './businesses.service';
import { CreateBusinessDto, UpdateBusinessDto } from './dto/business.dto';
export declare class BusinessesController {
    private businesses;
    constructor(businesses: BusinessesService);
    create(dto: CreateBusinessDto): Promise<{
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
    }>;
    findAll(search?: string, status?: string, traderId?: string, skip?: string, take?: string): Promise<{
        items: ({
            licenses: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                status: string;
                businessId: string;
                licenseType: string;
                licenseNumber: string;
                issuedAt: Date;
                expiresAt: Date;
                issuedBy: string | null;
                renewalReminderSent: boolean;
            }[];
            trader: {
                id: string;
                email: string;
                fullName: string;
            };
        } & {
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
        })[];
        total: number;
    }>;
    findOne(id: string): Promise<({
        licenses: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            businessId: string;
            licenseType: string;
            licenseNumber: string;
            issuedAt: Date;
            expiresAt: Date;
            issuedBy: string | null;
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
            email: string;
            phone: string;
            userId: string | null;
            fullName: string;
            idType: string | null;
            idNumber: string | null;
            address: string | null;
            woreda: string | null;
            kebele: string | null;
            photoUrl: string | null;
            status: string;
            mesobRef: string | null;
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
            paidAt: Date | null;
            businessId: string;
            year: number;
            taxTypeId: string | null;
            currency: string;
            period: string | null;
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
    }) | null>;
    update(id: string, dto: UpdateBusinessDto): Promise<{
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
    }>;
}
