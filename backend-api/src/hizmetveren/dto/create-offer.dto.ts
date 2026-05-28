import { IsUUID, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateOfferDto {
  @IsUUID(4, { message: 'Geçersiz talep (job) ID' })
  jobId: string;

  @IsNumber({}, { message: 'Fiyat bir sayı olmalıdır' })
  @Min(1, { message: 'Teklif fiyatı en az 1 TL olmalıdır' })
  price: number;

  @IsString({ message: 'Mesaj metni geçerli bir metin olmalıdır' })
  @IsOptional()
  message?: string;
}
