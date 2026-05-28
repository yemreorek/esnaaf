import { IsNotEmpty, IsString, IsIn } from 'class-validator';

export class PresignedUrlDto {
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['image/png', 'image/jpeg', 'image/webp', 'application/pdf'], {
    message: 'Geçersiz dosya tipi. Yalnızca PNG, JPEG, WEBP ve PDF yüklenebilir.',
  })
  contentType: string;
}
