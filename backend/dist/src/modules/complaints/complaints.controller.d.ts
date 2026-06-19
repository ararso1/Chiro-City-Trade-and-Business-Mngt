import { ComplaintsService } from './complaints.service';
export declare class ComplaintsController {
    private complaints;
    constructor(complaints: ComplaintsService);
    create(body: {
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
    findAll(status?: string, traderId?: string, skip?: string, take?: string): Promise<{
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
    update(id: string, body: {
        status?: string;
        assignedToId?: string;
        resolution?: string;
        resolvedAt?: string;
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
