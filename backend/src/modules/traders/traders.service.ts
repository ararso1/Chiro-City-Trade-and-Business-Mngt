import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTraderDto, UpdateTraderDto } from './dto/trader.dto';
import { FiscalYearService } from '../fiscal-year/fiscal-year.service';

@Injectable()
export class TradersService {
  constructor(
    private prisma: PrismaService,
    private fiscalYear: FiscalYearService,
  ) {}

  async create(dto: CreateTraderDto, createdById?: string) {
    const data: any = { ...dto };
    if (dto.dob) data.dob = new Date(dto.dob);
    if (createdById) data.createdById = createdById;
    // Registration creates the trader in "submitted" state automatically.
    data.status = 'submitted';
    return this.prisma.trader.create({ data });
  }

  async findAll(params?: { search?: string; status?: string; skip?: number; take?: number }) {
    const where: any = {};
    if (params?.status) where.status = params.status;
    if (params?.search) {
      where.OR = [
        { fullName: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
        { phone: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    const dateFilter = await this.fiscalYear.getDateFilterFor('createdAt');
    if (dateFilter) where.createdAt = dateFilter;
    const [items, total] = await Promise.all([
      this.prisma.trader.findMany({
        where,
        skip: params?.skip ?? 0,
        take: Math.min(params?.take ?? 50, 100),
        include: { businesses: { select: { id: true, name: true, status: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.trader.count({ where }),
    ]);
    return { items, total };
  }

  async findOne(id: string) {
    return this.prisma.trader.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true, email: true } },
        businesses: {
          include: {
            licenses: true,
            inspections: { include: { inspector: { select: { name: true } }, violations: true } },
            payments: { include: { taxType: true } },
          },
        },
        documents: true,
      },
    });
  }

  async update(id: string, dto: UpdateTraderDto) {
    const data: any = { ...dto };
    if (dto.dob !== undefined) data.dob = dto.dob ? new Date(dto.dob) : null;
    return this.prisma.trader.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.prisma.trader.delete({ where: { id } });
    return { success: true as const, id };
  }
}
