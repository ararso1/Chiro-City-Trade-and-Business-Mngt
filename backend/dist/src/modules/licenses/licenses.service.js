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
exports.LicensesService = void 0;
exports.getLicenseLifecycleStatus = getLicenseLifecycleStatus;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
function generateLicenseNo() {
    const pad = (n, w) => String(n).padStart(w, '0');
    const t = Date.now();
    const r = Math.floor(Math.random() * 10000);
    return `LIC-${pad(t % 100000000, 8)}-${pad(r, 4)}`;
}
function renewalDatesForYear(year) {
    return {
        issueDate: new Date(Date.UTC(year, 0, 1)),
        expiryDate: new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999)),
    };
}
function getLicenseLifecycleStatus(license) {
    const rawStatus = String(license.status ?? '').toLowerCase();
    if (rawStatus === 'suspended')
        return 'Suspended';
    if (!license.expiryDate)
        return rawStatus === 'active' || rawStatus === 'issued' ? 'Active' : 'Expired';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiryDate = new Date(license.expiryDate);
    expiryDate.setHours(0, 0, 0, 0);
    if (expiryDate < today)
        return 'Expired';
    const daysRemaining = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysRemaining <= 30)
        return 'Expiring Soon';
    return 'Active';
}
function withLifecycleStatus(license) {
    return { ...license, status: getLicenseLifecycleStatus(license) };
}
function licenseStatusWhere(status) {
    const normalized = String(status ?? '').toLowerCase();
    if (!normalized)
        return undefined;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const soon = new Date(today);
    soon.setDate(soon.getDate() + 30);
    const suspendedStatus = { in: ['suspended', 'Suspended'] };
    const notSuspended = { NOT: { status: suspendedStatus } };
    if (normalized === 'suspended')
        return { status: suspendedStatus };
    if (normalized === 'expired')
        return { expiryDate: { lt: today }, ...notSuspended };
    if (normalized === 'expiring_soon' || normalized === 'expiring soon') {
        return { expiryDate: { gte: today, lte: soon }, ...notSuspended };
    }
    if (normalized === 'active') {
        return {
            ...notSuspended,
            OR: [{ expiryDate: null }, { expiryDate: { gt: soon } }],
        };
    }
    return { status };
}
let LicensesService = class LicensesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        const licenseNo = dto.licenseNo?.trim() || generateLicenseNo();
        const data = {
            licenseNo,
            traderId: dto.traderId,
            businessId: dto.businessId,
            licenseType: dto.licenseType ?? null,
            issueDate: dto.issueDate ? new Date(dto.issueDate) : null,
            expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
            status: dto.status ?? 'Active',
            qrCode: dto.qrCode ?? null,
            issuedById: dto.issuedById ?? null,
        };
        const license = await this.prisma.license.create({
            data: data,
        });
        return withLifecycleStatus(license);
    }
    async findAll(params) {
        const where = {};
        if (params?.businessId)
            where.businessId = params.businessId;
        if (params?.traderId)
            where.traderId = params.traderId;
        if (params?.status)
            Object.assign(where, licenseStatusWhere(params.status));
        const [items, total] = await Promise.all([
            this.prisma.license.findMany({
                where,
                skip: params?.skip ?? 0,
                take: Math.min(params?.take ?? 50, 100),
                include: {
                    trader: { select: { id: true, fullName: true, email: true } },
                    business: { select: { id: true, name: true } },
                    issuedBy: { select: { id: true, name: true, email: true } },
                },
                orderBy: [{ status: 'asc' }, { expiryDate: 'asc' }],
            }),
            this.prisma.license.count({ where }),
        ]);
        return { items: items.map(withLifecycleStatus), total };
    }
    async findOne(id) {
        const license = await this.prisma.license.findUnique({
            where: { id },
            include: {
                trader: true,
                business: { include: { trader: true } },
                issuedBy: { select: { id: true, name: true, email: true } },
            },
        });
        return license ? withLifecycleStatus(license) : null;
    }
    async update(id, dto) {
        const data = { ...dto };
        if (dto.issueDate !== undefined)
            data.issueDate = dto.issueDate ? new Date(dto.issueDate) : null;
        if (dto.expiryDate !== undefined)
            data.expiryDate = dto.expiryDate ? new Date(dto.expiryDate) : null;
        const license = await this.prisma.license.update({ where: { id }, data: data });
        return withLifecycleStatus(license);
    }
    async renew(id, year, issuedById) {
        if (!Number.isInteger(year) || year < 1900 || year > 2200) {
            throw new common_1.BadRequestException('Invalid renewal year');
        }
        const { issueDate, expiryDate } = renewalDatesForYear(year);
        const license = await this.prisma.license.update({
            where: { id },
            data: {
                issueDate,
                expiryDate,
                status: 'Active',
                ...(issuedById ? { issuedById } : {}),
            },
        });
        return withLifecycleStatus(license);
    }
    async remove(id) {
        await this.prisma.license.delete({ where: { id } });
        return { success: true, id };
    }
};
exports.LicensesService = LicensesService;
exports.LicensesService = LicensesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LicensesService);
//# sourceMappingURL=licenses.service.js.map