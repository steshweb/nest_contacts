import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Post,
  UnauthorizedException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';
import { USER_ALREADY_EXIST, USER_NOT_FOUND } from './auth.constants';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UsePipes(new ValidationPipe())
  @Post('register')
  async register(@Body() dto: AuthDto) {
    const oldUser = await this.authService.findUser(dto.email);

    if (oldUser) {
      throw new BadRequestException(USER_ALREADY_EXIST);
    }
    return this.authService.createUser(dto);
  }

  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  @Post('login')
  async login(@Body() { email, password }: AuthDto) {
    const user = await this.authService.validateUser(email, password);
    if (!user) throw new UnauthorizedException(USER_NOT_FOUND);

    const token = await this.authService.login(user.email, user._id);
    return { token };
  }
}
