import { DocumentsService } from './documents.service';
import type { Request, Response } from 'express';
export declare class DocumentsController {
    private documents;
    constructor(documents: DocumentsService);
    list(scope?: 'trader' | 'business', query?: string, type?: string, traderId?: string, businessId?: string, skip?: string, take?: string): Promise<{
        items: ({
            trader: {
                id: string;
                email: string;
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
    uploadTrader(traderId: string, file: any, body: {
        name?: string;
        type: string;
    }, userId?: string, req?: Request): Promise<{
        id: string;
        name: string;
        type: string;
        traderId: string;
        filePath: string;
        mimeType: string | null;
        sizeBytes: number | null;
        uploadedAt: Date;
    }>;
    downloadTraderDoc(id: string, req: Request, res: Response, userId?: string): Promise<any>;
    viewTraderDoc(id: string, req: Request, res: Response, userId?: string): Promise<any>;
    updateTraderDocMeta(id: string, body: {
        name?: string;
        type?: string;
    }, userId?: string, req?: Request): Promise<{
        id: string;
        name: string;
        type: string;
        traderId: string;
        filePath: string;
        mimeType: string | null;
        sizeBytes: number | null;
        uploadedAt: Date;
    }>;
    deleteTraderDoc(id: string, userId?: string, req?: Request): Promise<{
        success: false;
        id?: undefined;
    } | {
        success: true;
        id: string;
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
    uploadBusiness(businessId: string, file: any, body: {
        name?: string;
        type: string;
    }, userId?: string, req?: Request): Promise<{
        id: string;
        name: string;
        type: string;
        businessId: string;
        filePath: string;
        mimeType: string | null;
        sizeBytes: number | null;
        uploadedAt: Date;
    }>;
    downloadBusinessDoc(id: string, req: Request, res: Response, userId?: string): Promise<any>;
    viewBusinessDoc(id: string, req: Request, res: Response, userId?: string): Promise<any>;
    updateBusinessDocMeta(id: string, body: {
        name?: string;
        type?: string;
    }, userId?: string, req?: Request): Promise<{
        id: string;
        name: string;
        type: string;
        businessId: string;
        filePath: string;
        mimeType: string | null;
        sizeBytes: number | null;
        uploadedAt: Date;
    }>;
    deleteBusinessDoc(id: string, userId?: string, req?: Request): Promise<{
        success: false;
        id?: undefined;
    } | {
        success: true;
        id: string;
    }>;
}
