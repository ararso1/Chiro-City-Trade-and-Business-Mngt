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
exports.DocumentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let DocumentsService = class DocumentsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findTraderDocuments(traderId) {
        return this.prisma.traderDocument.findMany({
            where: { traderId },
            orderBy: { uploadedAt: 'desc' },
        });
    }
    async findBusinessDocuments(businessId) {
        return this.prisma.businessDocument.findMany({
            where: { businessId },
            orderBy: { uploadedAt: 'desc' },
        });
    }
    async createTraderDocument(data) {
        return this.prisma.traderDocument.create({ data: data });
    }
    async createBusinessDocument(data) {
        return this.prisma.businessDocument.create({ data: data });
    }
    async search(params) {
        const where = {};
        if (params.type) {
            const traderDocs = await this.prisma.traderDocument.findMany({
                where: { type: params.type, ...(params.query ? { name: { contains: params.query, mode: 'insensitive' } } : {}) },
                include: { trader: { select: { fullName: true, email: true } } },
            });
            const businessDocs = await this.prisma.businessDocument.findMany({
                where: { type: params.type, ...(params.query ? { name: { contains: params.query, mode: 'insensitive' } } : {}) },
                include: { business: { select: { name: true } } },
            });
            return { traderDocuments: traderDocs, businessDocuments: businessDocs };
        }
        if (params.query) {
            const [traderDocs, businessDocs] = await Promise.all([
                this.prisma.traderDocument.findMany({
                    where: { name: { contains: params.query, mode: 'insensitive' } },
                    include: { trader: { select: { fullName: true } } },
                }),
                this.prisma.businessDocument.findMany({
                    where: { name: { contains: params.query, mode: 'insensitive' } },
                    include: { business: { select: { name: true } } },
                }),
            ]);
            return { traderDocuments: traderDocs, businessDocuments: businessDocs };
        }
        return { traderDocuments: [], businessDocuments: [] };
    }
};
exports.DocumentsService = DocumentsService;
exports.DocumentsService = DocumentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DocumentsService);
//# sourceMappingURL=documents.service.js.map