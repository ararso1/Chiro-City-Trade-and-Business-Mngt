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
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const prisma_service_1 = require("../../prisma/prisma.service");
const trader_dto_1 = require("./dto/trader.dto");
const fiscal_year_service_1 = require("../fiscal-year/fiscal-year.service");
let TradersService = class TradersService {
    constructor(prisma, fiscalYear) {
        this.prisma = prisma;
        this.fiscalYear = fiscalYear;
    }
    async create(dto, createdById) {
        const data = { ...dto };
        if (dto.dob)
            data.dob = new Date(dto.dob);
        if (createdById)
            data.createdById = createdById;
        data.status = 'submitted';
        return this.prisma.trader.create({ data });
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
                createdBy: { select: { id: true, name: true, email: true } },
                approvedBy: { select: { id: true, name: true, email: true } },
                businesses: {
                    include: {
                        licenses: true,
                        inspections: { include: { inspector: { select: { name: true } }, violations: true } },
                        payments: { include: { taxType: true } },
                    },
                },
                documents: true,
            },
        });
    }
    async update(id, dto) {
        const data = { ...dto };
        if (dto.dob !== undefined)
            data.dob = dto.dob ? new Date(dto.dob) : null;
        return this.prisma.trader.update({ where: { id }, data });
    }
    async remove(id) {
        await this.prisma.trader.delete({ where: { id } });
        return { success: true, id };
    }
    async bulkImport(rows, createdById) {
        if (!Array.isArray(rows)) {
            throw new common_1.BadRequestException('Body must include a traders array');
        }
        if (rows.length === 0) {
            throw new common_1.BadRequestException('At least one trader row is required');
        }
        if (rows.length > 500) {
            throw new common_1.BadRequestException('Maximum 500 traders per import');
        }
        const failed = [];
        let created = 0;
        for (let i = 0; i < rows.length; i++) {
            const dto = (0, class_transformer_1.plainToInstance)(trader_dto_1.CreateTraderDto, rows[i]);
            const errors = (0, class_validator_1.validateSync)(dto, { whitelist: true });
            if (errors.length) {
                const msg = errors
                    .map((e) => (e.constraints ? Object.values(e.constraints).join(', ') : e.property))
                    .join('; ');
                failed.push({ index: i, error: msg || 'Validation failed' });
                continue;
            }
            try {
                await this.create(dto, createdById);
                created++;
            }
            catch (e) {
                failed.push({ index: i, error: e.message || 'Create failed' });
            }
        }
        return { created, failed, total: rows.length };
    }
};
exports.TradersService = TradersService;
exports.TradersService = TradersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        fiscal_year_service_1.FiscalYearService])
], TradersService);
//# sourceMappingURL=traders.service.js.map