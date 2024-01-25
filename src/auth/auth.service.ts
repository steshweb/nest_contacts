import { genSalt, hash, compare } from 'bcryptjs';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';

import { User } from './user.model';
import { AuthDto } from './dto/auth.dto';
import { USER_NOT_FOUND, WRONG_PASSWORD } from './auth.constants';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly jwtService: JwtService,
  ) {}

  async createUser(dto: AuthDto) {
    const salt = await genSalt(10);
    const hashedPassword = await hash(dto.password, salt);

    await this.userModel.create({
      email: dto.email,
      password: hashedPassword,
    });

    return {
      email: dto.email,
      message: 'success',
    };
  }

  async findUser(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async validateUser(email: string, password: string): Promise<Pick<User, 'email' | '_id'>> {
    const user = await this.findUser(email);
    if (!user) {
      throw new UnauthorizedException(USER_NOT_FOUND);
    }

    const isCorrectPassword = await compare(password, user.password);
    if (!isCorrectPassword) {
      throw new UnauthorizedException(WRONG_PASSWORD);
    }

    return { email: user.email, _id: user._id };
  }

  async login(email: string, userId: string) {
    const payload = { email, userId };
    const token = await this.jwtService.signAsync(payload);
    return { token };
  }
}
