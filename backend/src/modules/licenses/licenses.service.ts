import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLicenseDto, UpdateLicenseDto } from './dto/license.dto';

function generateLicenseNo(): string {
  const pad = (n: number, w: number) => String(n).padStart(w, '0');
  const t = Date.now();
  const r = Math.floor(Math.random() * 10000);
  return `LIC-${pad(t % 100000000, 8)}-${pad(r, 4)}`;
}

function renewalDatesForYear(year: number) {
  return {
    issueDate: new Date(Date.UTC(year, 0, 1)),
    expiryDate: new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999)),
  };
}

export function getLicenseLifecycleStatus(license: { status?: string | null; expiryDate?: Date | string | null }) {
  const rawStatus = String(license.status ?? '').toLowerCase();
  if (rawStatus === 'suspended') return 'Suspended';
  if (!license.expiryDate) return rawStatus === 'active' || rawStatus === 'issued' ? 'Active' : 'Expired';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiryDate = new Date(license.expiryDate);
  expiryDate.setHours(0, 0, 0, 0);
  if (expiryDate < today) return 'Expired';

  const daysRemaining = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (daysRemaining <= 30) return 'Expiring Soon';
  return 'Active';
}

function withLifecycleStatus<T extends { status?: string | null; expiryDate?: Date | string | null }>(license: T) {
  return { ...license, status: getLicenseLifecycleStatus(license) };
}

function licenseStatusWhere(status?: string) {
  const normalized = String(status ?? '').toLowerCase();
  if (!normalized) return undefined;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const soon = new Date(today);
  soon.setDate(soon.getDate() + 30);
  const suspendedStatus = { in: ['suspended', 'Suspended'] };
  const notSuspended = { NOT: { status: suspendedStatus } };
  if (normalized === 'suspended') return { status: suspendedStatus };
  if (normalized === 'expired') return { expiryDate: { lt: today }, ...notSuspended };
  if (normalized === 'expiring_soon' || normalized === 'expiring soon') {
    return { expiryDate: { gte: today, lte: soon }, ...notSuspended };
  }
  if (normalized === 'active') {
    return {
      ...notSuspended,
      OR: [{ expiryDate: null }, { expiryDate: { gt: soon } }],
    };
  }
  return { status };
}

@Injectable()
export class LicensesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateLicenseDto) {
    const licenseNo = dto.licenseNo?.trim() || generateLicenseNo();
    const data: Record<string, unknown> = {
      licenseNo,
      traderId: dto.traderId,
      businessId: dto.businessId,
      licenseType: dto.licenseType ?? null,
      issueDate: dto.issueDate ? new Date(dto.issueDate) : null,
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
      status: dto.status ?? 'Active',
      qrCode: dto.qrCode ?? null,
      issuedById: dto.issuedById ?? null,
    };
    const license = await this.prisma.license.create({
      data: data as any,
    });
    return withLifecycleStatus(license);
  }

  async findAll(params?: {
    businessId?: string;
    traderId?: string;
    status?: string;
    skip?: number;
    take?: number;
  }) {
    const where: Record<string, unknown> = {};
    if (params?.businessId) where.businessId = params.businessId;
    if (params?.traderId) where.traderId = params.traderId;
    if (params?.status) Object.assign(where, licenseStatusWhere(params.status));
    const [items, total] = await Promise.all([
      this.prisma.license.findMany({
        where,
        skip: params?.skip ?? 0,
        take: Math.min(params?.take ?? 50, 100),
        include: {
          trader: { select: { id: true, fullName: true, email: true } },
          business: { select: { id: true, name: true } },
          issuedBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: [{ status: 'asc' }, { expiryDate: 'asc' }],
      }),
      this.prisma.license.count({ where }),
    ]);
    return { items: items.map(withLifecycleStatus), total };
  }

  async findOne(id: string) {
    const license = await this.prisma.license.findUnique({
      where: { id },
      include: {
        trader: true,
        business: { include: { trader: true } },
        issuedBy: { select: { id: true, name: true, email: true } },
      },
    });
    return license ? withLifecycleStatus(license) : null;
  }

  async update(id: string, dto: UpdateLicenseDto & { issuedById?: string }) {
    const data: Record<string, unknown> = { ...dto };
    if (dto.issueDate !== undefined) data.issueDate = dto.issueDate ? new Date(dto.issueDate) : null;
    if (dto.expiryDate !== undefined) data.expiryDate = dto.expiryDate ? new Date(dto.expiryDate) : null;
    const license = await this.prisma.license.update({ where: { id }, data: data as any });
    return withLifecycleStatus(license);
  }

  async renew(id: string, year: number, issuedById?: string) {
    if (!Number.isInteger(year) || year < 1900 || year > 2200) {
      throw new BadRequestException('Invalid renewal year');
    }
    const { issueDate, expiryDate } = renewalDatesForYear(year);
    const license = await this.prisma.license.update({
      where: { id },
      data: {
        issueDate,
        expiryDate,
        status: 'Active',
        ...(issuedById ? { issuedById } : {}),
      },
    });
    return withLifecycleStatus(license);
  }

  async remove(id: string) {
    await this.prisma.license.delete({ where: { id } });
    return { success: true as const, id };
  }
}
