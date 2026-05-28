import { IsUUID, IsNumber, Min, IsString, IsOptional } from 'class-validator';

export class TamamlamaBeyanDto {
  @IsUUID(4, { message: 'Geçersiz talep (job) ID formatı.' })
  jobId: string;

  @IsNumber({}, { message: 'Ücret alanı sayısal olmalıdır.' })
  @Min(1, { message: 'Beyan edilen ücret en az 1 TL olmalıdır.' })
  price: number;

  @IsOptional()
  @IsString()
  note?: string;
}
