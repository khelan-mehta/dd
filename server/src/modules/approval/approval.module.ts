import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ApprovalController } from './approval.controller';
import { ApprovalService } from './approval.service';
import { ApprovalRule, ApprovalRuleSchema } from './entities/approval-rule.entity';
import { ApprovalRequest, ApprovalRequestSchema } from './entities/approval-request.entity';
import { Expense, ExpenseSchema } from '../expense/entities/expense.entity';
import { User, UserSchema } from '../user/entities/user.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ApprovalRule.name, schema: ApprovalRuleSchema },
      { name: ApprovalRequest.name, schema: ApprovalRequestSchema },
      { name: Expense.name, schema: ExpenseSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [ApprovalController],
  providers: [ApprovalService],
  exports: [ApprovalService],
})
export class ApprovalModule {}