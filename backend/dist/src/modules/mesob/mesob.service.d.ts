import { PrismaService } from '../../prisma/prisma.service';
export declare class MesobService {
    private prisma;
    constructor(prisma: PrismaService);
    logSync(entity: string, entityId: string, direction: 'push' | 'pull', status: 'success' | 'failed', payload?: object, error?: string): Promise<{
        error: string | null;
        id: string;
        status: string;
        entity: string;
        entityId: string;
        direction: string;
        payload: import("@prisma/client/runtime/library").JsonValue | null;
        syncedAt: Date;
    }>;
    pushToMesob(entity: 'trader' | 'business', id: string): Promise<{
        synced: boolean;
        entity: "trader" | "business";
        id: string;
    }>;
}
