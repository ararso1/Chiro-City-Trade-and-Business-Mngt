export declare const TRADER_STATUSES: readonly ["draft", "submitted", "verified", "active", "suspended", "closed"];
export declare const LICENSE_REGISTRATION_TYPES: readonly ["new_registration", "renewal"];
export declare class CreateTraderDto {
    userId?: string;
    fullName: string;
    gender?: string;
    nationalId?: string;
    phone?: string;
    address?: string;
    tin: string;
    typeOfJob?: string;
    plateNumber?: string;
    associationType?: string;
    businessArea?: string;
    category?: string;
    licenseRegistrationType?: string;
    licenseRegistrationDate?: string;
    status?: string;
    createdById?: string;
    approvedById?: string;
    mesobRef?: string;
}
export declare class UpdateTraderDto {
    fullName?: string;
    gender?: string;
    phone?: string;
    nationalId?: string;
    address?: string;
    tin?: string;
    typeOfJob?: string;
    plateNumber?: string;
    associationType?: string;
    businessArea?: string;
    category?: string;
    licenseRegistrationType?: string;
    licenseRegistrationDate?: string;
    status?: string;
    approvedById?: string;
}
export declare class BulkImportTradersDto {
    traders: CreateTraderDto[];
}
