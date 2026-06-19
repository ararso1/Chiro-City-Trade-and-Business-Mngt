import { BadRequestException, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTraderDto, UpdateTraderDto } from './dto/trader.dto';
import { FiscalYearService } from '../fiscal-year/fiscal-year.service';

function addOneYear(date: Date) {
  const expiry = new Date(date);
  expiry.setFullYear(expiry.getFullYear() + 1);
  return expiry;
}

function applyLicenseRegistrationDates(data: any, defaultMissing = false) {
  if (defaultMissing && !data.licenseRegistrationType) {
    data.licenseRegistrationType = 'new_registration';
  }
  if (defaultMissing && !data.licenseRegistrationDate) {
    data.licenseRegistrationDate = new Date();
  }
  if (data.licenseRegistrationDate) {
    const registrationDate = new Date(data.licenseRegistrationDate);
    data.licenseRegistrationDate = registrationDate;
    data.licenseExpiryDate = addOneYear(registrationDate);
  }
}

function splitFilterValues(value?: string) {
  return (value ?? '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

function cleanFilterOptions(values: Array<string | null>) {
  return values.map((value) => value?.trim()).filter((value): value is string => Boolean(value));
}

@Injectable()
export class TradersService {
  constructor(
    private prisma: PrismaService,
    private fiscalYear: FiscalYearService,
  ) {}

  async create(dto: CreateTraderDto, createdById?: string) {
    const data: any = { ...dto };
    applyLicenseRegistrationDates(data, true);
    if (dto.phone) {
      const existingPhone = await this.prisma.trader.findFirst({ where: { phone: dto.phone } });
      if (existingPhone) throw new BadRequestException('Phone number already exists');
    }
    const existingTin = await this.prisma.trader.findFirst({ where: { tin: dto.tin } as any });
    if (existingTin) throw new BadRequestException('TIN already exists');
    if (createdById) data.createdById = createdById;
    // Registration creates the trader in "submitted" state automatically.
    data.status = 'submitted';
    return this.prisma.trader.create({ data });
  }

  async findAll(params?: {
    search?: string;
    status?: string;
    typeOfJob?: string;
    category?: string;
    address?: string;
    licenseState?: string;
    skip?: number;
    take?: number;
  }) {
    const where: any = {};
    if (params?.status) where.status = params.status;
    const typeOfJobValues = splitFilterValues(params?.typeOfJob);
    const categoryValues = splitFilterValues(params?.category);
    const addressValues = splitFilterValues(params?.address);
    if (typeOfJobValues.length) where.typeOfJob = { in: typeOfJobValues };
    if (categoryValues.length) where.category = { in: categoryValues };
    if (addressValues.length) where.address = { in: addressValues };
    if (params?.licenseState === 'paused') where.status = 'suspended';
    if (params?.licenseState === 'expired') where.licenseExpiryDate = { lt: new Date() };
    if (params?.licenseState === 'renewed_this_year') {
      const startOfYear = new Date(new Date().getFullYear(), 0, 1);
      const startOfNextYear = new Date(new Date().getFullYear() + 1, 0, 1);
      where.licenseRegistrationType = 'renewal';
      where.licenseRegistrationDate = { gte: startOfYear, lt: startOfNextYear };
    }
    if (params?.search) {
      where.OR = [
        { fullName: { contains: params.search, mode: 'insensitive' } },
        { tin: { contains: params.search, mode: 'insensitive' } },
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

  async getFilterOptions() {
    const [typeOfJobRows, categoryRows, addressRows] = await Promise.all([
      this.prisma.trader.findMany({
        where: { typeOfJob: { not: null } },
        distinct: ['typeOfJob'],
        select: { typeOfJob: true },
        orderBy: { typeOfJob: 'asc' },
      }),
      this.prisma.trader.findMany({
        where: { category: { not: null } },
        distinct: ['category'],
        select: { category: true },
        orderBy: { category: 'asc' },
      }),
      this.prisma.trader.findMany({
        where: { address: { not: null } },
        distinct: ['address'],
        select: { address: true },
        orderBy: { address: 'asc' },
      }),
    ]);
    return {
      typeOfJobs: cleanFilterOptions(typeOfJobRows.map((r) => r.typeOfJob)),
      categories: cleanFilterOptions(categoryRows.map((r) => r.category)),
      addresses: cleanFilterOptions(addressRows.map((r) => r.address)),
    };
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
            documents: true,
          },
        },
        documents: true,
      },
    });
  }

  async update(id: string, dto: UpdateTraderDto) {
    const data: any = { ...dto };
    applyLicenseRegistrationDates(data);
    if (dto.phone) {
      const existingPhone = await this.prisma.trader.findFirst({ where: { phone: dto.phone, NOT: { id } } });
      if (existingPhone) throw new BadRequestException('Phone number already exists');
    }
    if (dto.tin) {
      const existingTin = await this.prisma.trader.findFirst({ where: { tin: dto.tin, NOT: { id } } as any });
      if (existingTin) throw new BadRequestException('TIN already exists');
    }
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
