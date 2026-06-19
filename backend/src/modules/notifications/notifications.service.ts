import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  private normalizeMsisdn(phone: string): string | null {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('251')) return digits;
    if (digits.length === 10 && digits.startsWith('09')) return `251${digits.slice(1)}`;
    if (digits.length === 9 && digits.startsWith('9')) return `251${digits}`;
    return null;
  }

  private buildSmsText(title: string, body?: string): string {
    const raw = [title, body].filter(Boolean).join(' - ').replace(/\s+/g, ' ').trim();
    return raw.length > 160 ? raw.slice(0, 160) : raw;
  }

  private async sendSms(msisdn: string, text: string): Promise<{ ok: boolean; response?: unknown; error?: string }> {
    const apiKey = this.configService.get<string>('SMS_ETHIOPIA_API_KEY');
    const baseUrl = this.configService.get<string>('SMS_ETHIOPIA_BASE_URL') || 'https://smsethiopia.et/api';
    const timeoutMs = Number(this.configService.get<string>('SMS_ETHIOPIA_TIMEOUT_MS') || '10000');
    if (!apiKey) {
      return { ok: false, error: 'SMS_ETHIOPIA_API_KEY is not configured' };
    }

    try {
      const response = await axios.post(
        `${baseUrl.replace(/\/$/, '')}/sms/send`,
        { msisdn, text },
        {
          headers: {
            KEY: apiKey,
          },
          timeout: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 10000,
        },
      );
      const payload = response.data as any;
      const normalizedStatus = String(payload?.status ?? '').toLowerCase();
      const normalizedMessage = String(payload?.message ?? '').toLowerCase();
      const looksSuccessful =
        normalizedStatus === 'success' ||
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
    } catch (e) {
      const error = e as any;
      const providerMessage = error?.response?.data?.message;
      return { ok: false, error: providerMessage || error?.message || 'Unknown SMS provider error' };
    }
  }

  private buildTraderTargetWhere(filters?: {
    category?: string | string[];
    typeOfJob?: string | string[];
    address?: string | string[];
    traderStatus?: string | string[];
    licenseState?: string | string[];
  }) {
    const where: any = { status: { not: 'closed' } };
    if (!filters) return where;

    const values = (value?: string | string[]) =>
      (Array.isArray(value) ? value : String(value ?? '').split(','))
        .map((v) => v.trim())
        .filter(Boolean);
    const traderStatuses = values(filters.traderStatus);
    const categories = values(filters.category);
    const typeOfJobs = values(filters.typeOfJob);
    const addresses = values(filters.address);
    const licenseStates = values(filters.licenseState);

    if (traderStatuses.length) {
      where.status = { in: traderStatuses };
    }
    if (categories.length) {
      where.category = { in: categories };
    }
    if (typeOfJobs.length) {
      where.typeOfJob = { in: typeOfJobs };
    }
    if (addresses.length) {
      where.address = { in: addresses };
    }
    if (licenseStates.includes('paused')) {
      where.status = 'suspended';
    }
    if (licenseStates.includes('expired')) {
      where.licenseExpiryDate = { lt: new Date() };
    }
    if (licenseStates.includes('renewed_this_year')) {
      const startOfYear = new Date(new Date().getFullYear(), 0, 1);
      const startOfNextYear = new Date(new Date().getFullYear() + 1, 0, 1);
      where.licenseRegistrationType = 'renewal';
      where.licenseRegistrationDate = { gte: startOfYear, lt: startOfNextYear };
    }
    if (licenseStates.includes('unrenewed')) {
      const startOfYear = new Date(new Date().getFullYear(), 0, 1);
      where.OR = [
        { licenseRegistrationType: { not: 'renewal' } },
        { licenseRegistrationType: null },
        { licenseRegistrationDate: null },
        { licenseRegistrationDate: { lt: startOfYear } },
      ];
    }
    return where;
  }

  async create(data: {
    userId?: string;
    traderId?: string;
    type: string;
    title: string;
    body?: string;
    amount?: number;
    channel: string;
    metadata?: object;
  }) {
    return this.prisma.notification.create({
      data: {
        ...data,
        amount: data.amount != null ? new Decimal(data.amount) : undefined,
      } as any,
    });
  }

  async findAll(params?: { userId?: string; traderId?: string; type?: string; read?: boolean; skip?: number; take?: number }) {
    const where: any = {};
    if (params?.userId) where.userId = params.userId;
    if (params?.traderId) where.traderId = params.traderId;
    if (params?.type) where.type = params.type;
    if (params?.read === true) where.readAt = { not: null };
    if (params?.read === false) where.readAt = null;
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

  async markRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  async update(
    id: string,
    data: {
      type?: string;
      title?: string;
      body?: string | null;
      channel?: string;
      channels?: { sms?: boolean; email?: boolean; inApp?: boolean };
      sentAt?: string | null;
      deadline?: string | null;
      draft?: boolean;
    },
  ) {
    const current = await this.prisma.notification.findUnique({ where: { id } });
    const currentMeta = (current?.metadata as Record<string, unknown> | null) ?? {};
    const nextMeta: Record<string, unknown> = { ...currentMeta };
    if (data.deadline !== undefined) {
      if (data.deadline) nextMeta.deadline = data.deadline;
      else delete nextMeta.deadline;
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
        metadata: nextMeta as any,
      },
    });
  }

  async remove(id: string) {
    await this.prisma.notification.delete({ where: { id } });
    return { success: true as const, id };
  }

  async saveDraftForUser(
    userId: string,
    data: {
      type: string;
      title: string;
      body?: string;
      channels?: { sms?: boolean; email?: boolean; inApp?: boolean };
      deadline?: string;
      targetFilters?: { category?: string[]; typeOfJob?: string[]; address?: string[]; traderStatus?: string[]; licenseState?: string[] };
    },
  ) {
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
          targetFilters: data.targetFilters ?? {},
        } as any,
      } as any,
    });
  }

  async publishDraft(id: string, userId?: string) {
    const current = await this.prisma.notification.findUnique({ where: { id } });
    if (!current) return null;
    const currentMeta = (current?.metadata as Record<string, unknown> | null) ?? {};
    const channels = (currentMeta.channels as { sms?: boolean; email?: boolean; inApp?: boolean } | undefined) ?? { inApp: true };
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
        expiryDate: (currentMeta.deadline as string | undefined) || undefined,
        targetFilters: (currentMeta.targetFilters as any) ?? undefined,
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
        } as any,
      },
    });
  }

  /** Create in-app notifications for all traders (bulk). Optionally record intent to send SMS/email in metadata. */
  async bulkCreateForTraders(data: {
    type: string;
    title: string;
    body?: string;
    channels: { sms?: boolean; email?: boolean; inApp?: boolean };
    expiryDate?: string;
    amount?: number;
    targetFilters?: { category?: string[]; typeOfJob?: string[]; address?: string[]; traderStatus?: string[]; licenseState?: string[] };
    createdByUserId?: string;
  }) {
    const traders = await this.prisma.trader.findMany({
      where: this.buildTraderTargetWhere(data.targetFilters),
      select: { id: true, fullName: true, email: true, phone: true },
    });
    const metadata: Record<string, unknown> = {
      sendSms: data.channels.sms ?? false,
      sendEmail: data.channels.email ?? false,
      channels: {
        inApp: data.channels.inApp ?? true,
        sms: data.channels.sms ?? false,
        email: data.channels.email ?? false,
      },
      targetFilters: data.targetFilters ?? {},
    };
    if (data.expiryDate) metadata.expiryDate = data.expiryDate;
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
            amount: data.amount != null ? new Decimal(data.amount) : undefined,
            metadata: metadata as any,
          } as any,
        });
        created++;
      }
      if (data.channels.sms && trader.phone) {
        const msisdn = this.normalizeMsisdn(trader.phone);
        const smsText = this.buildSmsText(data.title, data.body);
        const smsResult = msisdn
          ? await this.sendSms(msisdn, smsText)
          : { ok: false as const, error: 'Invalid phone format for Ethiopia SMS' };
        if (smsResult.ok) smsSent++;
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
              ...(metadata as any),
              smsProvider: 'sms_ethiopia',
              msisdn,
              smsStatus: smsResult.ok ? 'sent' : 'failed',
              smsError: smsResult.ok ? undefined : smsResult.error,
            } as any,
          } as any,
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
            metadata: metadata as any,
          } as any,
        });
        created++;
      }
    }
    let summaryNotificationId: string | null = null;
    if (data.createdByUserId) {
      const summary = await this.prisma.notification.create({
        data: {
          userId: data.createdByUserId,
          type: data.type,
          title: `General: ${data.title}`,
          body:
            data.body ??
            `Broadcast sent to ${traders.length} traders. SMS sent: ${smsSent}, failed: ${smsFailed}.`,
          channel: 'in_app',
          metadata: {
            ...(metadata as any),
            broadcast: true,
            tradersCount: traders.length,
            smsSent,
            smsFailed,
          } as any,
        } as any,
      });
      summaryNotificationId = summary.id;
    }
    return { created, tradersCount: traders.length, smsSent, smsFailed, summaryNotificationId };
  }
}
