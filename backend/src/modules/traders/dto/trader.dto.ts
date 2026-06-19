import { Type } from 'class-transformer';
import { IsString, IsOptional, IsArray, ArrayMinSize, ArrayMaxSize, ValidateNested, IsIn, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const TRADER_STATUSES = ['draft', 'submitted', 'verified', 'active', 'suspended', 'closed'] as const;
export const LICENSE_REGISTRATION_TYPES = ['new_registration', 'renewal'] as const;

export class CreateTraderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;

  @IsString()
  fullName: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nationalId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @IsString()
  tin: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  typeOfJob?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  plateNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  associationType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  businessArea?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ enum: LICENSE_REGISTRATION_TYPES })
  @IsOptional()
  @IsIn(LICENSE_REGISTRATION_TYPES)
  licenseRegistrationType?: string;

  @ApiPropertyOptional({ description: 'Registration or renewal date used to calculate annual expiry.' })
  @IsOptional()
  @IsDateString()
  licenseRegistrationDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  createdById?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  approvedById?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mesobRef?: string;
}

export class UpdateTraderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nationalId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tin?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  typeOfJob?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  plateNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  associationType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  businessArea?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ enum: LICENSE_REGISTRATION_TYPES })
  @IsOptional()
  @IsIn(LICENSE_REGISTRATION_TYPES)
  licenseRegistrationType?: string;

  @ApiPropertyOptional({ description: 'Registration or renewal date used to calculate annual expiry.' })
  @IsOptional()
  @IsDateString()
  licenseRegistrationDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  approvedById?: string;
}

export class BulkImportTradersDto {
  @ApiProperty({ type: [CreateTraderDto], description: 'Up to 500 trader rows (same fields as create).' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => CreateTraderDto)
  traders: CreateTraderDto[];
}
