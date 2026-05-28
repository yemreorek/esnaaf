import { IsString, IsArray } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  city: string;

  @IsArray()
  @IsString({ each: true })
  serviceDistricts: string[];
}
