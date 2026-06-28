import { IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export const LICENSE_STATUSES = ['Active', 'Expired', 'Expiring Soon', 'Suspended'] as const;

export class CreateLicenseDto {
  @IsString()
  businessId: string;

  @IsString()
  traderId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  licenseNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  licenseType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  qrCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  issuedById?: string;
}

export class UpdateLicenseDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  licenseNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  licenseType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  qrCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  issuedById?: string;
}
