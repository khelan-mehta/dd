import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Schema({ timestamps: true })
export class ApprovalRequest extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Expense', required: true })
  expenseId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  approverId: Types.ObjectId;

  @Prop({ type: String, enum: ApprovalStatus, default: ApprovalStatus.PENDING })
  status: ApprovalStatus;

  @Prop({ required: true })
  step: number;

  @Prop()
  comments: string;

  @Prop()
  processedAt: Date;
}

export const ApprovalRequestSchema = SchemaFactory.createForClass(ApprovalRequest);