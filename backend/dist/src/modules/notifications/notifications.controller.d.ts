import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private notifications;
    constructor(notifications: NotificationsService);
    findAll(traderId?: string, type?: string, read?: string, skip?: string, take?: string, userId?: string): Promise<{
        items: {
            id: string;
            userId: string | null;
            traderId: string | null;
            type: string;
            title: string;
            body: string | null;
            amount: import("@prisma/client/runtime/library").Decimal | null;
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
        amount: import("@prisma/client/runtime/library").Decimal | null;
        channel: string;
        sentAt: Date | null;
        readAt: Date | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
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
        userId: string | null;
        traderId: string | null;
        type: string;
        title: string;
        body: string | null;
        amount: import("@prisma/client/runtime/library").Decimal | null;
        channel: string;
        sentAt: Date | null;
        readAt: Date | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
    }>;
    bulkSend(body: {
        type: string;
        title: string;
        body?: string;
        channels?: {
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
