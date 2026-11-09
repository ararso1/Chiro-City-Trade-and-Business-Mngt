import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FiscalYearService } from '../fiscal-year/fiscal-year.service';

type DateRange = { gte: Date; lte: Date };

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private fiscalYear: FiscalYearService,
  ) {}

  private async resolvePeriod(params?: {
    from?: Date;
    to?: Date;
    allTime?: boolean;
  }) {
    const fiscalRange = await this.fiscalYear.getActiveDateRange();
    const fiscalYear = fiscalRange
      ? {
          label: fiscalRange.label,
          calendarType: fiscalRange.calendarType,
        }
      : null;

    if (params?.allTime) {
      return {
        from: null,
        to: null,
        range: undefined,
        source: 'all' as const,
        fiscalYear,
      };
    }

    const hasExplicit = Boolean(params?.from && params?.to);
    const from = hasExplicit ? params?.from : fiscalRange?.startDate;
    const to = hasExplicit ? params?.to : fiscalRange?.endDate;
    const hasRange = Boolean(from && to);
    const range: DateRange | undefined = hasRange
      ? { gte: from as Date, lte: to as Date }
      : undefined;
    return {
      from: from ?? null,
      to: to ?? null,
      range,
      source: hasExplicit
        ? ('custom' as const)
        : hasRange
          ? ('fiscal' as const)
          : ('all' as const),
      fiscalYear,
    };
  }

  private countsByKey(
    rows: { key: string | null; _count: { _all: number } }[],
  ): Record<string, number> {
    return rows.reduce<Record<string, number>>((acc, row) => {
      const key = row.key || 'unknown';
      acc[key] = row._count._all;
      return acc;
    }, {});
  }

  async getDashboardStats() {
    const dateFilter = await this.fiscalYear.getDateFilterFor('createdAt');
    const paidAtFilter = await this.fiscalYear.getDateFilterFor('paidAt');
    const baseWhere = dateFilter ? { createdAt: dateFilter } : {};
    const paymentWhere = {
      status: 'paid' as const,
      ...(paidAtFilter ? { paidAt: paidAtFilter } : {}),
    };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueSoonDate = new Date();
    dueSoonDate.setDate(dueSoonDate.getDate() + 30);
    const notSuspendedLicense = {
      NOT: { status: { in: ['suspended', 'Suspended'] } },
    };
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
      this.prisma.trader.count({
        where: { status: 'submitted', ...baseWhere },
      }),
      this.prisma.business.count({ where: baseWhere }),
      this.prisma.business.count({
        where: { status: 'active', ...baseWhere },
      }),
      this.prisma.business.count({
        where: { status: 'pending', ...baseWhere },
      }),
      this.prisma.license.count({
        where: dateFilter ? { createdAt: dateFilter } : {},
      }),
      this.prisma.license.count({
        where: {
          ...notSuspendedLicense,
          OR: [{ expiryDate: null }, { expiryDate: { gt: dueSoonDate } }],
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
      }),
      this.prisma.license.count({
        where: {
          ...notSuspendedLicense,
          expiryDate: { lt: today },
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
      }),
      this.prisma.license.count({
        where: {
          status: { in: ['suspended', 'Suspended'] },
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
      }),
      this.prisma.license.count({
        where: {
          ...notSuspendedLicense,
          expiryDate: { gte: today, lte: dueSoonDate },
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
      }),
      this.prisma.license.count({
        where: {
          ...notSuspendedLicense,
          expiryDate: { gte: today, lte: dueSoonDate },
        },
      }),
      this.prisma.violation.count({
        where: {
          resolvedAt: null,
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
      }),
      this.prisma.complaint.count({
        where: { status: 'open', ...baseWhere },
      }),
      this.prisma.inspection.count({
        where: { status: 'scheduled', ...baseWhere },
      }),
      this.prisma.inspection.count({
        where: { status: 'conducted', ...baseWhere },
      }),
      this.prisma.payment.count({
        where: {
          status: 'pending',
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
      }),
      this.prisma.payment.count({
        where: {
          status: 'overdue',
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
      }),
      this.prisma.payment.count({ where: paymentWhere }),
      this.prisma.traderDocument.count(),
      this.prisma.businessDocument.count(),
      this.prisma.trader.findMany({
        where: baseWhere,
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fullName: true,
          tin: true,
          status: true,
          createdAt: true,
        },
      }),
      this.prisma.business.findMany({
        where: baseWhere,
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          category: true,
          status: true,
          createdAt: true,
          trader: { select: { fullName: true } },
        },
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
      fiscalYear: activeRange
        ? { label: activeRange.label, calendarType: activeRange.calendarType }
        : null,
    };
  }

  async getModuleSummary(params?: {
    from?: Date;
    to?: Date;
    allTime?: boolean;
  }) {
    const period = await this.resolvePeriod(params);
    const createdAt = period.range ? { createdAt: period.range } : {};
    const paidAtFilter = period.range ? { paidAt: period.range } : {};
    const scheduledAt = period.range ? { scheduledAt: period.range } : {};
    const uploadedAt = period.range ? { uploadedAt: period.range } : {};
    const issueDate = period.range ? { issueDate: period.range } : {};

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueSoonDate = new Date(today);
    dueSoonDate.setDate(dueSoonDate.getDate() + 30);
    const notSuspendedLicense = {
      NOT: { status: { in: ['suspended', 'Suspended'] } },
    };

    const [
      tradersTotal,
      tradersByStatus,
      tradersByCategory,
      businessesTotal,
      businessesByStatus,
      businessesByCategory,
      licensesTotal,
      licensesIssued,
      licensesActive,
      licensesExpired,
      licensesExpiringSoon,
      licensesSuspended,
      paidAgg,
      pendingPayments,
      overduePayments,
      partialPayments,
      paymentsByStatus,
      inspectionsTotal,
      inspectionsByStatus,
      inspectionsByResult,
      violationsTotal,
      violationsOpen,
      violationsResolved,
      complaintsTotal,
      complaintsByStatus,
      complaintsByCategory,
      traderDocuments,
      businessDocuments,
    ] = await Promise.all([
      this.prisma.trader.count({ where: createdAt }),
      this.prisma.trader.groupBy({
        by: ['status'],
        where: createdAt,
        _count: { _all: true },
      }),
      this.prisma.trader.groupBy({
        by: ['category'],
        where: createdAt,
        _count: { _all: true },
      }),
      this.prisma.business.count({ where: createdAt }),
      this.prisma.business.groupBy({
        by: ['status'],
        where: createdAt,
        _count: { _all: true },
      }),
      this.prisma.business.groupBy({
        by: ['category'],
        where: createdAt,
        _count: { _all: true },
      }),
      this.prisma.license.count({ where: createdAt }),
      this.prisma.license.count({
        where: period.range
          ? issueDate
          : { issueDate: { not: null } },
      }),
      this.prisma.license.count({
        where: {
          ...notSuspendedLicense,
          OR: [{ expiryDate: null }, { expiryDate: { gt: dueSoonDate } }],
          ...createdAt,
        },
      }),
      this.prisma.license.count({
        where: {
          ...notSuspendedLicense,
          expiryDate: { lt: today },
          ...createdAt,
        },
      }),
      this.prisma.license.count({
        where: {
          ...notSuspendedLicense,
          expiryDate: { gte: today, lte: dueSoonDate },
        },
      }),
      this.prisma.license.count({
        where: {
          status: { in: ['suspended', 'Suspended'] },
          ...createdAt,
        },
      }),
      this.prisma.payment.aggregate({
        where: { status: 'paid', ...paidAtFilter },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.payment.count({
        where: { status: 'pending', ...createdAt },
      }),
      this.prisma.payment.count({
        where: { status: 'overdue', ...createdAt },
      }),
      this.prisma.payment.count({
        where: { status: 'partial', ...createdAt },
      }),
      this.prisma.payment.groupBy({
        by: ['status'],
        where: createdAt,
        _count: { _all: true },
      }),
      this.prisma.inspection.count({
        where: period.range ? scheduledAt : {},
      }),
      this.prisma.inspection.groupBy({
        by: ['status'],
        where: period.range ? scheduledAt : {},
        _count: { _all: true },
      }),
      this.prisma.inspection.groupBy({
        by: ['result'],
        where: {
          ...(period.range ? scheduledAt : {}),
          result: { not: null },
        },
        _count: { _all: true },
      }),
      this.prisma.violation.count({ where: createdAt }),
      this.prisma.violation.count({
        where: { resolvedAt: null, ...createdAt },
      }),
      this.prisma.violation.count({
        where: {
          resolvedAt: { not: null },
          ...(period.range ? { resolvedAt: period.range } : {}),
        },
      }),
      this.prisma.complaint.count({ where: createdAt }),
      this.prisma.complaint.groupBy({
        by: ['status'],
        where: createdAt,
        _count: { _all: true },
      }),
      this.prisma.complaint.groupBy({
        by: ['category'],
        where: createdAt,
        _count: { _all: true },
      }),
      this.prisma.traderDocument.count({ where: uploadedAt }),
      this.prisma.businessDocument.count({ where: uploadedAt }),
    ]);

    const traderStatus = this.countsByKey(
      tradersByStatus.map((r) => ({ key: r.status, _count: r._count })),
    );
    const businessStatus = this.countsByKey(
      businessesByStatus.map((r) => ({ key: r.status, _count: r._count })),
    );
    const paymentStatus = this.countsByKey(
      paymentsByStatus.map((r) => ({ key: r.status, _count: r._count })),
    );
    const inspectionStatus = this.countsByKey(
      inspectionsByStatus.map((r) => ({ key: r.status, _count: r._count })),
    );
    const inspectionResults = this.countsByKey(
      inspectionsByResult.map((r) => ({ key: r.result, _count: r._count })),
    );
    const complaintStatus = this.countsByKey(
      complaintsByStatus.map((r) => ({ key: r.status, _count: r._count })),
    );

    const revenue = Number(paidAgg._sum?.amount ?? 0);

    return {
      period: {
        from: period.from,
        to: period.to,
        label:
          period.source === 'fiscal'
            ? period.fiscalYear?.label ?? 'Active fiscal year'
            : period.source === 'custom'
              ? 'Custom range'
              : 'All time',
      },
      fiscalYear: period.fiscalYear,
      generatedAt: new Date(),
      overview: {
        traders: tradersTotal,
        businesses: businessesTotal,
        licenses: licensesTotal,
        revenue,
        paidPayments: paidAgg._count,
        openComplaints: complaintStatus.open ?? 0,
        openViolations: violationsOpen,
        inspections: inspectionsTotal,
        documents: traderDocuments + businessDocuments,
      },
      traders: {
        total: tradersTotal,
        byStatus: traderStatus,
        byCategory: this.countsByKey(
          tradersByCategory.map((r) => ({
            key: r.category,
            _count: r._count,
          })),
        ),
        active: traderStatus.active ?? 0,
        submitted: traderStatus.submitted ?? 0,
        draft: traderStatus.draft ?? 0,
        suspended: traderStatus.suspended ?? 0,
        closed: traderStatus.closed ?? 0,
      },
      businesses: {
        total: businessesTotal,
        byStatus: businessStatus,
        byCategory: this.countsByKey(
          businessesByCategory.map((r) => ({
            key: r.category,
            _count: r._count,
          })),
        ),
        active: businessStatus.active ?? 0,
        pending: businessStatus.pending ?? 0,
        suspended: businessStatus.suspended ?? 0,
        closed: businessStatus.closed ?? 0,
      },
      licenses: {
        total: licensesTotal,
        issuedInPeriod: licensesIssued,
        active: licensesActive,
        expired: licensesExpired,
        expiringSoon: licensesExpiringSoon,
        suspended: licensesSuspended,
      },
      finance: {
        revenue,
        paidCount: paidAgg._count,
        pending: pendingPayments,
        overdue: overduePayments,
        partial: partialPayments,
        byStatus: paymentStatus,
        currency: 'ETB',
      },
      inspections: {
        total: inspectionsTotal,
        byStatus: inspectionStatus,
        byResult: inspectionResults,
        scheduled: inspectionStatus.scheduled ?? 0,
        conducted: inspectionStatus.conducted ?? 0,
        cancelled: inspectionStatus.cancelled ?? 0,
        violations: {
          total: violationsTotal,
          open: violationsOpen,
          resolved: violationsResolved,
        },
      },
      complaints: {
        total: complaintsTotal,
        byStatus: complaintStatus,
        byCategory: this.countsByKey(
          complaintsByCategory.map((r) => ({
            key: r.category,
            _count: r._count,
          })),
        ),
        open: complaintStatus.open ?? 0,
        inProgress: complaintStatus.in_progress ?? 0,
        resolved: complaintStatus.resolved ?? 0,
        closed: complaintStatus.closed ?? 0,
      },
      documents: {
        total: traderDocuments + businessDocuments,
        traderDocuments,
        businessDocuments,
      },
    };
  }

  async getExportSummary(params?: {
    from?: Date;
    to?: Date;
    allTime?: boolean;
  }) {
    const summary = await this.getModuleSummary(params);
    return {
      period: summary.period,
      tradersRegistered: summary.traders.total,
      businessesRegistered: summary.businesses.total,
      totalPayments: summary.finance.paidCount,
      totalRevenue: summary.finance.revenue,
      modules: {
        traders: summary.traders,
        businesses: summary.businesses,
        licenses: summary.licenses,
        finance: summary.finance,
        inspections: summary.inspections,
        complaints: summary.complaints,
        documents: summary.documents,
      },
      overview: summary.overview,
      fiscalYear: summary.fiscalYear,
      generatedAt: summary.generatedAt,
    };
  }
}
