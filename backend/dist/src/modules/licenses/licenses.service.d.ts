import { PrismaService } from '../../prisma/prisma.service';
import { CreateLicenseDto, UpdateLicenseDto } from './dto/license.dto';
export declare class LicensesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateLicenseDto): Promise<{
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
                trader: {
                    fullName: string;
                };
            };
        } & {
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
                idType: string | null;
                idNumber: string | null;
                address: string | null;
                woreda: string | null;
                kebele: string | null;
                photoUrl: string | null;
                status: string;
                mesobRef: string | null;
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
        };
    } & {
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
    }) | null>;
    update(id: string, dto: UpdateLicenseDto): Promise<{
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
    }>;
}
