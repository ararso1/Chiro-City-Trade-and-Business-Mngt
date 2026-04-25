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
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const library_1 = require("@prisma/client/runtime/library");
const config_1 = require("@nestjs/config");
const axios_1 = require("axios");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
        this.logger = new common_1.Logger(NotificationsService_1.name);
    }
    normalizeMsisdn(phone) {
        const digits = phone.replace(/\D/g, '');
        if (digits.length === 12 && digits.startsWith('251'))
            return digits;
        if (digits.length === 10 && digits.startsWith('09'))
            return `251${digits.slice(1)}`;
        if (digits.length === 9 && digits.startsWith('9'))
            return `251${digits}`;
        return null;
    }
    buildSmsText(title, body) {
        const raw = [title, body].filter(Boolean).join(' - ').replace(/\s+/g, ' ').trim();
        return raw.length > 160 ? raw.slice(0, 160) : raw;
    }
    async sendSms(msisdn, text) {
        const apiKey = this.configService.get('SMS_ETHIOPIA_API_KEY');
        const baseUrl = this.configService.get('SMS_ETHIOPIA_BASE_URL') || 'https://smsethiopia.et/api';
        const timeoutMs = Number(this.configService.get('SMS_ETHIOPIA_TIMEOUT_MS') || '10000');
        if (!apiKey) {
            return { ok: false, error: 'SMS_ETHIOPIA_API_KEY is not configured' };
        }
        try {
            const response = await axios_1.default.post(`${baseUrl.replace(/\/$/, '')}/sms/send`, { msisdn, text }, {
                headers: {
                    KEY: apiKey,
                },
                timeout: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 10000,
            });
            const payload = response.data;
            const normalizedStatus = String(payload?.status ?? '').toLowerCase();
            const normalizedMessage = String(payload?.message ?? '').toLowerCase();
            const looksSuccessful = normalizedStatus === 'success' ||
                normalizedStatus === 'ok' ||
                normalizedMessage.includes('sms sent successfully') ||
                (response.status >= 200 && response.status < 300 && normalizedStatus !== 'failed');
            if (!looksSuccessful) {
                return {
                    ok: false,
                    response: payload,
                    error: payload?.message || `Provider returned non-success status (${payload?.status ?? 'unknown'})`,
                };
            }
            return { ok: true, response: payload };
        }
        catch (e) {
            const error = e;
            const providerMessage = error?.response?.data?.message;
            return { ok: false, error: providerMessage || error?.message || 'Unknown SMS provider error' };
        }
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
    async update(id, data) {
        const current = await this.prisma.notification.findUnique({ where: { id } });
        const currentMeta = current?.metadata ?? {};
        const nextMeta = { ...currentMeta };
        if (data.deadline !== undefined) {
            if (data.deadline)
                nextMeta.deadline = data.deadline;
            else
                delete nextMeta.deadline;
        }
        if (data.draft !== undefined) {
            nextMeta.draft = data.draft;
        }
        if (data.channels !== undefined) {
            const normalizedChannels = {
                inApp: data.channels.inApp ?? false,
                sms: data.channels.sms ?? false,
                email: data.channels.email ?? false,
            };
            nextMeta.channels = normalizedChannels;
            nextMeta.sendSms = normalizedChannels.sms;
            nextMeta.sendEmail = normalizedChannels.email;
            if (normalizedChannels.inApp || normalizedChannels.sms || normalizedChannels.email) {
                data.channel = normalizedChannels.sms ? 'sms' : normalizedChannels.email ? 'email' : 'in_app';
            }
        }
        return this.prisma.notification.update({
            where: { id },
            data: {
                type: data.type,
                title: data.title,
                body: data.body,
                channel: data.channel,
                sentAt: data.sentAt === undefined ? undefined : data.sentAt ? new Date(data.sentAt) : null,
                metadata: nextMeta,
            },
        });
    }
    async remove(id) {
        await this.prisma.notification.delete({ where: { id } });
        return { success: true, id };
    }
    async saveDraftForUser(userId, data) {
        const channels = {
            inApp: data.channels?.inApp ?? true,
            sms: data.channels?.sms ?? false,
            email: data.channels?.email ?? false,
        };
        const channelLabel = channels.sms ? 'sms' : channels.email ? 'email' : 'in_app';
        return this.prisma.notification.create({
            data: {
                userId,
                type: data.type,
                title: data.title,
                body: data.body ?? null,
                channel: channelLabel,
                metadata: {
                    draft: true,
                    broadcastDraft: true,
                    channels,
                    deadline: data.deadline ?? null,
                },
            },
        });
    }
    async publishDraft(id, userId) {
        const current = await this.prisma.notification.findUnique({ where: { id } });
        if (!current)
            return null;
        const currentMeta = current?.metadata ?? {};
        const channels = currentMeta.channels ?? { inApp: true };
        const isBroadcastDraft = Boolean(currentMeta.broadcastDraft);
        if (isBroadcastDraft) {
            await this.bulkCreateForTraders({
                type: current.type,
                title: current.title,
                body: current.body ?? undefined,
                channels: {
                    inApp: channels.inApp ?? true,
                    sms: channels.sms ?? false,
                    email: channels.email ?? false,
                },
                expiryDate: currentMeta.deadline || undefined,
                createdByUserId: userId ?? current.userId ?? undefined,
            });
        }
        return this.prisma.notification.update({
            where: { id },
            data: {
                sentAt: new Date(),
                metadata: {
                    ...currentMeta,
                    draft: false,
                    publishedAt: new Date().toISOString(),
                },
            },
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
            channels: {
                inApp: data.channels.inApp ?? true,
                sms: data.channels.sms ?? false,
                email: data.channels.email ?? false,
            },
        };
        if (data.expiryDate)
            metadata.expiryDate = data.expiryDate;
        const inApp = data.channels.inApp !== false;
        let created = 0;
        let smsSent = 0;
        let smsFailed = 0;
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
                const msisdn = this.normalizeMsisdn(trader.phone);
                const smsText = this.buildSmsText(data.title, data.body);
                const smsResult = msisdn
                    ? await this.sendSms(msisdn, smsText)
                    : { ok: false, error: 'Invalid phone format for Ethiopia SMS' };
                if (smsResult.ok)
                    smsSent++;
                else {
                    smsFailed++;
                    this.logger.warn(`SMS send failed for trader ${trader.id}: ${smsResult.error || 'Unknown error'}`);
                }
                await this.prisma.notification.create({
                    data: {
                        traderId: trader.id,
                        type: data.type,
                        title: data.title,
                        body: data.body ?? null,
                        channel: 'sms',
                        metadata: {
                            ...metadata,
                            smsProvider: 'sms_ethiopia',
                            msisdn,
                            smsStatus: smsResult.ok ? 'sent' : 'failed',
                            smsError: smsResult.ok ? undefined : smsResult.error,
                        },
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
        let summaryNotificationId = null;
        if (data.createdByUserId) {
            const summary = await this.prisma.notification.create({
                data: {
                    userId: data.createdByUserId,
                    type: data.type,
                    title: `General: ${data.title}`,
                    body: data.body ??
                        `Broadcast sent to ${traders.length} traders. SMS sent: ${smsSent}, failed: ${smsFailed}.`,
                    channel: 'in_app',
                    metadata: {
                        ...metadata,
                        broadcast: true,
                        tradersCount: traders.length,
                        smsSent,
                        smsFailed,
                    },
                },
            });
            summaryNotificationId = summary.id;
        }
        return { created, tradersCount: traders.length, smsSent, smsFailed, summaryNotificationId };
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map