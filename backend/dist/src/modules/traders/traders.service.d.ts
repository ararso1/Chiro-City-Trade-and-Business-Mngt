import { PrismaService } from '../../prisma/prisma.service';
import { CreateTraderDto, UpdateTraderDto } from './dto/trader.dto';
import { FiscalYearService } from '../fiscal-year/fiscal-year.service';
export declare class TradersService {
    private prisma;
    private fiscalYear;
    constructor(prisma: PrismaService, fiscalYear: FiscalYearService);
    create(dto: CreateTraderDto, createdById?: string): Promise<{
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
    findAll(params?: {
        search?: string;
        status?: string;
        skip?: number;
        take?: number;
    }): Promise<{
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
    bulkImport(rows: unknown[], createdById?: string): Promise<{
        created: number;
        failed: {
            index: number;
            error: string;
        }[];
        total: number;
    }>;
}
