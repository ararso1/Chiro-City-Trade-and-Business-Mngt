import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as path from 'path';
import * as fs from 'fs/promises';
import { createReadStream, existsSync } from 'fs';
import { randomUUID } from 'crypto';

const UPLOAD_ROOT = path.resolve(process.cwd(), 'uploads');

function safeBaseName(name: string) {
  return name.replace(/[^\w.\- ()]+/g, '_').slice(0, 120).trim() || 'document';
}

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  async findTraderDocuments(traderId: string) {
    return this.prisma.traderDocument.findMany({
      where: { traderId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async findBusinessDocuments(businessId: string) {
    return this.prisma.businessDocument.findMany({
      where: { businessId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async getTraderDocument(id: string) {
    return this.prisma.traderDocument.findUnique({
      where: { id },
      include: { trader: { select: { id: true, fullName: true, email: true } } },
    });
  }

  async getBusinessDocument(id: string) {
    return this.prisma.businessDocument.findUnique({
      where: { id },
      include: { business: { select: { id: true, name: true } } },
    });
  }

  async createTraderDocument(data: {
    traderId: string;
    name: string;
    type: string;
    filePath: string;
    mimeType?: string;
    sizeBytes?: number;
  }) {
    return this.prisma.traderDocument.create({ data: data as any });
  }

  async createBusinessDocument(data: {
    businessId: string;
    name: string;
    type: string;
    filePath: string;
    mimeType?: string;
    sizeBytes?: number;
  }) {
    return this.prisma.businessDocument.create({ data: data as any });
  }

  async uploadTraderDocument(params: {
    traderId: string;
    name?: string;
    type: string;
    file: { buffer: Buffer; originalname: string; mimetype: string; size: number };
  }) {
    const traderId = params.traderId;
    const type = params.type?.trim() || 'other';
    const baseName = safeBaseName(params.name?.trim() || params.file.originalname);
    const ext = path.extname(params.file.originalname).slice(0, 12);
    const storedName = `${Date.now()}_${randomUUID()}${ext}`;

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
      } as any,
    });
  }

  async uploadBusinessDocument(params: {
    businessId: string;
    name?: string;
    type: string;
    file: { buffer: Buffer; originalname: string; mimetype: string; size: number };
  }) {
    const businessId = params.businessId;
    const type = params.type?.trim() || 'other';
    const baseName = safeBaseName(params.name?.trim() || params.file.originalname);
    const ext = path.extname(params.file.originalname).slice(0, 12);
    const storedName = `${Date.now()}_${randomUUID()}${ext}`;

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
      } as any,
    });
  }

  async streamBusinessDocumentFile(docId: string) {
    const doc = await this.prisma.businessDocument.findUnique({ where: { id: docId } });
    if (!doc) return null;
    const absPath = path.resolve(process.cwd(), doc.filePath);
    if (!existsSync(absPath)) return { doc, stream: null as any, absPath };
    return { doc, stream: createReadStream(absPath), absPath };
  }

  async deleteBusinessDocument(docId: string) {
    const doc = await this.prisma.businessDocument.findUnique({ where: { id: docId } });
    if (!doc) return { success: false as const };
    const absPath = path.resolve(process.cwd(), doc.filePath);
    await this.prisma.businessDocument.delete({ where: { id: docId } });
    try {
      await fs.unlink(absPath);
    } catch {}
    return { success: true as const, id: docId };
  }

  async updateTraderDocumentMeta(id: string, patch: { name?: string; type?: string }) {
    const data: any = {};
    if (patch.name !== undefined) data.name = safeBaseName(patch.name);
    if (patch.type !== undefined) data.type = patch.type.trim() || 'other';
    return this.prisma.traderDocument.update({ where: { id }, data });
  }

  async updateBusinessDocumentMeta(id: string, patch: { name?: string; type?: string }) {
    const data: any = {};
    if (patch.name !== undefined) data.name = safeBaseName(patch.name);
    if (patch.type !== undefined) data.type = patch.type.trim() || 'other';
    return this.prisma.businessDocument.update({ where: { id }, data });
  }

  async list(params: {
    scope: 'trader' | 'business';
    query?: string;
    type?: string;
    traderId?: string;
    businessId?: string;
    skip?: number;
    take?: number;
  }) {
    const take = Math.min(params.take ?? 50, 100);
    const skip = params.skip ?? 0;
    const q = params.query?.trim();
    if (params.scope === 'trader') {
      const where: any = {};
      if (params.traderId) where.traderId = params.traderId;
      if (params.type) where.type = params.type;
      if (q) where.name = { contains: q, mode: 'insensitive' };
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
    const where: any = {};
    if (params.businessId) where.businessId = params.businessId;
    if (params.type) where.type = params.type;
    if (q) where.name = { contains: q, mode: 'insensitive' };
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

  async streamTraderDocumentFile(docId: string) {
    const doc = await this.prisma.traderDocument.findUnique({ where: { id: docId } });
    if (!doc) return null;
    const absPath = path.resolve(process.cwd(), doc.filePath);
    if (!existsSync(absPath)) return { doc, stream: null as any, absPath };
    return { doc, stream: createReadStream(absPath), absPath };
  }

  async deleteTraderDocument(docId: string) {
    const doc = await this.prisma.traderDocument.findUnique({ where: { id: docId } });
    if (!doc) return { success: false as const };
    const absPath = path.resolve(process.cwd(), doc.filePath);
    await this.prisma.traderDocument.delete({ where: { id: docId } });
    // best-effort file delete
    try {
      await fs.unlink(absPath);
    } catch {}
    return { success: true as const, id: docId };
  }

  async logAudit(params: {
    userId?: string;
    action: string;
    entity: string;
    entityId?: string;
    oldValue?: any;
    newValue?: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
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
      } as any,
    });
  }

  async search(params: { query?: string; type?: string }) {
    const where: any = {};
    if (params.type) {
      // Search both trader and business docs by type
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
}
