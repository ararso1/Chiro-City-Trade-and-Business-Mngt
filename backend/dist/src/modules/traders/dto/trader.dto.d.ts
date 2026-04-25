export declare const TRADER_STATUSES: readonly ["draft", "submitted", "verified", "active", "suspended", "closed"];
export declare class CreateTraderDto {
    userId?: string;
    fullName: string;
    gender?: string;
    dob?: string;
    phone: string;
    email: string;
    nationalId?: string;
    address?: string;
    woreda?: string;
    kebele?: string;
    photoUrl?: string;
    status?: string;
    createdById?: string;
    approvedById?: string;
    mesobRef?: string;
}
export declare class UpdateTraderDto {
    fullName?: string;
    gender?: string;
    dob?: string;
    email?: string;
    phone?: string;
    nationalId?: string;
    address?: string;
    woreda?: string;
    kebele?: string;
    photoUrl?: string;
    status?: string;
    approvedById?: string;
}
export declare class BulkImportTradersDto {
    traders: CreateTraderDto[];
}
