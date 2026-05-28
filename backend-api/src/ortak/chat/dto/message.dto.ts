import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class MessageDto {
  @IsNotEmpty({ message: 'Mesaj boş olamaz.' })
  @IsString({ message: 'Mesaj metin formatında olmalıdır.' })
  @MaxLength(500, { message: 'Tek mesaj en fazla 500 karakter olabilir.' })
  message: string;
}
