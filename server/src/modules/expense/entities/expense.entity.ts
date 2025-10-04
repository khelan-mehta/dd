import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum ExpenseStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  IN_PROGRESS = 'in_progress',
}

export enum ExpenseCategory {
  TRAVEL = 'travel',
  FOOD = 'food',
  ACCOMMODATION = 'accommodation',
  TRANSPORTATION = 'transportation',
  OFFICE_SUPPLIES = 'office_supplies',
  ENTERTAINMENT = 'entertainment',
  OTHER = 'other',
}

@Schema({ timestamps: true })
export class Expense extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  employeeId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  companyId: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  currency: string;

  @Prop()
  convertedAmount: number;

  @Prop({ type: String, enum: ExpenseCategory, required: true })
  category: ExpenseCategory;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  expenseDate: Date;

  @Prop()
  receiptUrl: string;

  @Prop()
  merchantName: string;

  @Prop({ type: Object })
  expenseLines: any;

  @Prop({ type: String, enum: ExpenseStatus, default: ExpenseStatus.PENDING })
  status: ExpenseStatus;

  @Prop({ default: 0 })
  currentApprovalStep: number;
}

export const ExpenseSchema = SchemaFactory.createForClass(Expense);