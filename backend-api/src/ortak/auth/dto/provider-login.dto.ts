import { IsNotEmpty, IsString } from 'class-validator';

export class ProviderLoginDto {
  @IsNotEmpty({ message: 'Giriş bilgisi boş bırakılamaz.' })
  @IsString({ message: 'Giriş bilgisi geçerli bir metin olmalıdır.' })
  phone: string;

  @IsNotEmpty({ message: 'Şifre boş bırakılamaz.' })
  @IsString({ message: 'Şifre geçerli bir metin olmalıdır.' })
  password: string;
}
