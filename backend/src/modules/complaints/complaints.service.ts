import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ComplaintsService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    traderId?: string;
    submittedBy: string;
    contactPhone?: string;
    contactEmail?: string;
    subject: string;
    description: string;
    category?: string;
  }) {
    return this.prisma.complaint.create({
      data: { ...data, status: 'open' } as any,
      include: { trader: { select: { fullName: true } } },
    });
  }

  async findAll(params?: { status?: string; traderId?: string; skip?: number; take?: number }) {
    const where: any = {};
    if (params?.status) where.status = params.status;
    if (params?.traderId) where.traderId = params.traderId;
    const [items, total] = await Promise.all([
      this.prisma.complaint.findMany({
        where,
        skip: params?.skip ?? 0,
        take: Math.min(params?.take ?? 50, 100),
        include: { trader: { select: { fullName: true, email: true } }, assignedTo: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.complaint.count({ where }),
    ]);
    return { items, total };
  }

  async findOne(id: string) {
    return this.prisma.complaint.findUnique({
      where: { id },
      include: { trader: true, assignedTo: true },
    });
  }

  async update(
    id: string,
    data: {
      status?: string;
      assignedToId?: string;
      resolution?: string;
      resolvedAt?: Date;
      followUpNotes?: string;
    },
  ) {
    return this.prisma.complaint.update({
      where: { id },
      data: data as any,
      include: { assignedTo: true },
    });
  }
}
