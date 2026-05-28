import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class DeclareCompletionDto {
  @IsNumber()
  @Min(1, { message: 'Beyan edilen ücret en az 1 TL olmalıdır.' })
  price: number;

  @IsOptional()
  @IsString()
  note?: string;
}
