import { genSalt, hash, compare } from 'bcryptjs';
import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { User } from './user.model';
import { AuthDto } from './dto/auth.dto';

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

  async validateUser(email: string, password: string): Promise<Pick<User, 'email' | '_id'> | null> {
    const user = await this.findUser(email);
    if (!user) return null;

    const isCorrectPassword = await compare(password, user.password);
    if (!isCorrectPassword) return null;

    return { email: user.email, _id: user._id };
  }

  async login(email: string, userId: string) {
    const payload = { email, userId };
    return this.jwtService.signAsync(payload);
  }
}
