import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FiscalYearService } from '../fiscal-year/fiscal-year.service';

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private fiscalYear: FiscalYearService,
  ) {}

  async getDashboardStats() {
    const dateFilter = await this.fiscalYear.getDateFilterFor('createdAt');
    const paidAtFilter = await this.fiscalYear.getDateFilterFor('paidAt');
    const baseWhere = dateFilter ? { createdAt: dateFilter } : {};
    const paymentWhere = { status: 'paid' as const, ...(paidAtFilter ? { paidAt: paidAtFilter } : {}) };
    const [
      totalTraders,
      activeLicenses,
      expiredLicenses,
      totalViolations,
      openComplaints,
    ] = await Promise.all([
      this.prisma.trader.count({ where: { status: 'active', ...baseWhere } }),
      this.prisma.license.count({ where: { status: 'active', ...(dateFilter ? { createdAt: dateFilter } : {}) } }),
      this.prisma.license.count({ where: { status: 'expired', ...(dateFilter ? { createdAt: dateFilter } : {}) } }),
      this.prisma.violation.count({ where: { resolvedAt: null, ...(dateFilter ? { createdAt: dateFilter } : {}) } }),
      this.prisma.complaint.count({ where: { status: 'open', ...baseWhere } }),
    ]);
    const revenueResult = await this.prisma.payment.aggregate({
      where: paymentWhere,
      _sum: { amount: true },
    });
    const totalRevenue = Number(revenueResult._sum?.amount ?? 0);
    const activeRange = await this.fiscalYear.getActiveDateRange();
    return {
      totalTraders,
      activeLicenses,
      expiredLicenses,
      totalRevenue,
      totalViolations,
      openComplaints,
      fiscalYear: activeRange ? { label: activeRange.label, calendarType: activeRange.calendarType } : null,
    };
  }

  async getExportSummary(params?: { from?: Date; to?: Date }) {
    const fiscalRange = await this.fiscalYear.getActiveDateRange();
    const from = params?.from ?? fiscalRange?.startDate;
    const to = params?.to ?? fiscalRange?.endDate;
    const hasRange = from && to;
    const where: any = {};
    if (hasRange) {
      where.createdAt = { gte: from, lte: to };
    }
    const paymentWhere = hasRange
      ? { status: 'paid' as const, paidAt: { gte: from, lte: to } }
      : { status: 'paid' as const };
    const [traders, businesses, payments] = await Promise.all([
      this.prisma.trader.count({ where: where.createdAt ? { createdAt: where.createdAt } : {} }),
      this.prisma.business.count({ where: where.createdAt ? { createdAt: where.createdAt } : {} }),
      this.prisma.payment.aggregate({
        where: paymentWhere,
        _sum: { amount: true },
        _count: true,
      }),
    ]);
    return {
      period: { from, to },
      tradersRegistered: traders,
      businessesRegistered: businesses,
      totalPayments: payments._count,
      totalRevenue: Number(payments._sum?.amount ?? 0),
    };
  }
}
