import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { ConfigService } from '@nestjs/config';
export declare class NotificationsService {
    private prisma;
    private configService;
    private readonly logger;
    constructor(prisma: PrismaService, configService: ConfigService);
    private normalizeMsisdn;
    private buildSmsText;
    private sendSms;
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
    update(id: string, data: {
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
    remove(id: string): Promise<{
        success: true;
        id: string;
    }>;
    saveDraftForUser(userId: string, data: {
        type: string;
        title: string;
        body?: string;
        channels?: {
            sms?: boolean;
            email?: boolean;
            inApp?: boolean;
        };
        deadline?: string;
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
    publishDraft(id: string, userId?: string): Promise<{
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
    } | null>;
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
        createdByUserId?: string;
    }): Promise<{
        created: number;
        tradersCount: number;
        smsSent: number;
        smsFailed: number;
        summaryNotificationId: string | null;
    }>;
}
