import { PrismaService } from '../../prisma/prisma.service';
export declare class DocumentsService {
    private prisma;
    constructor(prisma: PrismaService);
    findTraderDocuments(traderId: string): Promise<{
        id: string;
        name: string;
        type: string;
        traderId: string;
        filePath: string;
        mimeType: string | null;
        sizeBytes: number | null;
        uploadedAt: Date;
    }[]>;
    findBusinessDocuments(businessId: string): Promise<{
        id: string;
        name: string;
        type: string;
        businessId: string;
        filePath: string;
        mimeType: string | null;
        sizeBytes: number | null;
        uploadedAt: Date;
    }[]>;
    createTraderDocument(data: {
        traderId: string;
        name: string;
        type: string;
        filePath: string;
        mimeType?: string;
        sizeBytes?: number;
    }): Promise<{
        id: string;
        name: string;
        type: string;
        traderId: string;
        filePath: string;
        mimeType: string | null;
        sizeBytes: number | null;
        uploadedAt: Date;
    }>;
    createBusinessDocument(data: {
        businessId: string;
        name: string;
        type: string;
        filePath: string;
        mimeType?: string;
        sizeBytes?: number;
    }): Promise<{
        id: string;
        name: string;
        type: string;
        businessId: string;
        filePath: string;
        mimeType: string | null;
        sizeBytes: number | null;
        uploadedAt: Date;
    }>;
    search(params: {
        query?: string;
        type?: string;
    }): Promise<{
        traderDocuments: ({
            trader: {
                fullName: string;
            };
        } & {
            id: string;
            name: string;
            type: string;
            traderId: string;
            filePath: string;
            mimeType: string | null;
            sizeBytes: number | null;
            uploadedAt: Date;
        })[];
        businessDocuments: ({
            business: {
                name: string;
            };
        } & {
            id: string;
            name: string;
            type: string;
            businessId: string;
            filePath: string;
            mimeType: string | null;
            sizeBytes: number | null;
            uploadedAt: Date;
        })[];
    }>;
}
