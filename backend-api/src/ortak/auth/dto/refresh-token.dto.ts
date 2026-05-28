import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsNotEmpty({ message: 'Refresh token boş bırakılamaz.' })
  @IsString({ message: 'Refresh token geçerli bir metin olmalıdır.' })
  refreshToken: string;
}
