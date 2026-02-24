import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { FiscalYearService } from '../fiscal-year/fiscal-year.service';

@Injectable()
export class FinanceService {
  constructor(
    private prisma: PrismaService,
    private fiscalYear: FiscalYearService,
  ) {}

  async getTaxTypes() {
    return this.prisma.taxType.findMany({ where: { isActive: true }, orderBy: { code: 'asc' } });
  }

  async getPayments(params?: { businessId?: string; year?: number; status?: string; skip?: number; take?: number }) {
    const where: any = {};
    if (params?.businessId) where.businessId = params.businessId;
    if (params?.year) where.year = params.year;
    if (params?.status) where.status = params.status;
    const paidAtFilter = await this.fiscalYear.getDateFilterFor('paidAt');
    if (paidAtFilter) where.paidAt = paidAtFilter;
    const [items, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip: params?.skip ?? 0,
        take: Math.min(params?.take ?? 50, 100),
        include: { business: { select: { id: true, name: true } }, taxType: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.payment.count({ where }),
    ]);
    return { items, total };
  }

  async recordPayment(data: {
    businessId: string;
    taxTypeId?: string;
    amount: number;
    year: number;
    period?: string;
    reference?: string;
    notes?: string;
  }) {
    return this.prisma.payment.create({
      data: {
        ...data,
        amount: new Decimal(data.amount),
        status: 'paid',
        paidAt: new Date(),
      } as any,
      include: { business: true, taxType: true },
    });
  }

  async getRevenueSummary(year?: number) {
    const where: any = { status: 'paid' };
    if (year) where.year = year;
    const paidAtFilter = await this.fiscalYear.getDateFilterFor('paidAt');
    if (paidAtFilter) where.paidAt = paidAtFilter;
    const result = await this.prisma.payment.aggregate({
      where,
      _sum: { amount: true },
      _count: true,
    });
    const activeRange = await this.fiscalYear.getActiveDateRange();
    return {
      totalRevenue: result._sum?.amount ?? 0,
      paymentCount: result._count,
      year: year ?? activeRange?.label ?? new Date().getFullYear().toString(),
    };
  }
}
