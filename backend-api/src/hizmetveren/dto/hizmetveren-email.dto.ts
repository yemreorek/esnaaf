import { IsNotEmpty, IsString, IsEmail, Length } from 'class-validator';

export class SendEmailCodeDto {
  @IsNotEmpty({ message: 'E-posta adresi boş bırakılamaz.' })
  @IsEmail({}, { message: 'Geçerli bir e-posta adresi giriniz.' })
  email: string;
}

export class VerifyEmailCodeDto {
  @IsNotEmpty({ message: 'E-posta adresi boş bırakılamaz.' })
  @IsEmail({}, { message: 'Geçerli bir e-posta adresi giriniz.' })
  email: string;

  @IsNotEmpty({ message: 'Doğrulama kodu boş bırakılamaz.' })
  @IsString()
  @Length(6, 6, { message: 'Doğrulama kodu 6 haneli olmalıdır.' })
  code: string;
}
