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
exports.TradersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const fiscal_year_service_1 = require("../fiscal-year/fiscal-year.service");
let TradersService = class TradersService {
    constructor(prisma, fiscalYear) {
        this.prisma = prisma;
        this.fiscalYear = fiscalYear;
    }
    async create(dto) {
        return this.prisma.trader.create({ data: dto });
    }
    async findAll(params) {
        const where = {};
        if (params?.status)
            where.status = params.status;
        if (params?.search) {
            where.OR = [
                { fullName: { contains: params.search, mode: 'insensitive' } },
                { email: { contains: params.search, mode: 'insensitive' } },
                { phone: { contains: params.search, mode: 'insensitive' } },
            ];
        }
        const dateFilter = await this.fiscalYear.getDateFilterFor('createdAt');
        if (dateFilter)
            where.createdAt = dateFilter;
        const [items, total] = await Promise.all([
            this.prisma.trader.findMany({
                where,
                skip: params?.skip ?? 0,
                take: Math.min(params?.take ?? 50, 100),
                include: { businesses: { select: { id: true, name: true, status: true } } },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.trader.count({ where }),
        ]);
        return { items, total };
    }
    async findOne(id) {
        return this.prisma.trader.findUnique({
            where: { id },
            include: {
                businesses: {
                    include: {
                        licenses: true,
                        _count: { select: { inspections: true, payments: true } },
                    },
                },
                documents: true,
            },
        });
    }
    async update(id, dto) {
        return this.prisma.trader.update({ where: { id }, data: dto });
    }
};
exports.TradersService = TradersService;
exports.TradersService = TradersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        fiscal_year_service_1.FiscalYearService])
], TradersService);
//# sourceMappingURL=traders.service.js.map