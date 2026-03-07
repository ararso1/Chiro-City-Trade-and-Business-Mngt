"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const library_1 = require("@prisma/client/runtime/library");
let NotificationsService = class NotificationsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        return this.prisma.notification.create({
            data: {
                ...data,
                amount: data.amount != null ? new library_1.Decimal(data.amount) : undefined,
            },
        });
    }
    async findAll(params) {
        const where = {};
        if (params?.userId)
            where.userId = params.userId;
        if (params?.traderId)
            where.traderId = params.traderId;
        if (params?.type)
            where.type = params.type;
        if (params?.read === true)
            where.readAt = { not: null };
        if (params?.read === false)
            where.readAt = null;
        const [items, total] = await Promise.all([
            this.prisma.notification.findMany({
                where,
                skip: params?.skip ?? 0,
                take: Math.min(params?.take ?? 50, 100),
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.notification.count({ where }),
        ]);
        return { items, total };
    }
    async markRead(id) {
        return this.prisma.notification.update({
            where: { id },
            data: { readAt: new Date() },
        });
    }
    async bulkCreateForTraders(data) {
        const traders = await this.prisma.trader.findMany({
            where: { status: { not: 'closed' } },
            select: { id: true, fullName: true, email: true, phone: true },
        });
        const metadata = {
            sendSms: data.channels.sms ?? false,
            sendEmail: data.channels.email ?? false,
        };
        if (data.expiryDate)
            metadata.expiryDate = data.expiryDate;
        const inApp = data.channels.inApp !== false;
        let created = 0;
        for (const trader of traders) {
            if (inApp) {
                await this.prisma.notification.create({
                    data: {
                        traderId: trader.id,
                        type: data.type,
                        title: data.title,
                        body: data.body ?? null,
                        channel: 'in_app',
                        amount: data.amount != null ? new library_1.Decimal(data.amount) : undefined,
                        metadata: metadata,
                    },
                });
                created++;
            }
            if (data.channels.sms && trader.phone) {
                await this.prisma.notification.create({
                    data: {
                        traderId: trader.id,
                        type: data.type,
                        title: data.title,
                        body: data.body ?? null,
                        channel: 'sms',
                        metadata: metadata,
                    },
                });
                created++;
            }
            if (data.channels.email && trader.email) {
                await this.prisma.notification.create({
                    data: {
                        traderId: trader.id,
                        type: data.type,
                        title: data.title,
                        body: data.body ?? null,
                        channel: 'email',
                        metadata: metadata,
                    },
                });
                created++;
            }
        }
        return { created, tradersCount: traders.length };
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map