import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLicenseDto, UpdateLicenseDto } from './dto/license.dto';

@Injectable()
export class LicensesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateLicenseDto) {
    return this.prisma.license.create({
      data: {
        ...dto,
        issuedAt: new Date(dto.issuedAt),
        expiresAt: new Date(dto.expiresAt),
      } as any,
    });
  }

  async findAll(params?: { businessId?: string; status?: string; skip?: number; take?: number }) {
    const where: any = {};
    if (params?.businessId) where.businessId = params.businessId;
    if (params?.status) where.status = params.status;
    const [items, total] = await Promise.all([
      this.prisma.license.findMany({
        where,
        skip: params?.skip ?? 0,
        take: Math.min(params?.take ?? 50, 100),
        include: { business: { select: { id: true, name: true, trader: { select: { fullName: true } } } } },
        orderBy: { expiresAt: 'asc' },
      }),
      this.prisma.license.count({ where }),
    ]);
    return { items, total };
  }

  async findOne(id: string) {
    return this.prisma.license.findUnique({
      where: { id },
      include: { business: { include: { trader: true } } },
    });
  }

  async update(id: string, dto: UpdateLicenseDto) {
    const data: any = { ...dto };
    if (dto.expiresAt) data.expiresAt = new Date(dto.expiresAt);
    return this.prisma.license.update({ where: { id }, data });
  }
}
