import { IsNotEmpty, IsString, Length, Matches, IsOptional } from 'class-validator';

export class VerifyOtpDto {
  @IsNotEmpty({ message: 'Telefon numarası boş bırakılamaz.' })
  @IsString({ message: 'Telefon numarası geçerli bir metin olmalıdır.' })
  @Matches(/^(05|5|\+90)\d{9,10}$/, { message: 'Geçersiz telefon numarası formatı.' })
  phone: string;

  @IsNotEmpty({ message: 'OTP kodu boş bırakılamaz.' })
  @IsString({ message: 'OTP kodu geçerli bir metin olmalıdır.' })
  @Length(6, 6, { message: 'OTP kodu 6 haneli olmalıdır.' })
  code: string;

  @IsOptional()
  @IsString()
  role?: string;
}
