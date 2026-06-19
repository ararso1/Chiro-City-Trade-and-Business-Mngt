import { PrismaService } from '../../prisma/prisma.service';
export declare class ComplaintsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(data: {
        traderId?: string;
        submittedBy: string;
        contactPhone?: string;
        contactEmail?: string;
        subject: string;
        description: string;
        category?: string;
    }): Promise<{
        trader: {
            fullName: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        description: string;
        updatedAt: Date;
        category: string | null;
        status: string;
        traderId: string | null;
        resolvedAt: Date | null;
        resolution: string | null;
        submittedBy: string;
        contactPhone: string | null;
        contactEmail: string | null;
        subject: string;
        followUpNotes: string | null;
        assignedToId: string | null;
    }>;
    findAll(params?: {
        status?: string;
        traderId?: string;
        skip?: number;
        take?: number;
    }): Promise<{
        items: ({
            trader: {
                email: string | null;
                fullName: string;
            } | null;
            assignedTo: {
                name: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            description: string;
            updatedAt: Date;
            category: string | null;
            status: string;
            traderId: string | null;
            resolvedAt: Date | null;
            resolution: string | null;
            submittedBy: string;
            contactPhone: string | null;
            contactEmail: string | null;
            subject: string;
            followUpNotes: string | null;
            assignedToId: string | null;
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
        } | null;
        assignedTo: {
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
        } | null;
    } & {
        id: string;
        createdAt: Date;
        description: string;
        updatedAt: Date;
        category: string | null;
        status: string;
        traderId: string | null;
        resolvedAt: Date | null;
        resolution: string | null;
        submittedBy: string;
        contactPhone: string | null;
        contactEmail: string | null;
        subject: string;
        followUpNotes: string | null;
        assignedToId: string | null;
    }) | null>;
    update(id: string, data: {
        status?: string;
        assignedToId?: string;
        resolution?: string;
        resolvedAt?: Date;
        followUpNotes?: string;
    }): Promise<{
        assignedTo: {
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
        } | null;
    } & {
        id: string;
        createdAt: Date;
        description: string;
        updatedAt: Date;
        category: string | null;
        status: string;
        traderId: string | null;
        resolvedAt: Date | null;
        resolution: string | null;
        submittedBy: string;
        contactPhone: string | null;
        contactEmail: string | null;
        subject: string;
        followUpNotes: string | null;
        assignedToId: string | null;
    }>;
}
