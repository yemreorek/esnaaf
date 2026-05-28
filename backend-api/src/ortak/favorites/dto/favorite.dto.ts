import { IsUUID, IsNotEmpty } from 'class-validator';

export class AddFavoriteDto {
  @IsUUID(4, { message: 'Geçerli bir hizmet veren ID\'si giriniz.' })
  @IsNotEmpty({ message: 'Hizmet veren ID alanı boş bırakılamaz.' })
  provider_id: string;
}
