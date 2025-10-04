import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import axios from 'axios';
import { Expense, ExpenseStatus } from './entities/expense.entity';
import { User } from '../user/entities/user.entity';
import { Company } from '../company/entities/company.entity';
import { CreateExpenseDto, UpdateExpenseDto } from './dto/expense.dto';
import { ApprovalService } from '../approval/approval.service';
import { OcrService } from '../ocr/ocr.service';

@Injectable()
export class ExpenseService {
  constructor(
    @InjectModel(Expense.name) private expenseModel: Model<Expense>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Company.name) private companyModel: Model<Company>,
    private approvalService: ApprovalService,
    private ocrService: OcrService,
  ) {}

  async createExpense(dto: CreateExpenseDto, employeeId: string) {
    const user = await this.userModel
      .findById(employeeId)
      .populate('companyId')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.companyId) {
      throw new BadRequestException('User has no associated company');
    }

    const company = user.companyId as any; // TypeScript workaround for populated field

    let convertedAmount = dto.amount;
    if (dto.currency !== company.currency) {
      convertedAmount = await this.convertCurrency(
        dto.amount,
        dto.currency,
        company.currency,
      );
    }

    const expense: any = await this.expenseModel.create({
      ...dto,
      employeeId: new Types.ObjectId(employeeId),
      companyId: user.companyId,
      convertedAmount,
      status: ExpenseStatus.PENDING,
    });

    await this.approvalService.initiateApprovalFlow(
      expense._id.toString(),
      user,
    );

    return expense;
  }

  async processReceipt(file: Express.Multer.File, employeeId: string) {
    const ocrData = await this.ocrService.extractReceiptData(file);

    const expenseDto: CreateExpenseDto = {
      amount: ocrData.amount,
      currency: ocrData.currency || 'USD',
      category: ocrData.category,
      description: ocrData.description || 'Receipt upload',
      expenseDate: ocrData.date || new Date(),
      merchantName: ocrData.merchantName,
      expenseLines: ocrData.lineItems,
    };

    return this.createExpense(expenseDto, employeeId);
  }

  async getMyExpenses(employeeId: string, status?: string) {
    if (!Types.ObjectId.isValid(employeeId)) {
      throw new BadRequestException('Invalid employee ID format');
    }

    const query: any = { employeeId: new Types.ObjectId(employeeId) };
    if (status) query.status = status;

    return this.expenseModel
      .find(query)
      .populate({
        path: 'employeeId',
        select: 'firstName lastName email',
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getTeamExpenses(managerId: string) {
    if (!Types.ObjectId.isValid(managerId)) {
      throw new BadRequestException('Invalid manager ID format');
    }

    const manager: any = await this.userModel.findById(managerId).exec();

    return this.expenseModel
      .find({
        $or: [
          { 'employeeId.managerId': new Types.ObjectId(managerId) },
          { companyId: manager.companyId },
        ],
      })
      .populate('employeeId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getAllExpenses(companyId: string) {
    // Validate the ObjectId before using it
    if (!Types.ObjectId.isValid(companyId)) {
      throw new BadRequestException('Invalid company ID format');
    }

    return this.expenseModel
      .find({ companyId: new Types.ObjectId(companyId) })
      .populate('employeeId', 'firstName lastName email role')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getExpenseById(id: string) {
    const expense = await this.expenseModel
      .findById(id)
      .populate('employeeId', 'firstName lastName email')
      .exec();

    if (!expense) throw new NotFoundException('Expense not found');
    return expense;
  }

  async updateExpense(id: string, dto: UpdateExpenseDto) {
    const expense = await this.getExpenseById(id);

    if (expense.status !== ExpenseStatus.PENDING) {
      throw new BadRequestException(
        'Cannot update expense that is not pending',
      );
    }

    Object.assign(expense, dto);
    await expense.save();
    return expense;
  }

  private async convertCurrency(
    amount: number,
    from: string,
    to: string,
  ): Promise<number> {
    try {
      const response = await axios.get(
        `https://api.exchangerate-api.com/v4/latest/${from}`,
      );
      const rate = response.data.rates[to];
      return Number((amount * rate).toFixed(2));
    } catch (error) {
      console.error('Currency conversion error:', error);
      return amount;
    }
  }
}
