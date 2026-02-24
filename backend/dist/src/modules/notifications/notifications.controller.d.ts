import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private notifications;
    constructor(notifications: NotificationsService);
    findAll(traderId?: string, type?: string, read?: string, skip?: string, take?: string, userId?: string): Promise<{
        items: {
            id: string;
            createdAt: Date;
            amount: import("@prisma/client/runtime/library").Decimal | null;
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
        amount: import("@prisma/client/runtime/library").Decimal | null;
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
    create(body: {
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
        amount: import("@prisma/client/runtime/library").Decimal | null;
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
