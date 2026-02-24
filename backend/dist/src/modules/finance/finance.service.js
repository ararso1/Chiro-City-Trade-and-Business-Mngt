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
exports.FinanceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const library_1 = require("@prisma/client/runtime/library");
const fiscal_year_service_1 = require("../fiscal-year/fiscal-year.service");
let FinanceService = class FinanceService {
    constructor(prisma, fiscalYear) {
        this.prisma = prisma;
        this.fiscalYear = fiscalYear;
    }
    async getTaxTypes() {
        return this.prisma.taxType.findMany({ where: { isActive: true }, orderBy: { code: 'asc' } });
    }
    async getPayments(params) {
        const where = {};
        if (params?.businessId)
            where.businessId = params.businessId;
        if (params?.year)
            where.year = params.year;
        if (params?.status)
            where.status = params.status;
        const paidAtFilter = await this.fiscalYear.getDateFilterFor('paidAt');
        if (paidAtFilter)
            where.paidAt = paidAtFilter;
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
    async recordPayment(data) {
        return this.prisma.payment.create({
            data: {
                ...data,
                amount: new library_1.Decimal(data.amount),
                status: 'paid',
                paidAt: new Date(),
            },
            include: { business: true, taxType: true },
        });
    }
    async getRevenueSummary(year) {
        const where = { status: 'paid' };
        if (year)
            where.year = year;
        const paidAtFilter = await this.fiscalYear.getDateFilterFor('paidAt');
        if (paidAtFilter)
            where.paidAt = paidAtFilter;
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
};
exports.FinanceService = FinanceService;
exports.FinanceService = FinanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        fiscal_year_service_1.FiscalYearService])
], FinanceService);
//# sourceMappingURL=finance.service.js.map