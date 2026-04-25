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
    }, userId?: string): Promise<{
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
    update(id: string, body: {
        type?: string;
        title?: string;
        body?: string | null;
        channel?: string;
        channels?: {
            sms?: boolean;
            email?: boolean;
            inApp?: boolean;
        };
        sentAt?: string | null;
        deadline?: string | null;
        draft?: boolean;
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
    saveDraft(body: {
        type: string;
        title: string;
        body?: string;
        channels?: {
            sms?: boolean;
            email?: boolean;
            inApp?: boolean;
        };
        deadline?: string;
    }, userId?: string): Promise<{
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
    publish(id: string, userId?: string): Promise<{
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
    } | null>;
    remove(id: string): Promise<{
        success: true;
        id: string;
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
    }, userId?: string): Promise<{
        created: number;
        tradersCount: number;
        smsSent: number;
        smsFailed: number;
        summaryNotificationId: string | null;
    }>;
}
