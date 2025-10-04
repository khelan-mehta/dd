import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { ExpenseService } from './expense.service';
import { CreateExpenseDto, UpdateExpenseDto } from './dto/expense.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';
import { ExpenseStatus } from './entities/expense.entity';
import axios from 'axios';

@ApiTags('Expenses')
@Controller('expenses')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ExpenseController {
  expenseRepo: any;
  constructor(private expenseService: ExpenseService) {}

  @Post()
  @Roles(UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Submit expense claim' })
  async createExpense(@Body() dto: CreateExpenseDto, @Request() req) {
    return this.expenseService.createExpense(dto, req.user.sub); // Change to req.user.sub
  }

  @Post('upload-receipt')
  @UseInterceptors(FileInterceptor('receipt'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload receipt and auto-extract expense details' })
  async uploadReceipt(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    return this.expenseService.processReceipt(file, req.user.id);
  }

  @Get('my-expenses')
  async getMyExpenses(@Request() req, @Query('status') status?: string) {
    return this.expenseService.getMyExpenses(req.user.sub, status); // Change to .sub
  }

  @Get('team-expenses')
  async getTeamExpenses(@Request() req) {
    return this.expenseService.getTeamExpenses(req.user.sub); // Change to .sub
  }

  @Get('all')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all company expenses (Admin only)' })
  async getAllExpenses(@Request() req) {
    console.log('JWT User Object:', req.user); // Debug log
    console.log('Company ID:', req.user.companyId); // Debug log
    return this.expenseService.getAllExpenses(req.user.companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get expense by ID' })
  async getExpenseById(@Param('id') id: string) {
    return this.expenseService.getExpenseById(id);
  }

  @Put(':id')
  @Roles(UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update expense (if pending)' })
  async updateExpense(id: string, dto: UpdateExpenseDto) {
    const expense = await this.getExpenseById(id);

    if (expense.status !== ExpenseStatus.PENDING) {
      throw new BadRequestException(
        'Cannot update expense that is not pending',
      );
    }

    Object.assign(expense, dto);
    return this.expenseRepo.save(expense);
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
