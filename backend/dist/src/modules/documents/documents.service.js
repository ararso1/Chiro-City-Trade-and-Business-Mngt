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
const path = require("path");
const fs = require("fs/promises");
const fs_1 = require("fs");
const crypto_1 = require("crypto");
const UPLOAD_ROOT = path.resolve(process.cwd(), 'uploads');
function safeBaseName(name) {
    return name.replace(/[^\w.\- ()]+/g, '_').slice(0, 120).trim() || 'document';
}
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
    async getTraderDocument(id) {
        return this.prisma.traderDocument.findUnique({
            where: { id },
            include: { trader: { select: { id: true, fullName: true, email: true } } },
        });
    }
    async getBusinessDocument(id) {
        return this.prisma.businessDocument.findUnique({
            where: { id },
            include: { business: { select: { id: true, name: true } } },
        });
    }
    async createTraderDocument(data) {
        return this.prisma.traderDocument.create({ data: data });
    }
    async createBusinessDocument(data) {
        return this.prisma.businessDocument.create({ data: data });
    }
    async uploadTraderDocument(params) {
        const traderId = params.traderId;
        const type = params.type?.trim() || 'other';
        const baseName = safeBaseName(params.name?.trim() || params.file.originalname);
        const ext = path.extname(params.file.originalname).slice(0, 12);
        const storedName = `${Date.now()}_${(0, crypto_1.randomUUID)()}${ext}`;
        const dir = path.join(UPLOAD_ROOT, 'traders', traderId);
        await fs.mkdir(dir, { recursive: true });
        const absPath = path.join(dir, storedName);
        await fs.writeFile(absPath, params.file.buffer);
        const relPath = path.relative(process.cwd(), absPath).replace(/\\/g, '/');
        return this.prisma.traderDocument.create({
            data: {
                traderId,
                name: baseName,
                type,
                filePath: relPath,
                mimeType: params.file.mimetype,
                sizeBytes: params.file.size,
            },
        });
    }
    async uploadBusinessDocument(params) {
        const businessId = params.businessId;
        const type = params.type?.trim() || 'other';
        const baseName = safeBaseName(params.name?.trim() || params.file.originalname);
        const ext = path.extname(params.file.originalname).slice(0, 12);
        const storedName = `${Date.now()}_${(0, crypto_1.randomUUID)()}${ext}`;
        const dir = path.join(UPLOAD_ROOT, 'businesses', businessId);
        await fs.mkdir(dir, { recursive: true });
        const absPath = path.join(dir, storedName);
        await fs.writeFile(absPath, params.file.buffer);
        const relPath = path.relative(process.cwd(), absPath).replace(/\\/g, '/');
        return this.prisma.businessDocument.create({
            data: {
                businessId,
                name: baseName,
                type,
                filePath: relPath,
                mimeType: params.file.mimetype,
                sizeBytes: params.file.size,
            },
        });
    }
    async streamBusinessDocumentFile(docId) {
        const doc = await this.prisma.businessDocument.findUnique({ where: { id: docId } });
        if (!doc)
            return null;
        const absPath = path.resolve(process.cwd(), doc.filePath);
        if (!(0, fs_1.existsSync)(absPath))
            return { doc, stream: null, absPath };
        return { doc, stream: (0, fs_1.createReadStream)(absPath), absPath };
    }
    async deleteBusinessDocument(docId) {
        const doc = await this.prisma.businessDocument.findUnique({ where: { id: docId } });
        if (!doc)
            return { success: false };
        const absPath = path.resolve(process.cwd(), doc.filePath);
        await this.prisma.businessDocument.delete({ where: { id: docId } });
        try {
            await fs.unlink(absPath);
        }
        catch { }
        return { success: true, id: docId };
    }
    async updateTraderDocumentMeta(id, patch) {
        const data = {};
        if (patch.name !== undefined)
            data.name = safeBaseName(patch.name);
        if (patch.type !== undefined)
            data.type = patch.type.trim() || 'other';
        return this.prisma.traderDocument.update({ where: { id }, data });
    }
    async updateBusinessDocumentMeta(id, patch) {
        const data = {};
        if (patch.name !== undefined)
            data.name = safeBaseName(patch.name);
        if (patch.type !== undefined)
            data.type = patch.type.trim() || 'other';
        return this.prisma.businessDocument.update({ where: { id }, data });
    }
    async list(params) {
        const take = Math.min(params.take ?? 50, 100);
        const skip = params.skip ?? 0;
        const q = params.query?.trim();
        if (params.scope === 'trader') {
            const where = {};
            if (params.traderId)
                where.traderId = params.traderId;
            if (params.type)
                where.type = params.type;
            if (q)
                where.name = { contains: q, mode: 'insensitive' };
            const [items, total] = await Promise.all([
                this.prisma.traderDocument.findMany({
                    where,
                    skip,
                    take,
                    include: { trader: { select: { id: true, fullName: true, email: true } } },
                    orderBy: { uploadedAt: 'desc' },
                }),
                this.prisma.traderDocument.count({ where }),
            ]);
            return { items, total };
        }
        const where = {};
        if (params.businessId)
            where.businessId = params.businessId;
        if (params.type)
            where.type = params.type;
        if (q)
            where.name = { contains: q, mode: 'insensitive' };
        const [items, total] = await Promise.all([
            this.prisma.businessDocument.findMany({
                where,
                skip,
                take,
                include: { business: { select: { id: true, name: true, traderId: true } } },
                orderBy: { uploadedAt: 'desc' },
            }),
            this.prisma.businessDocument.count({ where }),
        ]);
        return { items, total };
    }
    async streamTraderDocumentFile(docId) {
        const doc = await this.prisma.traderDocument.findUnique({ where: { id: docId } });
        if (!doc)
            return null;
        const absPath = path.resolve(process.cwd(), doc.filePath);
        if (!(0, fs_1.existsSync)(absPath))
            return { doc, stream: null, absPath };
        return { doc, stream: (0, fs_1.createReadStream)(absPath), absPath };
    }
    async deleteTraderDocument(docId) {
        const doc = await this.prisma.traderDocument.findUnique({ where: { id: docId } });
        if (!doc)
            return { success: false };
        const absPath = path.resolve(process.cwd(), doc.filePath);
        await this.prisma.traderDocument.delete({ where: { id: docId } });
        try {
            await fs.unlink(absPath);
        }
        catch { }
        return { success: true, id: docId };
    }
    async logAudit(params) {
        return this.prisma.auditLog.create({
            data: {
                userId: params.userId ?? null,
                action: params.action,
                entity: params.entity,
                entityId: params.entityId ?? null,
                oldValue: params.oldValue ?? undefined,
                newValue: params.newValue ?? undefined,
                ipAddress: params.ipAddress ?? null,
                userAgent: params.userAgent ?? null,
            },
        });
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