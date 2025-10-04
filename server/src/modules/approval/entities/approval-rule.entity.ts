import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum ApprovalRuleType {
  SEQUENTIAL = 'sequential',
  PERCENTAGE = 'percentage',
  SPECIFIC_APPROVER = 'specific_approver',
  HYBRID = 'hybrid',
}

@Schema({ timestamps: true })
export class ApprovalRule extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  companyId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ type: String, enum: ApprovalRuleType, required: true })
  type: ApprovalRuleType;

  @Prop({ type: Array, required: true })
  approvers: Array<{ userId: string; step: number }>;

  @Prop()
  approvalPercentage: number;

  @Prop({ type: Types.ObjectId })
  specificApproverId: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  minAmount: number;

  @Prop()
  maxAmount: number;
}

export const ApprovalRuleSchema = SchemaFactory.createForClass(ApprovalRule);