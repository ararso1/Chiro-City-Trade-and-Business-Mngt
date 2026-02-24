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
exports.ComplaintsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let ComplaintsService = class ComplaintsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        return this.prisma.complaint.create({
            data: { ...data, status: 'open' },
            include: { trader: { select: { fullName: true } } },
        });
    }
    async findAll(params) {
        const where = {};
        if (params?.status)
            where.status = params.status;
        if (params?.traderId)
            where.traderId = params.traderId;
        const [items, total] = await Promise.all([
            this.prisma.complaint.findMany({
                where,
                skip: params?.skip ?? 0,
                take: Math.min(params?.take ?? 50, 100),
                include: { trader: { select: { fullName: true, email: true } }, assignedTo: { select: { name: true } } },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.complaint.count({ where }),
        ]);
        return { items, total };
    }
    async findOne(id) {
        return this.prisma.complaint.findUnique({
            where: { id },
            include: { trader: true, assignedTo: true },
        });
    }
    async update(id, data) {
        return this.prisma.complaint.update({
            where: { id },
            data: data,
            include: { assignedTo: true },
        });
    }
};
exports.ComplaintsService = ComplaintsService;
exports.ComplaintsService = ComplaintsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ComplaintsService);
//# sourceMappingURL=complaints.service.js.map