import { IsUUID, IsInt, Min, Max, IsString, IsOptional, IsUrl } from 'class-validator';

export class CreateReviewDto {
  @IsUUID()
  job_id: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsOptional()
  comment?: string;

  @IsString()
  @IsOptional()
  document_url?: string;
}
