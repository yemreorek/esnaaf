import { IsNotEmpty, IsString, Matches, IsOptional, IsArray, IsEmail, IsEnum } from 'class-validator';

export class RegisterProviderDto {
  @IsNotEmpty({ message: 'Telefon numarası boş bırakılamaz.' })
  @IsString({ message: 'Telefon numarası geçerli bir metin olmalıdır.' })
  @Matches(/^(05|5|\+90)\d{9,10}$/, { message: 'Geçersiz telefon numarası formatı.' })
  phone: string;

  @IsNotEmpty({ message: 'Ad Soyad boş bırakılamaz.' })
  @IsString({ message: 'Ad Soyad geçerli bir metin olmalıdır.' })
  name: string;

  @IsNotEmpty({ message: 'E-posta adresi boş bırakılamaz.' })
  @IsEmail({}, { message: 'Geçersiz e-posta adresi formatı.' })
  email: string;

  @IsNotEmpty({ message: 'Hizmet alanları boş bırakılamaz.' })
  @IsArray({ message: 'Hizmet alanları dizi (array) formatında olmalıdır.' })
  @IsString({ each: true, message: 'Her hizmet alanı UUID metni olmalıdır.' })
  categoryIds: string[];

  @IsNotEmpty({ message: 'Şehir boş bırakılamaz.' })
  @IsString({ message: 'Şehir geçerli bir metin olmalıdır.' })
  city: string;

  @IsNotEmpty({ message: 'Hizmet verilen ilçeler boş bırakılamaz.' })
  @IsArray({ message: 'İlçeler dizi (array) formatında olmalıdır.' })
  @IsString({ each: true, message: 'Her ilçe geçerli bir metin olmalıdır.' })
  districts: string[];

  @IsNotEmpty({ message: 'Şirket türü boş bırakılamaz.' })
  @IsString({ message: 'Şirket türü geçerli bir metin olmalıdır.' })
  companyType: string; // 'Şahıs' | 'Şirket'

  @IsOptional()
  @IsString({ message: 'Firma adı geçerli bir metin olmalıdır.' })
  companyName?: string;

  @IsNotEmpty({ message: 'Şifre boş bırakılamaz.' })
  @IsString({ message: 'Şifre geçerli bir metin olmalıdır.' })
  password: string;

  @IsNotEmpty({ message: 'Profil fotoğrafı boş bırakılamaz.' })
  @IsString({ message: 'Profil fotoğrafı geçerli bir URL olmalıdır.' })
  profilePhoto: string;

  @IsOptional()
  @IsArray({ message: 'Referans fotoğrafları dizi (array) formatında olmalıdır.' })
  @IsString({ each: true, message: 'Her referans fotoğrafı geçerli bir URL olmalıdır.' })
  referencePhotos?: string[];

  @IsNotEmpty({ message: 'Tanıtım yazısı boş bırakılamaz.' })
  @IsString({ message: 'Tanıtım yazısı geçerli bir metin olmalıdır.' })
  description: string;
}
