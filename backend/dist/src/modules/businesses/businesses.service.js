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
exports.BusinessesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const fiscal_year_service_1 = require("../fiscal-year/fiscal-year.service");
let BusinessesService = class BusinessesService {
    constructor(prisma, fiscalYear) {
        this.prisma = prisma;
        this.fiscalYear = fiscalYear;
    }
    async create(dto) {
        return this.prisma.business.create({ data: dto });
    }
    async findAll(params) {
        const where = {};
        if (params?.status)
            where.status = params.status;
        if (params?.traderId)
            where.traderId = params.traderId;
        if (params?.search) {
            where.OR = [
                { name: { contains: params.search, mode: 'insensitive' } },
                { tradeName: { contains: params.search, mode: 'insensitive' } },
                { category: { contains: params.search, mode: 'insensitive' } },
            ];
        }
        const dateFilter = await this.fiscalYear.getDateFilterFor('createdAt');
        if (dateFilter)
            where.createdAt = dateFilter;
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
    async findOne(id) {
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
    async update(id, dto) {
        return this.prisma.business.update({ where: { id }, data: dto });
    }
};
exports.BusinessesService = BusinessesService;
exports.BusinessesService = BusinessesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        fiscal_year_service_1.FiscalYearService])
], BusinessesService);
//# sourceMappingURL=businesses.service.js.map