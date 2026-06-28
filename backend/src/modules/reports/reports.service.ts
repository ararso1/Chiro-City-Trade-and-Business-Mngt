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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueSoonDate = new Date();
    dueSoonDate.setDate(dueSoonDate.getDate() + 30);
    const notSuspendedLicense = { NOT: { status: { in: ['suspended', 'Suspended'] } } };
    const [
      totalTraders,
      activeTraders,
      submittedTraders,
      totalBusinesses,
      activeBusinesses,
      pendingBusinesses,
      totalLicenses,
      activeLicenses,
      expiredLicenses,
      pendingLicenses,
      renewalLicenses,
      licensesExpiringSoon,
      totalViolations,
      openComplaints,
      scheduledInspections,
      completedInspections,
      pendingPayments,
      overduePayments,
      paidPayments,
      traderDocuments,
      businessDocuments,
      recentTraders,
      recentBusinesses,
    ] = await Promise.all([
      this.prisma.trader.count({ where: baseWhere }),
      this.prisma.trader.count({ where: { status: 'active', ...baseWhere } }),
      this.prisma.trader.count({ where: { status: 'submitted', ...baseWhere } }),
      this.prisma.business.count({ where: baseWhere }),
      this.prisma.business.count({ where: { status: 'active', ...baseWhere } }),
      this.prisma.business.count({ where: { status: 'pending', ...baseWhere } }),
      this.prisma.license.count({ where: dateFilter ? { createdAt: dateFilter } : {} }),
      this.prisma.license.count({ where: { ...notSuspendedLicense, OR: [{ expiryDate: null }, { expiryDate: { gt: dueSoonDate } }], ...(dateFilter ? { createdAt: dateFilter } : {}) } }),
      this.prisma.license.count({ where: { ...notSuspendedLicense, expiryDate: { lt: today }, ...(dateFilter ? { createdAt: dateFilter } : {}) } }),
      this.prisma.license.count({ where: { status: { in: ['suspended', 'Suspended'] }, ...(dateFilter ? { createdAt: dateFilter } : {}) } }),
      this.prisma.license.count({ where: { ...notSuspendedLicense, expiryDate: { gte: today, lte: dueSoonDate }, ...(dateFilter ? { createdAt: dateFilter } : {}) } }),
      this.prisma.license.count({ where: { ...notSuspendedLicense, expiryDate: { gte: today, lte: dueSoonDate } } }),
      this.prisma.violation.count({ where: { resolvedAt: null, ...(dateFilter ? { createdAt: dateFilter } : {}) } }),
      this.prisma.complaint.count({ where: { status: 'open', ...baseWhere } }),
      this.prisma.inspection.count({ where: { status: 'scheduled', ...baseWhere } }),
      this.prisma.inspection.count({ where: { status: 'conducted', ...baseWhere } }),
      this.prisma.payment.count({ where: { status: 'pending', ...(dateFilter ? { createdAt: dateFilter } : {}) } }),
      this.prisma.payment.count({ where: { status: 'overdue', ...(dateFilter ? { createdAt: dateFilter } : {}) } }),
      this.prisma.payment.count({ where: paymentWhere }),
      this.prisma.traderDocument.count(),
      this.prisma.businessDocument.count(),
      this.prisma.trader.findMany({
        where: baseWhere,
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, fullName: true, tin: true, status: true, createdAt: true },
      }),
      this.prisma.business.findMany({
        where: baseWhere,
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, category: true, status: true, createdAt: true, trader: { select: { fullName: true } } },
      }),
    ]);
    const revenueResult = await this.prisma.payment.aggregate({
      where: paymentWhere,
      _sum: { amount: true },
    });
    const totalRevenue = Number(revenueResult._sum?.amount ?? 0);
    const activeRange = await this.fiscalYear.getActiveDateRange();
    return {
      totalTraders,
      activeTraders,
      submittedTraders,
      totalBusinesses,
      activeBusinesses,
      pendingBusinesses,
      totalLicenses,
      activeLicenses,
      expiredLicenses,
      pendingLicenses,
      renewalLicenses,
      licensesExpiringSoon,
      totalRevenue,
      totalViolations,
      openComplaints,
      scheduledInspections,
      completedInspections,
      pendingPayments,
      overduePayments,
      paidPayments,
      totalDocuments: traderDocuments + businessDocuments,
      traderDocuments,
      businessDocuments,
      recentTraders,
      recentBusinesses,
      generatedAt: new Date(),
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
