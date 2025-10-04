import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async createUser(dto: CreateUserDto, companyId: string) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.userModel.create({
      ...dto,
      password: hashedPassword,
      companyId: new Types.ObjectId(companyId),
    });

    return user;
  }

  async getAllUsers(companyId: string) {
    if (!Types.ObjectId.isValid(companyId)) {
      throw new BadRequestException('Invalid company ID format');
    }

    return this.userModel
      .find({ companyId: new Types.ObjectId(companyId), isActive: true })
      .populate('managerId', 'firstName lastName email')
      .select('email firstName lastName role isManagerApprover')
      .exec();
  }

  async getUserById(id: string) {
    const user = await this.userModel
      .findById(id)
      .populate('managerId', 'firstName lastName email')
      .populate('companyId')
      .select('email firstName lastName role isManagerApprover')
      .exec();

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    const user = await this.userModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true })
      .exec();

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async assignManager(userId: string, managerId: string) {
    const user = await this.getUserById(userId);
    const manager = await this.getUserById(managerId);

    if (manager.role === UserRole.EMPLOYEE) {
      throw new BadRequestException('Manager must have manager or admin role');
    }

    user.managerId = new Types.ObjectId(managerId);
    await user.save();
    return user;
  }

  async deactivateUser(id: string) {
    const user = await this.userModel
      .findByIdAndUpdate(id, { $set: { isActive: false } }, { new: true })
      .exec();

    if (!user) throw new NotFoundException('User not found');
    return { message: 'User deactivated successfully' };
  }
}
