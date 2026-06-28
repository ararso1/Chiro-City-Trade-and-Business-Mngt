import { TradersService } from './traders.service';
import { BulkImportAnnualTaxDto, BulkImportTradersDto, CreateTraderDto, UpdateTraderDto } from './dto/trader.dto';
export declare class TradersController {
    private traders;
    constructor(traders: TradersService);
    create(dto: CreateTraderDto, userId?: string): Promise<{
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
    }>;
    bulkImport(body: BulkImportTradersDto, userId?: string): Promise<{
        created: number;
        failed: {
            index: number;
            error: string;
        }[];
        total: number;
    }>;
    bulkImportAnnualTax(body: BulkImportAnnualTaxDto): Promise<{
        imported: number;
        updated: number;
        failed: {
            index: number;
            tin?: string;
            error: string;
        }[];
        total: number;
    }>;
    findAll(search?: string, status?: string, typeOfJob?: string, category?: string, address?: string, licenseState?: string, skip?: string, take?: string): Promise<{
        items: {
            licenseStatus: string;
            annualTaxAmount: number | null;
            annualTaxYear: number;
            businesses: {
                id: string;
                name: string;
                status: string;
            }[];
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
        }[];
        total: number;
    }>;
    filterOptions(): Promise<{
        typeOfJobs: string[];
        categories: string[];
        addresses: string[];
    }>;
    findOne(id: string): Promise<({
        businesses: ({
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
    }) | null>;
    update(id: string, dto: UpdateTraderDto): Promise<{
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
    }>;
    remove(id: string): Promise<{
        success: true;
        id: string;
    }>;
}
