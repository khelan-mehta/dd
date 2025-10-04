import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApprovalService } from './approval.service';
import { CreateApprovalRuleDto, ProcessApprovalDto } from './dto/approval.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';

@ApiTags('Approvals')
@Controller('approvals')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ApprovalController {
  constructor(private approvalService: ApprovalService) {}

  @Post('rules')
  async createApprovalRule(@Body() dto: CreateApprovalRuleDto, @Request() req) {
    return this.approvalService.createApprovalRule(dto, req.user.companyId);
  }

  @Get('rules')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get all approval rules' })
  async getApprovalRules(@Request() req) {
    return this.approvalService.getApprovalRules(req.user.companyId);
  }

  @Get('pending')
  async getPendingApprovals(@Request() req) {
    return this.approvalService.getPendingApprovals(req.user.sub); // Change to .sub
  }

  @Post('process/:requestId')
  async processApproval(
    @Param('requestId') requestId: string,
    @Body() dto: ProcessApprovalDto,
    @Request() req,
  ) {
    return this.approvalService.processApproval(requestId, dto, req.user.sub); // Change to .sub
  }

  @Put('rules/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update approval rule (Admin only)' })
  async updateApprovalRule(
    @Param('id') id: string,
    @Body() dto: CreateApprovalRuleDto,
  ) {
    return this.approvalService.updateApprovalRule(id, dto);
  }

  @Post('override/:expenseId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Override approval (Admin only)' })
  async overrideApproval(
    @Param('expenseId') expenseId: string,
    @Body() dto: ProcessApprovalDto,
  ) {
    return this.approvalService.overrideApproval(expenseId, dto);
  }
}
