import { IsUUID, IsBoolean, IsNumber, IsOptional, Min, IsString } from 'class-validator';

export class TamamlamaOnayDto {
  @IsUUID(4, { message: 'Geçersiz talep (job) ID formatı.' })
  jobId: string;

  @IsBoolean({ message: 'Onay/red kararı boolean olmalıdır.' })
  confirmed: boolean;

  @IsOptional()
  @IsNumber({}, { message: 'Ödenen gerçek tutar sayısal olmalıdır.' })
  @Min(0, { message: 'Ödenen tutar en az 0 TL olmalıdır.' })
  declaredAmount?: number;

  @IsOptional()
  @IsString()
  note?: string;
}
