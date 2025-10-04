import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import axios from 'axios';
import { User, UserRole } from '../user/entities/user.entity';
import { Company } from '../company/entities/company.entity';
import { SignupDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Company.name) private companyModel: Model<Company>,
    private jwtService: JwtService,
  ) {}

  async signup(dto: SignupDto) {
    const existingUser = await this.userModel.findOne({ email: dto.email });
    if (existingUser) throw new ConflictException('Email already exists');

    const countryData = await this.getCountryCurrency(dto.country);

    const company = (await this.companyModel.create({
      name: dto.companyName,
      country: dto.country,
      currency: countryData.currency,
      currencySymbol: countryData.symbol,
    })) as Company;

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.userModel.create({
      email: dto.email,
      password: hashedPassword,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: UserRole.ADMIN,
      companyId: company._id,
      isManagerApprover: false,
    });

    const token = this.jwtService.sign({
      sub: (user as any)._id.toString(),
      email: user.email,
      role: user.role,
      companyId: (company as any)._id.toString(), // Make sure this is a string
    });

    return {
      message: 'Signup successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        companyId: company._id,
      },
    };
  }

  async login(dto: LoginDto) {
    const user = (await this.userModel
      .findOne({ email: dto.email })
      .populate('companyId')) as User;

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Ensure companyId is converted to string
    const companyId =
      typeof user.companyId === 'object' && user.companyId !== null
        ? (user.companyId as any)._id.toString()
        : (user.companyId as any).toString();

    const token = this.jwtService.sign({
      sub: (user._id as any).toString(),
      email: user.email,
      role: user.role,
      companyId: companyId, // Store as string in JWT
    });

    return {
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        company: user.companyId,
      },
    };
  }

  private async getCountryCurrency(country: string) {
    try {
      const response = await axios.get(
        'https://restcountries.com/v3.1/all?fields=name,currencies',
      );
      const countryData = response.data.find(
        (c) => c.name.common.toLowerCase() === country.toLowerCase(),
      );

      if (countryData && countryData.currencies) {
        const currencyCode = Object.keys(countryData.currencies)[0];
        return {
          currency: currencyCode,
          symbol: countryData.currencies[currencyCode].symbol,
        };
      }
    } catch (error) {
      console.error('Error fetching country currency:', error);
    }
    return { currency: 'USD', symbol: '$' };
  }
}
