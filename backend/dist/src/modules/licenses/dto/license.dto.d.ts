export declare class CreateLicenseDto {
    businessId: string;
    licenseType: string;
    licenseNumber: string;
    issuedAt: string;
    expiresAt: string;
    status?: string;
    issuedBy?: string;
}
export declare class UpdateLicenseDto {
    expiresAt?: string;
    status?: string;
}
