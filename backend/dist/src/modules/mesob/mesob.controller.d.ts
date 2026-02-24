import { MesobService } from './mesob.service';
export declare class MesobController {
    private mesob;
    constructor(mesob: MesobService);
    pushTrader(id: string): Promise<{
        synced: boolean;
        entity: "trader" | "business";
        id: string;
    }>;
    pushBusiness(id: string): Promise<{
        synced: boolean;
        entity: "trader" | "business";
        id: string;
    }>;
}
