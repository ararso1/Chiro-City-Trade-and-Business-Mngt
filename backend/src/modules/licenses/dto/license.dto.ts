import { IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLicenseDto {
  @IsString()
  businessId: string;

  @IsString()
  licenseType: string;

  @IsString()
  licenseNumber: string;

  @IsDateString()
  issuedAt: string;

  @IsDateString()
  expiresAt: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  issuedBy?: string;
}

export class UpdateLicenseDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}
