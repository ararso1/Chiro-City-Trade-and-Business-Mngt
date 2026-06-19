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
function addOneYear(date) {
    const expiry = new Date(date);
    expiry.setFullYear(expiry.getFullYear() + 1);
    return expiry;
}
function applyLicenseRegistrationDates(data, defaultMissing = false) {
    if (defaultMissing && !data.licenseRegistrationType) {
        data.licenseRegistrationType = 'new_registration';
    }
    if (defaultMissing && !data.licenseRegistrationDate) {
        data.licenseRegistrationDate = new Date();
    }
    if (data.licenseRegistrationDate) {
        const registrationDate = new Date(data.licenseRegistrationDate);
        data.licenseRegistrationDate = registrationDate;
        data.licenseExpiryDate = addOneYear(registrationDate);
    }
}
function splitFilterValues(value) {
    return (value ?? '')
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);
}
function cleanFilterOptions(values) {
    return values.map((value) => value?.trim()).filter((value) => Boolean(value));
}
let TradersService = class TradersService {
    constructor(prisma, fiscalYear) {
        this.prisma = prisma;
        this.fiscalYear = fiscalYear;
    }
    async create(dto, createdById) {
        const data = { ...dto };
        applyLicenseRegistrationDates(data, true);
        if (dto.phone) {
            const existingPhone = await this.prisma.trader.findFirst({ where: { phone: dto.phone } });
            if (existingPhone)
                throw new common_1.BadRequestException('Phone number already exists');
        }
        const existingTin = await this.prisma.trader.findFirst({ where: { tin: dto.tin } });
        if (existingTin)
            throw new common_1.BadRequestException('TIN already exists');
        if (createdById)
            data.createdById = createdById;
        data.status = 'submitted';
        return this.prisma.trader.create({ data });
    }
    async findAll(params) {
        const where = {};
        if (params?.status)
            where.status = params.status;
        const typeOfJobValues = splitFilterValues(params?.typeOfJob);
        const categoryValues = splitFilterValues(params?.category);
        const addressValues = splitFilterValues(params?.address);
        if (typeOfJobValues.length)
            where.typeOfJob = { in: typeOfJobValues };
        if (categoryValues.length)
            where.category = { in: categoryValues };
        if (addressValues.length)
            where.address = { in: addressValues };
        if (params?.licenseState === 'paused')
            where.status = 'suspended';
        if (params?.licenseState === 'expired')
            where.licenseExpiryDate = { lt: new Date() };
        if (params?.licenseState === 'renewed_this_year') {
            const startOfYear = new Date(new Date().getFullYear(), 0, 1);
            const startOfNextYear = new Date(new Date().getFullYear() + 1, 0, 1);
            where.licenseRegistrationType = 'renewal';
            where.licenseRegistrationDate = { gte: startOfYear, lt: startOfNextYear };
        }
        if (params?.search) {
            where.OR = [
                { fullName: { contains: params.search, mode: 'insensitive' } },
                { tin: { contains: params.search, mode: 'insensitive' } },
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
    async getFilterOptions() {
        const [typeOfJobRows, categoryRows, addressRows] = await Promise.all([
            this.prisma.trader.findMany({
                where: { typeOfJob: { not: null } },
                distinct: ['typeOfJob'],
                select: { typeOfJob: true },
                orderBy: { typeOfJob: 'asc' },
            }),
            this.prisma.trader.findMany({
                where: { category: { not: null } },
                distinct: ['category'],
                select: { category: true },
                orderBy: { category: 'asc' },
            }),
            this.prisma.trader.findMany({
                where: { address: { not: null } },
                distinct: ['address'],
                select: { address: true },
                orderBy: { address: 'asc' },
            }),
        ]);
        return {
            typeOfJobs: cleanFilterOptions(typeOfJobRows.map((r) => r.typeOfJob)),
            categories: cleanFilterOptions(categoryRows.map((r) => r.category)),
            addresses: cleanFilterOptions(addressRows.map((r) => r.address)),
        };
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
                        documents: true,
                    },
                },
                documents: true,
            },
        });
    }
    async update(id, dto) {
        const data = { ...dto };
        applyLicenseRegistrationDates(data);
        if (dto.phone) {
            const existingPhone = await this.prisma.trader.findFirst({ where: { phone: dto.phone, NOT: { id } } });
            if (existingPhone)
                throw new common_1.BadRequestException('Phone number already exists');
        }
        if (dto.tin) {
            const existingTin = await this.prisma.trader.findFirst({ where: { tin: dto.tin, NOT: { id } } });
            if (existingTin)
                throw new common_1.BadRequestException('TIN already exists');
        }
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