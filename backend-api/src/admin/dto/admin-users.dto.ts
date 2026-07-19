import { IsString, IsOptional, IsEnum, IsInt, Min, Max, IsEmail, IsNumber, IsBoolean, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole, StaffRole, CampaignType, PackageType } from '@prisma/client';

export enum BanReason {
  fake_profile = 'fake_profile',
  abuse = 'abuse',
  payment_issue = 'payment_issue',
  other = 'other',
}

export enum RejectReasonCode {
  R01 = 'R01',
  R02 = 'R02',
  R03 = 'R03',
  R04 = 'R04',
  R05 = 'R05',
}

export enum DisputeDecision {
  provider_correct = 'provider_correct',
  seeker_correct = 'seeker_correct',
  mutual_agreement = 'mutual_agreement',
  escalate_to_complaint = 'escalate_to_complaint',
}

export enum CallTaskResult {
  satisfied = 'satisfied',
  partial = 'partial',
  unsatisfied = 'unsatisfied',
  unreachable = 'unreachable',
}

export class UserQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  status?: string; // 'active' | 'inactive' | 'ban'

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}

export class BanUserDto {
  @IsEnum(BanReason)
  reason: BanReason;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class RejectProviderDto {
  @IsEnum(RejectReasonCode)
  reasonCode: RejectReasonCode;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateStaffDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsEmail({}, { message: 'Geçerli bir e-posta adresi giriniz.' })
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsEnum(StaffRole)
  role: StaffRole;
}

export class ResolveDisputeDto {
  @IsEnum(DisputeDecision)
  decision: DisputeDecision;

  @IsOptional()
  @IsNumber()
  resolvedAmount?: number;

  @IsString()
  resolutionNote: string;
}

export class CallTaskResultDto {
  @IsEnum(CallTaskResult)
  result: CallTaskResult;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class SaveAbTestConfigDto {
  @IsString()
  chatModel: string;

  @IsNumber()
  @Min(0)
  temperature: number;

  @IsNumber()
  @Min(0)
  splitRatio: number;
}

export class CreateCampaignDto {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsEnum(CampaignType)
  type: CampaignType;

  @IsNumber()
  value: number;

  @IsOptional()
  @IsEnum(PackageType)
  upgrade_to?: PackageType;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicable_packages?: string[];

  @IsOptional()
  @IsBoolean()
  new_users_only?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  max_uses?: number;

  @IsString()
  valid_from: string;

  @IsString()
  valid_until: string;
}

export class UpdatePackageConfigDto {
  @IsString()
  package_type: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  commission_rate: number;

  @IsInt()
  @Min(0)
  active_jobs_limit: number;

  @IsInt()
  @Min(0)
  delay_minutes: number;
}
