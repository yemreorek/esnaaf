import { IsUUID, IsOptional } from 'class-validator';

export class AddFavoriteDto {
  @IsUUID(4, { message: 'Geçerli bir hizmet veren ID\'si giriniz.' })
  @IsOptional()
  provider_id?: string;

  @IsUUID(4, { message: 'Geçerli bir hizmet veren ID\'si giriniz.' })
  @IsOptional()
  providerId?: string;
}
