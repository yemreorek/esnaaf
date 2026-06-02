import { IsNotEmpty, IsString, Matches, IsOptional, IsBoolean } from 'class-validator';

export class SendOtpDto {
  @IsNotEmpty({ message: 'Telefon numarası boş bırakılamaz.' })
  @IsString({ message: 'Telefon numarası geçerli bir metin olmalıdır.' })
  @Matches(/^(05|5|\+90)\d{9,10}$/, { message: 'Geçersiz telefon numarası formatı.' })
  phone: string;

  @IsOptional()
  @IsBoolean({ message: 'checkOnly değeri boolean olmalıdır.' })
  checkOnly?: boolean;
}
