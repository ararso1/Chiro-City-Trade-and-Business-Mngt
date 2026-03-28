import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLicenseDto, UpdateLicenseDto } from './dto/license.dto';

function generateLicenseNo(): string {
  const pad = (n: number, w: number) => String(n).padStart(w, '0');
  const t = Date.now();
  const r = Math.floor(Math.random() * 10000);
  return `LIC-${pad(t % 100000000, 8)}-${pad(r, 4)}`;
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
      // Registration creates the license application in "application" state automatically.
      status: 'application',
      qrCode: dto.qrCode ?? null,
      issuedById: dto.issuedById ?? null,
    };
    return this.prisma.license.create({
      data: data as any,
    });
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
    if (params?.status) where.status = params.status;
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
    return { items, total };
  }

  async findOne(id: string) {
    return this.prisma.license.findUnique({
      where: { id },
      include: {
        trader: true,
        business: { include: { trader: true } },
        issuedBy: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async update(id: string, dto: UpdateLicenseDto & { issuedById?: string }) {
    const data: Record<string, unknown> = { ...dto };
    if (dto.issueDate !== undefined) data.issueDate = dto.issueDate ? new Date(dto.issueDate) : null;
    if (dto.expiryDate !== undefined) data.expiryDate = dto.expiryDate ? new Date(dto.expiryDate) : null;
    return this.prisma.license.update({ where: { id }, data: data as any });
  }

  async remove(id: string) {
    await this.prisma.license.delete({ where: { id } });
    return { success: true as const, id };
  }
}
