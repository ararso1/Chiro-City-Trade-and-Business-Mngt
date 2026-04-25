import { BadRequestException, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
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

  async bulkImport(rows: unknown[], createdById?: string) {
    if (!Array.isArray(rows)) {
      throw new BadRequestException('Body must include a traders array');
    }
    if (rows.length === 0) {
      throw new BadRequestException('At least one trader row is required');
    }
    if (rows.length > 500) {
      throw new BadRequestException('Maximum 500 traders per import');
    }
    const failed: { index: number; error: string }[] = [];
    let created = 0;
    for (let i = 0; i < rows.length; i++) {
      const dto = plainToInstance(CreateTraderDto, rows[i]);
      const errors = validateSync(dto, { whitelist: true });
      if (errors.length) {
        const msg = errors
          .map((e) => (e.constraints ? Object.values(e.constraints).join(', ') : e.property))
          .join('; ');
        failed.push({ index: i, error: msg || 'Validation failed' });
        continue;
      }
      try {
        await this.create(dto, createdById);
        created++;
      } catch (e) {
        failed.push({ index: i, error: (e as Error).message || 'Create failed' });
      }
    }
    return { created, failed, total: rows.length };
  }
}
