import { TradersService } from './traders.service';
import { BulkImportTradersDto, CreateTraderDto, UpdateTraderDto } from './dto/trader.dto';
export declare class TradersController {
    private traders;
    constructor(traders: TradersService);
    create(dto: CreateTraderDto, userId?: string): Promise<{
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
    }>;
    bulkImport(body: BulkImportTradersDto, userId?: string): Promise<{
        created: number;
        failed: {
            index: number;
            error: string;
        }[];
        total: number;
    }>;
    findAll(search?: string, status?: string, skip?: string, take?: string): Promise<{
        items: ({
            businesses: {
                id: string;
                name: string;
                status: string;
            }[];
        } & {
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
        })[];
        total: number;
    }>;
    findOne(id: string): Promise<({
        businesses: ({
            licenses: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                status: string;
                traderId: string;
                licenseNo: string;
                businessId: string;
                licenseType: string | null;
                issueDate: Date | null;
                expiryDate: Date | null;
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
        })[];
        documents: {
            id: string;
            name: string;
            type: string;
            traderId: string;
            filePath: string;
            mimeType: string | null;
            sizeBytes: number | null;
            uploadedAt: Date;
        }[];
        createdBy: {
            id: string;
            name: string;
            email: string;
        } | null;
        approvedBy: {
            id: string;
            name: string;
            email: string;
        } | null;
    } & {
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
    }) | null>;
    update(id: string, dto: UpdateTraderDto): Promise<{
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
    }>;
    remove(id: string): Promise<{
        success: true;
        id: string;
    }>;
}
