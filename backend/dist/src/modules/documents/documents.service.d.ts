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
    getTraderDocument(id: string): Promise<({
        trader: {
            id: string;
            email: string | null;
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
    }) | null>;
    getBusinessDocument(id: string): Promise<({
        business: {
            id: string;
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
    }) | null>;
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
    uploadTraderDocument(params: {
        traderId: string;
        name?: string;
        type: string;
        file: {
            buffer: Buffer;
            originalname: string;
            mimetype: string;
            size: number;
        };
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
    uploadBusinessDocument(params: {
        businessId: string;
        name?: string;
        type: string;
        file: {
            buffer: Buffer;
            originalname: string;
            mimetype: string;
            size: number;
        };
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
    streamBusinessDocumentFile(docId: string): Promise<{
        doc: {
            id: string;
            name: string;
            type: string;
            businessId: string;
            filePath: string;
            mimeType: string | null;
            sizeBytes: number | null;
            uploadedAt: Date;
        };
        stream: any;
        absPath: string;
    } | null>;
    deleteBusinessDocument(docId: string): Promise<{
        success: false;
        id?: undefined;
    } | {
        success: true;
        id: string;
    }>;
    updateTraderDocumentMeta(id: string, patch: {
        name?: string;
        type?: string;
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
    updateBusinessDocumentMeta(id: string, patch: {
        name?: string;
        type?: string;
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
    list(params: {
        scope: 'trader' | 'business';
        query?: string;
        type?: string;
        traderId?: string;
        businessId?: string;
        skip?: number;
        take?: number;
    }): Promise<{
        items: ({
            trader: {
                id: string;
                email: string | null;
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
        total: number;
    } | {
        items: ({
            business: {
                id: string;
                name: string;
                traderId: string;
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
        total: number;
    }>;
    streamTraderDocumentFile(docId: string): Promise<{
        doc: {
            id: string;
            name: string;
            type: string;
            traderId: string;
            filePath: string;
            mimeType: string | null;
            sizeBytes: number | null;
            uploadedAt: Date;
        };
        stream: any;
        absPath: string;
    } | null>;
    deleteTraderDocument(docId: string): Promise<{
        success: false;
        id?: undefined;
    } | {
        success: true;
        id: string;
    }>;
    logAudit(params: {
        userId?: string;
        action: string;
        entity: string;
        entityId?: string;
        oldValue?: any;
        newValue?: any;
        ipAddress?: string;
        userAgent?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        userId: string | null;
        action: string;
        entity: string;
        entityId: string | null;
        oldValue: import("@prisma/client/runtime/library").JsonValue | null;
        newValue: import("@prisma/client/runtime/library").JsonValue | null;
        ipAddress: string | null;
        userAgent: string | null;
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
