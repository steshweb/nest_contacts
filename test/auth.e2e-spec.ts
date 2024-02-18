import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AuthDto } from '../src/auth/dto/auth.dto';
import { disconnect } from 'mongoose';
import { AuthService } from '../src/auth/auth.service';
import { AppModule } from '../src/app.module';
import { USER_ALREADY_EXIST } from '../src/auth/auth.constants';
import { User } from '../src/auth/user.model';

const authDto: AuthDto = {
  email: 'test10@gmail.com',
  password: '123456',
};

const existedUser: Promise<User> = Promise.resolve({
  email: 'exist@mail.com',
  password: '123456',
} as User);

const authDtoWithoutPassword = {
  email: 'test10@gmail.com',
};

const authDtoWithoutEmail = {
  password: '123456',
};

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let authService: AuthService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    authService = moduleFixture.get<AuthService>(AuthService);
    await app.init();
  });

  it('/auth/register (POST) - success', async () => {
    jest.spyOn(authService, 'findUser').mockResolvedValue(null);

    return request(app.getHttpServer())
      .post('/auth/register')
      .send(authDto)
      .expect(201)
      .then(({ body }: request.Response) => {
        expect(body.email).toBe(authDto.email);
        expect(body.message).toBe('success');
      });
  });

  it('/auth/register (POST) - user already exists', async () => {
    jest.spyOn(authService, 'findUser').mockResolvedValue(existedUser);

    return request(app.getHttpServer())
      .post('/auth/register')
      .send(authDto)
      .expect(400)
      .then(({ body }: request.Response) => {
        expect(body.message).toBe(USER_ALREADY_EXIST);
      });
  });

  it('/auth/register (POST) - fail missing password', async () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send(authDtoWithoutPassword)
      .expect(400);
  });

  it('/auth/register (POST) - fail missing email', async () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send(authDtoWithoutEmail)
      .expect(400);
  });

  afterAll(() => {
    disconnect();
  });
});
