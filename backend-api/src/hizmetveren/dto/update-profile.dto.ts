import { IsString, IsArray, IsOptional } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  city: string;

  @IsArray()
  @IsString({ each: true })
  serviceDistricts: string[];

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

