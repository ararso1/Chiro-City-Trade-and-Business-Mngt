import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

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

  /** Create in-app notifications for all traders (bulk). Optionally record intent to send SMS/email in metadata. */
  async bulkCreateForTraders(data: {
    type: string;
    title: string;
    body?: string;
    channels: { sms?: boolean; email?: boolean; inApp?: boolean };
    expiryDate?: string;
    amount?: number;
  }) {
    const traders = await this.prisma.trader.findMany({
      where: { status: { not: 'closed' } },
      select: { id: true, fullName: true, email: true, phone: true },
    });
    const metadata: Record<string, unknown> = {
      sendSms: data.channels.sms ?? false,
      sendEmail: data.channels.email ?? false,
    };
    if (data.expiryDate) metadata.expiryDate = data.expiryDate;
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
            amount: data.amount != null ? new Decimal(data.amount) : undefined,
            metadata: metadata as any,
          } as any,
        });
        created++;
      }
      // Stub: actual SMS/Email would be sent by integration (e.g. Twilio, SendGrid)
      if (data.channels.sms && trader.phone) {
        await this.prisma.notification.create({
          data: {
            traderId: trader.id,
            type: data.type,
            title: data.title,
            body: data.body ?? null,
            channel: 'sms',
            metadata: metadata as any,
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
    return { created, tradersCount: traders.length };
  }
}
