import { IsString, IsEnum, IsNumber, IsArray, IsOptional, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ApprovalRuleType } from '../entities/approval-rule.entity';
import { ApprovalStatus } from '../entities/approval-request.entity';

class ApproverDto {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty()
  @IsNumber()
  step: number;
}

export class CreateApprovalRuleDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: ApprovalRuleType })
  @IsEnum(ApprovalRuleType)
  type: ApprovalRuleType;

  @ApiProperty({ type: [ApproverDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApproverDto)
  approvers: ApproverDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  approvalPercentage?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  specificApproverId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  minAmount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  maxAmount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ProcessApprovalDto {
  @ApiProperty({ enum: ApprovalStatus })
  @IsEnum(ApprovalStatus)
  status: ApprovalStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  comments?: string;
}