import { IsBoolean, IsOptional, IsNumber, IsString, Min } from 'class-validator';

export class ConfirmCompletionDto {
  @IsBoolean()
  confirmed: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Ödenen ücret negatif olamaz.' })
  declaredAmount?: number;

  @IsOptional()
  @IsString()
  note?: string;
}
