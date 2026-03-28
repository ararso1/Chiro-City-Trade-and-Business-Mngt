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
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
function generateLicenseNo() {
    const pad = (n, w) => String(n).padStart(w, '0');
    const t = Date.now();
    const r = Math.floor(Math.random() * 10000);
    return `LIC-${pad(t % 100000000, 8)}-${pad(r, 4)}`;
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
            status: 'application',
            qrCode: dto.qrCode ?? null,
            issuedById: dto.issuedById ?? null,
        };
        return this.prisma.license.create({
            data: data,
        });
    }
    async findAll(params) {
        const where = {};
        if (params?.businessId)
            where.businessId = params.businessId;
        if (params?.traderId)
            where.traderId = params.traderId;
        if (params?.status)
            where.status = params.status;
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
        return { items, total };
    }
    async findOne(id) {
        return this.prisma.license.findUnique({
            where: { id },
            include: {
                trader: true,
                business: { include: { trader: true } },
                issuedBy: { select: { id: true, name: true, email: true } },
            },
        });
    }
    async update(id, dto) {
        const data = { ...dto };
        if (dto.issueDate !== undefined)
            data.issueDate = dto.issueDate ? new Date(dto.issueDate) : null;
        if (dto.expiryDate !== undefined)
            data.expiryDate = dto.expiryDate ? new Date(dto.expiryDate) : null;
        return this.prisma.license.update({ where: { id }, data: data });
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