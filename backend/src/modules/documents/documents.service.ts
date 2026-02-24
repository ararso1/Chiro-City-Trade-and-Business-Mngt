import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

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
