import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
export declare class NotificationsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(data: {
        userId?: string;
        traderId?: string;
        type: string;
        title: string;
        body?: string;
        amount?: number;
        channel: string;
        metadata?: object;
    }): Promise<{
        id: string;
        userId: string | null;
        traderId: string | null;
        type: string;
        title: string;
        body: string | null;
        amount: Decimal | null;
        channel: string;
        sentAt: Date | null;
        readAt: Date | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
    }>;
    findAll(params?: {
        userId?: string;
        traderId?: string;
        type?: string;
        read?: boolean;
        skip?: number;
        take?: number;
    }): Promise<{
        items: {
            id: string;
            userId: string | null;
            traderId: string | null;
            type: string;
            title: string;
            body: string | null;
            amount: Decimal | null;
            channel: string;
            sentAt: Date | null;
            readAt: Date | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            createdAt: Date;
        }[];
        total: number;
    }>;
    markRead(id: string): Promise<{
        id: string;
        userId: string | null;
        traderId: string | null;
        type: string;
        title: string;
        body: string | null;
        amount: Decimal | null;
        channel: string;
        sentAt: Date | null;
        readAt: Date | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
    }>;
    bulkCreateForTraders(data: {
        type: string;
        title: string;
        body?: string;
        channels: {
            sms?: boolean;
            email?: boolean;
            inApp?: boolean;
        };
        expiryDate?: string;
        amount?: number;
    }): Promise<{
        created: number;
        tradersCount: number;
    }>;
}
