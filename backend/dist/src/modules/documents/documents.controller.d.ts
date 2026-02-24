import { DocumentsService } from './documents.service';
export declare class DocumentsController {
    private documents;
    constructor(documents: DocumentsService);
    search(query?: string, type?: string): Promise<{
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
    getTraderDocuments(traderId: string): Promise<{
        id: string;
        name: string;
        type: string;
        traderId: string;
        filePath: string;
        mimeType: string | null;
        sizeBytes: number | null;
        uploadedAt: Date;
    }[]>;
    getBusinessDocuments(businessId: string): Promise<{
        id: string;
        name: string;
        type: string;
        businessId: string;
        filePath: string;
        mimeType: string | null;
        sizeBytes: number | null;
        uploadedAt: Date;
    }[]>;
    createTraderDocument(body: {
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
    createBusinessDocument(body: {
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
}
