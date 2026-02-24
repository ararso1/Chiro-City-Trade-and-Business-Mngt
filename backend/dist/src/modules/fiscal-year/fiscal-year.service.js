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
exports.FiscalYearService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let FiscalYearService = class FiscalYearService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getConfig() {
        const [calendarRow, activeRow] = await Promise.all([
            this.prisma.systemConfig.findUnique({ where: { key: 'fiscal_calendar_type' } }),
            this.prisma.systemConfig.findUnique({ where: { key: 'active_fiscal_year_id' } }),
        ]);
        const calendarType = (calendarRow?.value === 'EC' || calendarRow?.value === 'GC') ? calendarRow.value : 'GC';
        const activeFiscalYearId = activeRow?.value?.trim() || null;
        return { calendarType, activeFiscalYearId };
    }
    async getActiveDateRange() {
        const { activeFiscalYearId } = await this.getConfig();
        if (!activeFiscalYearId)
            return null;
        const fy = await this.prisma.fiscalYear.findUnique({
            where: { id: activeFiscalYearId },
        });
        if (!fy)
            return null;
        return {
            startDate: fy.startDate,
            endDate: fy.endDate,
            fiscalYearId: fy.id,
            label: fy.label,
            calendarType: fy.calendarType,
        };
    }
    async getDateFilterFor(field = 'createdAt') {
        const range = await this.getActiveDateRange();
        if (!range)
            return undefined;
        return {
            gte: range.startDate,
            lte: range.endDate,
        };
    }
    async setConfig(calendarType, activeFiscalYearId) {
        await this.prisma.$transaction([
            this.prisma.systemConfig.upsert({
                where: { key: 'fiscal_calendar_type' },
                create: { key: 'fiscal_calendar_type', value: calendarType },
                update: { value: calendarType },
            }),
            this.prisma.systemConfig.upsert({
                where: { key: 'active_fiscal_year_id' },
                create: { key: 'active_fiscal_year_id', value: activeFiscalYearId ?? '' },
                update: { value: activeFiscalYearId ?? '' },
            }),
        ]);
        return this.getConfig();
    }
    async listFiscalYears(calendarType) {
        const where = calendarType ? { calendarType } : {};
        return this.prisma.fiscalYear.findMany({
            where,
            orderBy: [{ startDate: 'desc' }],
        });
    }
    async createFiscalYear(data) {
        return this.prisma.fiscalYear.create({
            data: {
                ...data,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
            },
        });
    }
    async updateFiscalYear(id, data) {
        const update = { ...data };
        if (data.startDate)
            update.startDate = new Date(data.startDate);
        if (data.endDate)
            update.endDate = new Date(data.endDate);
        return this.prisma.fiscalYear.update({ where: { id }, data: update });
    }
    async deleteFiscalYear(id) {
        return this.prisma.fiscalYear.delete({ where: { id } });
    }
};
exports.FiscalYearService = FiscalYearService;
exports.FiscalYearService = FiscalYearService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FiscalYearService);
//# sourceMappingURL=fiscal-year.service.js.map