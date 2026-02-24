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

  async create(dto: CreateTraderDto) {
    return this.prisma.trader.create({ data: dto as any });
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
        businesses: {
          include: {
            licenses: true,
            _count: { select: { inspections: true, payments: true } },
          },
        },
        documents: true,
      },
    });
  }

  async update(id: string, dto: UpdateTraderDto) {
    return this.prisma.trader.update({ where: { id }, data: dto as any });
  }
}
