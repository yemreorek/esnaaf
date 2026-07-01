import { IsEnum, IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { PackageType } from '@prisma/client';

export class AbonelikBaslatDto {
  @IsEnum(PackageType, { message: 'Geçersiz paket tipi.' })
  @IsNotEmpty({ message: 'Paket tipi gereklidir.' })
  packageType: PackageType;

  @IsString()
  @IsOptional()
  campaignCode?: string;
}

export class KampanyaDogrulaDto {
  @IsString()
  @IsNotEmpty({ message: 'Kampanya kodu gereklidir.' })
  code: string;

  @IsEnum(PackageType, { message: 'Geçersiz paket tipi.' })
  @IsNotEmpty({ message: 'Paket tipi gereklidir.' })
  packageType: PackageType;
}
export class AddCardDto {
  @IsString()
  @IsNotEmpty({ message: 'Kart sahibinin adı soyadı gereklidir.' })
  cardHolderName: string;

  @IsString()
  @IsNotEmpty({ message: 'Kart numarası gereklidir.' })
  cardNumber: string;

  @IsString()
  @IsNotEmpty({ message: 'Son kullanma ayı gereklidir.' })
  expireMonth: string;

  @IsString()
  @IsNotEmpty({ message: 'Son kullanma yılı gereklidir.' })
  expireYear: string;
}
