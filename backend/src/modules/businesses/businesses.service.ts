import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBusinessDto, UpdateBusinessDto } from './dto/business.dto';
import { FiscalYearService } from '../fiscal-year/fiscal-year.service';

function generateLicenseNo(): string {
  const pad = (n: number, w: number) => String(n).padStart(w, '0');
  const t = Date.now();
  const r = Math.floor(Math.random() * 10000);
  return `LIC-${pad(t % 100000000, 8)}-${pad(r, 4)}`;
}

function addOneYear(date: Date) {
  const expiry = new Date(date);
  expiry.setFullYear(expiry.getFullYear() + 1);
  return expiry;
}

function lifecycleStatus(issueDate: Date, expiryDate: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  if (expiry < today) return 'Expired';
  const days = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return days <= 30 ? 'Expiring Soon' : 'Active';
}

function businessLicenseData(business: {
  traderId: string;
  id: string;
  type?: string | null;
  category?: string | null;
  startDate?: Date | null;
  createdAt?: Date;
}) {
  const issueDate = business.startDate ?? business.createdAt ?? new Date();
  const expiryDate = addOneYear(issueDate);
  return {
    licenseNo: generateLicenseNo(),
    traderId: business.traderId,
    businessId: business.id,
    licenseType: business.type || business.category || 'Annual Trading',
    issueDate,
    expiryDate,
    status: lifecycleStatus(issueDate, expiryDate),
  };
}

function businessOnlyData(dto: CreateBusinessDto | UpdateBusinessDto) {
  const {
    licenseNo,
    licenseType,
    licenseIssueDate,
    licenseExpiryDate,
    licenseStatus,
    ...businessData
  } = dto as any;
  return businessData;
}

@Injectable()
export class BusinessesService {
  constructor(
    private prisma: PrismaService,
    private fiscalYear: FiscalYearService,
  ) {}

  async create(dto: CreateBusinessDto) {
    const data: any = businessOnlyData(dto);
    if (dto.startDate) data.startDate = new Date(dto.startDate);
    // Registration creates the business in "pending" state unless a workflow explicitly sets it.
    data.status = dto.status ?? 'pending';
    return this.prisma.$transaction(async (tx) => {
      const business = await tx.business.create({ data });
      await tx.license.create({
        data: businessLicenseData(business),
      });
      return tx.business.findUnique({
        where: { id: business.id },
        include: { trader: { select: { id: true, fullName: true, email: true } }, licenses: true },
      });
    });
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
    const data: any = businessOnlyData(dto);
    if (dto.startDate !== undefined) data.startDate = dto.startDate ? new Date(dto.startDate) : null;
    return this.prisma.$transaction(async (tx) => {
      const business = await tx.business.update({ where: { id }, data });
      const existingLicense = await tx.license.findFirst({
        where: { businessId: id },
        orderBy: { createdAt: 'asc' },
      });
      if (!existingLicense) {
        await tx.license.create({
          data: businessLicenseData(business),
        });
      }
      return tx.business.findUnique({
        where: { id },
        include: { trader: { select: { id: true, fullName: true, email: true } }, licenses: true },
      });
    });
  }

  async remove(id: string) {
    await this.prisma.business.delete({ where: { id } });
    return { success: true as const, id };
  }
}
