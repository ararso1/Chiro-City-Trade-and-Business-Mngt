import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBusinessDto, UpdateBusinessDto } from './dto/business.dto';
import { FiscalYearService } from '../fiscal-year/fiscal-year.service';

@Injectable()
export class BusinessesService {
  constructor(
    private prisma: PrismaService,
    private fiscalYear: FiscalYearService,
  ) {}

  async create(dto: CreateBusinessDto) {
    const data: any = { ...dto };
    if (dto.startDate) data.startDate = new Date(dto.startDate);
    // Registration creates the business in "pending" state automatically.
    data.status = 'pending';
    return this.prisma.business.create({ data });
  }

  async findAll(params?: { search?: string; status?: string; traderId?: string; skip?: number; take?: number }) {
    const where: any = {};
    if (params?.status) where.status = params.status;
    if (params?.traderId) where.traderId = params.traderId;
    if (params?.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { tradeName: { contains: params.search, mode: 'insensitive' } },
        { category: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    const dateFilter = await this.fiscalYear.getDateFilterFor('createdAt');
    if (dateFilter) where.createdAt = dateFilter;
    const [items, total] = await Promise.all([
      this.prisma.business.findMany({
        where,
        skip: params?.skip ?? 0,
        take: Math.min(params?.take ?? 50, 100),
        include: { trader: { select: { id: true, fullName: true, email: true } }, licenses: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.business.count({ where }),
    ]);
    return { items, total };
  }

  async findOne(id: string) {
    return this.prisma.business.findUnique({
      where: { id },
      include: {
        trader: true,
        licenses: true,
        inspections: { include: { inspector: { select: { name: true, email: true } }, violations: true } },
        payments: { include: { taxType: true } },
        documents: true,
      },
    });
  }

  async update(id: string, dto: UpdateBusinessDto) {
    const data: any = { ...dto };
    if (dto.startDate !== undefined) data.startDate = dto.startDate ? new Date(dto.startDate) : null;
    return this.prisma.business.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.prisma.business.delete({ where: { id } });
    return { success: true as const, id };
  }
}
