export declare const LICENSE_STATUSES: readonly ["application", "review", "approval", "issued", "renew", "expired"];
export declare class CreateLicenseDto {
    businessId: string;
    traderId: string;
    licenseNo?: string;
    licenseType?: string;
    issueDate?: string;
    expiryDate?: string;
    status?: string;
    qrCode?: string;
    issuedById?: string;
}
export declare class UpdateLicenseDto {
    licenseNo?: string;
    licenseType?: string;
    issueDate?: string;
    expiryDate?: string;
    status?: string;
    qrCode?: string;
    issuedById?: string;
}
