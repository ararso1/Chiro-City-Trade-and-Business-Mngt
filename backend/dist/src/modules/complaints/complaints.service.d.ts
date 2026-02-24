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
        status: string;
        traderId: string | null;
        category: string | null;
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
                email: string;
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
            status: string;
            traderId: string | null;
            category: string | null;
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
        status: string;
        traderId: string | null;
        category: string | null;
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
        status: string;
        traderId: string | null;
        category: string | null;
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
