import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsArray,
  ArrayUnique,
  ArrayMinSize,
  MinLength,
  MaxLength,
} from "class-validator";
export class CreateUserDto {
  @IsString() @MinLength(1) @MaxLength(200) name!: string;
  @IsEmail() email!: string;
  @IsString() @MinLength(8) @MaxLength(256) password!: string;
  @IsOptional() @IsString() phone?: string;
  @IsArray()
  @ArrayUnique()
  @ArrayMinSize(1)
  @IsString({ each: true })
  roleNames!: string[];
  @IsOptional() @IsBoolean() isActive?: boolean;
}
export class UpdateUserDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(200) name?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMinSize(1)
  @IsString({ each: true })
  roleNames?: string[];
  @IsOptional() @IsBoolean() isActive?: boolean;
}
export class CreateRoleDto {
  @IsString() @MinLength(1) @MaxLength(64) name!: string;
  @IsOptional() @IsString() @MaxLength(1000) description?: string;
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  permissionIds?: string[];
}
export class UpdateRoleDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() @MaxLength(1000) description?: string;
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  permissionIds?: string[];
}
