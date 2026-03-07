export declare const BUSINESS_STATUSES: readonly ["draft", "pending", "active", "suspended", "closed"];
export declare class CreateBusinessDto {
    traderId: string;
    name: string;
    tradeName?: string;
    category: string;
    type?: string;
    subCategory?: string;
    address?: string;
    woreda?: string;
    kebele?: string;
    shopNo?: string;
    startDate?: string;
    phone?: string;
    email?: string;
    tin?: string;
    status?: string;
    mesobRef?: string;
}
export declare class UpdateBusinessDto {
    name?: string;
    tradeName?: string;
    category?: string;
    type?: string;
    subCategory?: string;
    address?: string;
    woreda?: string;
    kebele?: string;
    shopNo?: string;
    startDate?: string;
    phone?: string;
    email?: string;
    tin?: string;
    status?: string;
}
