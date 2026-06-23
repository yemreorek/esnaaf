import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateTalepDto {
  @IsString()
  @IsNotEmpty({ message: 'Kategori slug boş olamaz.' })
  categorySlug: string;

  @IsString()
  @IsNotEmpty({ message: 'İlçe boş olamaz.' })
  district: string;

  @IsString()
  @IsNotEmpty({ message: 'Açıklama boş olamaz.' })
  details: string;

  @IsString()
  @IsNotEmpty({ message: 'Ad soyad boş olamaz.' })
  name: string;

  @IsOptional()
  @IsBoolean({ message: 'sendToFavoritesOnly parametresi boolean olmalıdır.' })
  sendToFavoritesOnly?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'isDirect parametresi boolean olmalıdır.' })
  isDirect?: boolean;

  @IsOptional()
  @IsString({ message: 'directProviderId parametresi string olmalıdır.' })
  directProviderId?: string;
}

