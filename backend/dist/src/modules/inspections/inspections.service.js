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
exports.InspectionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let InspectionsService = class InspectionsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        return this.prisma.inspection.create({
            data: { ...data, status: data.status ?? 'scheduled' },
            include: { business: { select: { name: true } }, inspector: { select: { name: true, email: true } } },
        });
    }
    async findAll(params) {
        const where = {};
        if (params?.businessId)
            where.businessId = params.businessId;
        if (params?.status)
            where.status = params.status;
        const [items, total] = await Promise.all([
            this.prisma.inspection.findMany({
                where,
                skip: params?.skip ?? 0,
                take: Math.min(params?.take ?? 50, 100),
                include: {
                    business: { select: { id: true, name: true, address: true } },
                    inspector: { select: { id: true, name: true } },
                    violations: true,
                },
                orderBy: { scheduledAt: 'desc' },
            }),
            this.prisma.inspection.count({ where }),
        ]);
        return { items, total };
    }
    async findOne(id) {
        return this.prisma.inspection.findUnique({
            where: { id },
            include: {
                business: { include: { trader: true } },
                inspector: true,
                violations: true,
            },
        });
    }
    async updateResult(id, data) {
        return this.prisma.inspection.update({
            where: { id },
            data: data,
            include: { violations: true },
        });
    }
    async addViolation(inspectionId, data) {
        return this.prisma.violation.create({ data: { inspectionId, ...data } });
    }
};
exports.InspectionsService = InspectionsService;
exports.InspectionsService = InspectionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InspectionsService);
//# sourceMappingURL=inspections.service.js.map