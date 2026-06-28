import { BadRequestException, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { Decimal } from '@prisma/client/runtime/library';
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

function normalizeTin(value: unknown) {
  return String(value ?? '').replace(/\s+/g, '').trim();
}

function licenseLifecycleStatus(license: { status?: string | null; expiryDate?: Date | string | null }) {
  const rawStatus = String(license.status ?? '').toLowerCase();
  if (rawStatus === 'suspended') return 'Suspended';
  if (!license.expiryDate) return rawStatus === 'active' || rawStatus === 'issued' ? 'Active' : 'Expired';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiryDate = new Date(license.expiryDate);
  expiryDate.setHours(0, 0, 0, 0);
  if (expiryDate < today) return 'Expired';
  const days = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return days <= 30 ? 'Expiring Soon' : 'Active';
}

function traderLicenseStatus(traderStatus: string, licenses: Array<{ status?: string | null; expiryDate?: Date | string | null }>) {
  if (traderStatus === 'suspended') return 'Suspended';
  if (!licenses.length) return traderStatus;
  const statuses = licenses.map(licenseLifecycleStatus);
  if (statuses.includes('Suspended')) return 'Suspended';
  if (statuses.includes('Expired')) return 'Expired';
  if (statuses.includes('Expiring Soon')) return 'Expiring Soon';
  return 'Active';
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
    const addAnd = (condition: any) => {
      where.AND = [...(where.AND ?? []), condition];
    };
    if (params?.status) where.status = params.status;
    const typeOfJobValues = splitFilterValues(params?.typeOfJob);
    const categoryValues = splitFilterValues(params?.category);
    const addressValues = splitFilterValues(params?.address);
    if (typeOfJobValues.length) where.typeOfJob = { in: typeOfJobValues };
    if (categoryValues.length) where.category = { in: categoryValues };
    if (addressValues.length) where.address = { in: addressValues };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const soon = new Date(today);
    soon.setDate(soon.getDate() + 30);
    const notSuspendedLicense = { status: { notIn: ['Suspended', 'suspended'] } };
    if (params?.licenseState === 'suspended' || params?.licenseState === 'paused') {
      addAnd({
        OR: [
          { status: 'suspended' },
          { businesses: { some: { licenses: { some: { status: { in: ['Suspended', 'suspended'] } } } } } },
        ],
      });
    }
    if (params?.licenseState === 'expired') {
      addAnd({
        status: { not: 'suspended' },
        businesses: { some: { licenses: { some: { ...notSuspendedLicense, expiryDate: { lt: today } } } } },
      });
    }
    if (params?.licenseState === 'expiring_soon') {
      addAnd({
        status: { not: 'suspended' },
        businesses: { some: { licenses: { some: { ...notSuspendedLicense, expiryDate: { gte: today, lte: soon } } } } },
      });
    }
    if (params?.licenseState === 'active') {
      addAnd({
        status: { not: 'suspended' },
        businesses: {
          some: {
            licenses: {
              some: {
                ...notSuspendedLicense,
                OR: [
                  { status: { in: ['Active', 'active', 'issued'] } },
                  { expiryDate: null },
                  { expiryDate: { gte: today } },
                ],
              },
            },
          },
        },
      });
    }
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
        include: {
          businesses: {
            select: {
              id: true,
              name: true,
              status: true,
              payments: {
                where: { period: 'annual' },
                select: { amount: true, year: true },
                orderBy: { year: 'desc' },
                take: 1,
              },
              licenses: {
                select: { status: true, expiryDate: true },
                take: 1,
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.trader.count({ where }),
    ]);
    return {
      items: items.map((trader) => {
        const annualTax = trader.businesses
          .flatMap((business) => business.payments)
          .sort((a, b) => b.year - a.year)[0];
        const licenses = trader.businesses.flatMap((business) => business.licenses);
        return {
          ...trader,
          licenseStatus: traderLicenseStatus(trader.status, licenses),
          annualTaxAmount: annualTax ? Number(annualTax.amount) : null,
          annualTaxYear: annualTax?.year ?? null,
          businesses: trader.businesses.map(({ payments, licenses: _licenses, ...business }) => business),
        };
      }),
      total,
    };
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

  async bulkImportAnnualTax(rows: unknown[]) {
    if (!Array.isArray(rows)) {
      throw new BadRequestException('Body must include a rows array');
    }
    if (rows.length === 0) {
      throw new BadRequestException('At least one annual tax row is required');
    }
    if (rows.length > 1000) {
      throw new BadRequestException('Maximum 1000 annual tax rows per import');
    }

    const failed: { index: number; tin?: string; error: string }[] = [];
    let imported = 0;
    let updated = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] as any;
      const tin = normalizeTin(row?.tin ?? row?.TIN);
      const amount = Number(String(row?.amount ?? row?.Amount ?? '').replace(/,/g, ''));
      const year = Number.parseInt(String(row?.year ?? row?.Year ?? ''), 10);

      if (!tin) {
        failed.push({ index: i, error: 'Missing TIN' });
        continue;
      }
      if (!Number.isFinite(amount) || amount < 0) {
        failed.push({ index: i, tin, error: 'Invalid amount' });
        continue;
      }
      if (!Number.isInteger(year) || year < 1900 || year > 2200) {
        failed.push({ index: i, tin, error: 'Invalid year' });
        continue;
      }

      const trader = await this.prisma.trader.findFirst({
        where: { tin },
        include: { businesses: { select: { id: true }, orderBy: { createdAt: 'asc' }, take: 1 } },
      });
      if (!trader) {
        failed.push({ index: i, tin, error: 'No trader found for TIN' });
        continue;
      }
      const businessId = trader.businesses[0]?.id;
      if (!businessId) {
        failed.push({ index: i, tin, error: 'Trader has no business to attach annual tax record' });
        continue;
      }

      const existing = await this.prisma.payment.findFirst({
        where: { businessId, year, period: 'annual' },
        select: { id: true },
      });
      if (existing) {
        await this.prisma.payment.update({
          where: { id: existing.id },
          data: {
            amount: new Decimal(amount),
            notes: 'Annual tax import',
          },
        });
        updated++;
      } else {
        await this.prisma.payment.create({
          data: {
            businessId,
            amount: new Decimal(amount),
            year,
            period: 'annual',
            status: 'pending',
            notes: 'Annual tax import',
          },
        });
        imported++;
      }
    }

    return { imported, updated, failed, total: rows.length };
  }
}
