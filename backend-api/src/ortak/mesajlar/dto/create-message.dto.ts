import { IsUUID, IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { MessageType } from '@prisma/client';

export class CreateMessageDto {
  @IsUUID(4, { message: 'Geçersiz talep (job) ID' })
  jobId: string;

  @IsUUID(4, { message: 'Geçersiz teklif (offer) ID' })
  offerId: string;

  @IsString({ message: 'Mesaj metni geçerli bir metin olmalıdır' })
  @IsNotEmpty({ message: 'Mesaj metni boş bırakılamaz' })
  content: string;

  @IsEnum(MessageType, { message: 'Geçersiz mesaj tipi (text, image, audio olmalıdır)' })
  @IsOptional()
  contentType?: MessageType;
}
