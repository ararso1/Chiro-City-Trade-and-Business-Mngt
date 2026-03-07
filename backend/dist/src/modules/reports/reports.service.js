"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const fiscal_year_service_1 = require("../fiscal-year/fiscal-year.service");
let ReportsService = class ReportsService {
    constructor(prisma, fiscalYear) {
        this.prisma = prisma;
        this.fiscalYear = fiscalYear;
    }
    async getDashboardStats() {
        const dateFilter = await this.fiscalYear.getDateFilterFor('createdAt');
        const paidAtFilter = await this.fiscalYear.getDateFilterFor('paidAt');
        const baseWhere = dateFilter ? { createdAt: dateFilter } : {};
        const paymentWhere = { status: 'paid', ...(paidAtFilter ? { paidAt: paidAtFilter } : {}) };
        const [totalTraders, activeLicenses, expiredLicenses, totalViolations, openComplaints,] = await Promise.all([
            this.prisma.trader.count({ where: { status: 'active', ...baseWhere } }),
            this.prisma.license.count({ where: { status: 'issued', ...(dateFilter ? { createdAt: dateFilter } : {}) } }),
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
    async getExportSummary(params) {
        const fiscalRange = await this.fiscalYear.getActiveDateRange();
        const from = params?.from ?? fiscalRange?.startDate;
        const to = params?.to ?? fiscalRange?.endDate;
        const hasRange = from && to;
        const where = {};
        if (hasRange) {
            where.createdAt = { gte: from, lte: to };
        }
        const paymentWhere = hasRange
            ? { status: 'paid', paidAt: { gte: from, lte: to } }
            : { status: 'paid' };
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
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        fiscal_year_service_1.FiscalYearService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map