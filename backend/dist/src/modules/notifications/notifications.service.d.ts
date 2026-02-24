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
        createdAt: Date;
        amount: Decimal | null;
        type: string;
        title: string;
        userId: string | null;
        traderId: string | null;
        body: string | null;
        channel: string;
        sentAt: Date | null;
        readAt: Date | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
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
            createdAt: Date;
            amount: Decimal | null;
            type: string;
            title: string;
            userId: string | null;
            traderId: string | null;
            body: string | null;
            channel: string;
            sentAt: Date | null;
            readAt: Date | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
        }[];
        total: number;
    }>;
    markRead(id: string): Promise<{
        id: string;
        createdAt: Date;
        amount: Decimal | null;
        type: string;
        title: string;
        userId: string | null;
        traderId: string | null;
        body: string | null;
        channel: string;
        sentAt: Date | null;
        readAt: Date | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
}
