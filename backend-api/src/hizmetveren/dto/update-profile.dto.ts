import { IsString, IsArray, IsOptional, IsEmail, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  city: string;

  @IsArray()
  @IsString({ each: true })
  serviceDistricts: string[];

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Geçerli bir e-posta adresi giriniz.' })
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Şifre en az 6 karakter uzunluğunda olmalıdır.' })
  password?: string;
}

