import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ApprovalRule,
  ApprovalRuleType,
} from './entities/approval-rule.entity';
import {
  ApprovalRequest,
  ApprovalStatus,
} from './entities/approval-request.entity';
import { Expense, ExpenseStatus } from '../expense/entities/expense.entity';
import { User } from '../user/entities/user.entity';
import { CreateApprovalRuleDto, ProcessApprovalDto } from './dto/approval.dto';

@Injectable()
export class ApprovalService {
  constructor(
    @InjectModel(ApprovalRule.name) private ruleModel: Model<ApprovalRule>,
    @InjectModel(ApprovalRequest.name)
    private requestModel: Model<ApprovalRequest>,
    @InjectModel(Expense.name) private expenseModel: Model<Expense>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async createApprovalRule(dto: CreateApprovalRuleDto, companyId: string) {
    if (!Types.ObjectId.isValid(companyId)) {
      throw new BadRequestException('Invalid company ID format');
    }

    const rule = await this.ruleModel.create({
      ...dto,
      companyId: new Types.ObjectId(companyId),
    });
    return rule;
  }

  async getApprovalRules(companyId: string) {
    if (!Types.ObjectId.isValid(companyId)) {
      throw new BadRequestException('Invalid company ID format');
    }

    return this.ruleModel
      .find({ companyId: new Types.ObjectId(companyId), isActive: true })
      .sort({ minAmount: 1 })
      .exec();
  }

  async updateApprovalRule(id: string, dto: CreateApprovalRuleDto) {
    const rule = await this.ruleModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true })
      .exec();

    if (!rule) throw new NotFoundException('Approval rule not found');
    return rule;
  }

  async initiateApprovalFlow(expenseId: string, employee: User) {
    const expense: any = await this.expenseModel
      .findById(expenseId)
      .populate('companyId')
      .exec();

    // Extract the actual company ID - handle both populated and non-populated cases
    const companyId =
      typeof expense.companyId === 'object'
        ? (expense.companyId as any)._id.toString()
        : expense.companyId.toString();

    const rules = await this.getApplicableRules(
      companyId,
      expense.convertedAmount,
    );

    if (
      rules.length === 0 &&
      employee.isManagerApprover &&
      employee.managerId
    ) {
      await this.createApprovalRequest(
        expenseId,
        employee.managerId.toString(),
        1,
      );
      expense.status = ExpenseStatus.IN_PROGRESS;
    } else if (rules.length > 0) {
      await this.applyApprovalRules(expenseId, rules, employee);
      expense.status = ExpenseStatus.IN_PROGRESS;
    } else {
      expense.status = ExpenseStatus.APPROVED;
    }

    await expense.save();
  }

  private async applyApprovalRules(
    expenseId: string,
    rules: ApprovalRule[],
    employee: User,
  ) {
    for (const rule of rules) {
      if (rule.type === ApprovalRuleType.SEQUENTIAL) {
        if (employee.isManagerApprover && employee.managerId) {
          await this.createApprovalRequest(
            expenseId,
            employee.managerId.toString(),
            0,
          );
        }

        for (const approver of rule.approvers) {
          await this.createApprovalRequest(
            expenseId,
            approver.userId,
            approver.step,
          );
        }
      } else if (
        rule.type === ApprovalRuleType.PERCENTAGE ||
        rule.type === ApprovalRuleType.SPECIFIC_APPROVER ||
        rule.type === ApprovalRuleType.HYBRID
      ) {
        for (const approver of rule.approvers) {
          await this.createApprovalRequest(expenseId, approver.userId, 1);
        }
      }
    }
  }

  private async createApprovalRequest(
    expenseId: string,
    approverId: string,
    step: number,
  ) {
    const request = await this.requestModel.create({
      expenseId: new Types.ObjectId(expenseId),
      approverId: new Types.ObjectId(approverId),
      step,
      status: ApprovalStatus.PENDING,
    });
    return request;
  }

  async getPendingApprovals(approverId: string) {
    if (!Types.ObjectId.isValid(approverId)) {
      throw new BadRequestException('Invalid approver ID format');
    }

    return this.requestModel
      .find({
        approverId: new Types.ObjectId(approverId),
        status: ApprovalStatus.PENDING,
      })
      .populate({
        path: 'expenseId',
        populate: {
          path: 'employeeId',
          select: 'firstName lastName email',
        },
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async processApproval(
    requestId: string,
    dto: ProcessApprovalDto,
    approverId: string,
  ) {
    const request: any = await this.requestModel
      .findOne({
        _id: new Types.ObjectId(requestId),
        approverId: new Types.ObjectId(approverId),
      })
      .populate('expenseId')
      .exec();

    if (!request) throw new NotFoundException('Approval request not found');
    if (request.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException('Request already processed');
    }

    request.status = dto.status;
    request.comments = dto.comments;
    request.processedAt = new Date();
    await request.save();

    await this.evaluateExpenseStatus(request.expenseId as any);

    return { message: 'Approval processed successfully', request };
  }

  private async evaluateExpenseStatus(expense: Expense) {
    const allRequests = await this.requestModel
      .find({ expenseId: expense._id })
      .populate('approverId')
      .exec();

    // Handle populated companyId
    const companyId =
      expense.companyId && typeof expense.companyId === 'object'
        ? (expense.companyId as any)._id.toString()
        : (expense.companyId as Types.ObjectId).toString();

    const rules = await this.getApplicableRules(
      companyId,
      expense.convertedAmount,
    );

    if (allRequests.some((r) => r.status === ApprovalStatus.REJECTED)) {
      expense.status = ExpenseStatus.REJECTED;
    } else if (
      rules.length > 0 &&
      this.checkConditionalApproval(allRequests, rules[0])
    ) {
      expense.status = ExpenseStatus.APPROVED;
    } else if (this.checkSequentialApproval(allRequests)) {
      const nextStep = expense.currentApprovalStep + 1;
      const nextRequests = allRequests.filter((r) => r.step === nextStep);

      if (nextRequests.length === 0) {
        expense.status = ExpenseStatus.APPROVED;
      } else {
        expense.currentApprovalStep = nextStep;
      }
    }

    await expense.save();
  }

  private checkConditionalApproval(
    requests: ApprovalRequest[],
    rule: ApprovalRule,
  ): boolean {
    if (rule.type === ApprovalRuleType.SPECIFIC_APPROVER) {
      return requests.some(
        (r) =>
          r.approverId.toString() === rule.specificApproverId.toString() &&
          r.status === ApprovalStatus.APPROVED,
      );
    }

    if (rule.type === ApprovalRuleType.PERCENTAGE) {
      const approved = requests.filter(
        (r) => r.status === ApprovalStatus.APPROVED,
      ).length;
      const percentage = (approved / requests.length) * 100;
      return percentage >= rule.approvalPercentage;
    }

    if (rule.type === ApprovalRuleType.HYBRID) {
      const specificApproved = requests.some(
        (r) =>
          r.approverId.toString() === rule.specificApproverId.toString() &&
          r.status === ApprovalStatus.APPROVED,
      );

      const approved = requests.filter(
        (r) => r.status === ApprovalStatus.APPROVED,
      ).length;
      const percentage = (approved / requests.length) * 100;
      const percentageReached = percentage >= rule.approvalPercentage;

      return specificApproved || percentageReached;
    }

    return false;
  }

  private checkSequentialApproval(requests: ApprovalRequest[]): boolean {
    const currentStepRequests = requests.filter(
      (r) => r.step === Math.min(...requests.map((req) => req.step)),
    );

    return currentStepRequests.every(
      (r) => r.status === ApprovalStatus.APPROVED,
    );
  }

  private async getApplicableRules(companyId: string, amount: number) {
    // Ensure companyId is a valid ObjectId string before converting
    if (!Types.ObjectId.isValid(companyId)) {
      throw new BadRequestException('Invalid company ID');
    }

    return this.ruleModel
      .find({
        companyId: new Types.ObjectId(companyId),
        isActive: true,
        $or: [
          { minAmount: { $lte: amount }, maxAmount: { $gte: amount } },
          { minAmount: { $lte: amount }, maxAmount: null },
          { minAmount: null, maxAmount: { $gte: amount } },
          { minAmount: null, maxAmount: null },
        ],
      })
      .exec();
  }

  async overrideApproval(expenseId: string, dto: ProcessApprovalDto) {
    const expense = await this.expenseModel.findById(expenseId).exec();
    if (!expense) throw new NotFoundException('Expense not found');

    expense.status =
      dto.status === ApprovalStatus.APPROVED
        ? ExpenseStatus.APPROVED
        : ExpenseStatus.REJECTED;

    await expense.save();

    return { message: 'Expense status overridden by admin', expense };
  }
}
