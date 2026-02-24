import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InspectionsService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    businessId: string;
    inspectorId: string;
    scheduledAt: Date;
    status?: string;
  }) {
    return this.prisma.inspection.create({
      data: { ...data, status: data.status ?? 'scheduled' } as any,
      include: { business: { select: { name: true } }, inspector: { select: { name: true, email: true } } },
    });
  }

  async findAll(params?: { businessId?: string; status?: string; skip?: number; take?: number }) {
    const where: any = {};
    if (params?.businessId) where.businessId = params.businessId;
    if (params?.status) where.status = params.status;
    const [items, total] = await Promise.all([
      this.prisma.inspection.findMany({
        where,
        skip: params?.skip ?? 0,
        take: Math.min(params?.take ?? 50, 100),
        include: {
          business: { select: { id: true, name: true, address: true } },
          inspector: { select: { id: true, name: true } },
          violations: true,
        },
        orderBy: { scheduledAt: 'desc' },
      }),
      this.prisma.inspection.count({ where }),
    ]);
    return { items, total };
  }

  async findOne(id: string) {
    return this.prisma.inspection.findUnique({
      where: { id },
      include: {
        business: { include: { trader: true } },
        inspector: true,
        violations: true,
      },
    });
  }

  async updateResult(
    id: string,
    data: { conductedAt?: Date; status?: string; result?: string; summary?: string },
  ) {
    return this.prisma.inspection.update({
      where: { id },
      data: data as any,
      include: { violations: true },
    });
  }

  async addViolation(inspectionId: string, data: { code: string; description: string; severity: string }) {
    return this.prisma.violation.create({ data: { inspectionId, ...data } as any });
  }
}
