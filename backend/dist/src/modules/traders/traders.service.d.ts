import { PrismaService } from '../../prisma/prisma.service';
import { CreateTraderDto, UpdateTraderDto } from './dto/trader.dto';
import { FiscalYearService } from '../fiscal-year/fiscal-year.service';
export declare class TradersService {
    private prisma;
    private fiscalYear;
    constructor(prisma: PrismaService, fiscalYear: FiscalYearService);
    create(dto: CreateTraderDto): Promise<{
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
            idType: string | null;
            idNumber: string | null;
            address: string | null;
            woreda: string | null;
            kebele: string | null;
            photoUrl: string | null;
            status: string;
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
                businessId: string;
                licenseType: string;
                licenseNumber: string;
                issuedAt: Date;
                expiresAt: Date;
                issuedBy: string | null;
                renewalReminderSent: boolean;
            }[];
            _count: {
                inspections: number;
                payments: number;
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
    } & {
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
    }) | null>;
    update(id: string, dto: UpdateTraderDto): Promise<{
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
    }>;
}
