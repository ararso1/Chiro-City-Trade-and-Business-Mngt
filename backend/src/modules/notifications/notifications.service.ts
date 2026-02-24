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
}
