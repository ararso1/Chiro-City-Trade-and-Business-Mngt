import { LicensesService } from './licenses.service';
import { CreateLicenseDto, UpdateLicenseDto } from './dto/license.dto';
export declare class LicensesController {
    private licenses;
    constructor(licenses: LicensesService);
    create(dto: CreateLicenseDto): Promise<{
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
    }>;
    findAll(businessId?: string, traderId?: string, status?: string, skip?: string, take?: string): Promise<{
        items: ({
            trader: {
                id: string;
                email: string | null;
                fullName: string;
            };
            business: {
                id: string;
                name: string;
            };
            issuedBy: {
                id: string;
                name: string;
                email: string;
            } | null;
        } & {
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
        })[];
        total: number;
    }>;
    findOne(id: string): Promise<({
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
        issuedBy: {
            id: string;
            name: string;
            email: string;
        } | null;
    } & {
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
    }) | null>;
    update(id: string, dto: UpdateLicenseDto, userId?: string): Promise<{
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
    }>;
    remove(id: string): Promise<{
        success: true;
        id: string;
    }>;
}
