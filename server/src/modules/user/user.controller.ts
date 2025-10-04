import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto, AssignManagerDto } from './dto/user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './entities/user.entity';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private userService: UserService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  async createUser(@Body() dto: CreateUserDto, @Request() req) {
    return this.userService.createUser(dto, req.user.companyId); // Already correct
  }

  @Get()
  async getAllUsers(@Request() req) {
    return this.userService.getAllUsers(req.user.companyId); // Already correct
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  async getUserById(@Param('id') id: string) {
    return this.userService.getUserById(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user (Admin only)' })
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.userService.updateUser(id, dto);
  }

  @Put(':id/assign-manager')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Assign manager to employee (Admin only)' })
  async assignManager(@Param('id') id: string, @Body() dto: AssignManagerDto) {
    return this.userService.assignManager(id, dto.managerId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Deactivate user (Admin only)' })
  async deactivateUser(@Param('id') id: string) {
    return this.userService.deactivateUser(id);
  }
}
