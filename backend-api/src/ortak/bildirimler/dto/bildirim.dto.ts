import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class FcmTokenKaydetDto {
  @IsNotEmpty()
  @IsString()
  token: string;
}

export class NpsRespondDto {
  @IsNotEmpty()
  @IsUUID()
  jobCompletionId: string;

  @IsInt()
  @Min(0, { message: 'NPS puanı en az 0 olabilir.' })
  @Max(10, { message: 'NPS puanı en fazla 10 olabilir.' })
  score: number;

  @IsOptional()
  @IsString()
  followUpText?: string;
}
