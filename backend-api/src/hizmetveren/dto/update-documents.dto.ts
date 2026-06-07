import { IsString, IsOptional } from 'class-validator';

export class UpdateDocumentsDto {
  @IsString()
  @IsOptional()
  identityDocument?: string;

  @IsString()
  @IsOptional()
  taxPlateDocument?: string;
}
