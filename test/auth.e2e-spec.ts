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
  email: 'test10@mail.com',
  password: '123456',
};

const existedUser: Promise<User> = Promise.resolve({
  email: 'exist@mail.com',
  password: '123456',
} as User);

const authDtoWithoutPassword = {
  email: 'test10@mail.com',
};

const authDtoWithoutEmail = {
  password: '123456',
};

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let authService: AuthService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    authService = moduleFixture.get<AuthService>(AuthService);
    await app.init();
  });

  it('/auth/register (POST) - success', async () => {
    jest
      .spyOn(authService, 'createUser')
      .mockResolvedValue({ email: authDto.email, message: 'success' });

    await request(app.getHttpServer()).post('/auth/register').send(authDto).expect(201);
  });

  it('/auth/register (POST) - fail, user already exist', async () => {
    jest.spyOn(authService, 'findUser').mockResolvedValue(existedUser);

    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send(authDto)
      .expect(400);

    expect(response.body.message).toBe(USER_ALREADY_EXIST);
  });

  it('/auth/register (POST) - fail, missing password', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(authDtoWithoutPassword)
      .expect(400);
  });

  it('/auth/register (POST) - fail, missing email', async () => {
    await request(app.getHttpServer()).post('/auth/register').send(authDtoWithoutEmail).expect(400);
  });

  it('/auth/login (POST) - success', async () => {
    jest
      .spyOn(authService, 'validateUser')
      .mockResolvedValue({ email: authDto.email, _id: 'mockUserId' });

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send(authDto)
      .expect(200);

    expect(response.body.token).toBeDefined();
  });

  it('/auth/login (POST) - fail, missing email', async () => {
    await request(app.getHttpServer()).post('/auth/login').send(authDtoWithoutEmail).expect(400);
  });

  it('/auth/login (POST) - fail, missing password', async () => {
    await request(app.getHttpServer()).post('/auth/login').send(authDtoWithoutPassword).expect(400);
  });

  it('/auth/login (POST) - fail, user not found', async () => {
    jest.spyOn(authService, 'validateUser').mockResolvedValue(null);

    await request(app.getHttpServer()).post('/auth/login').send(authDto).expect(401);
  });

  it('/auth/login (POST) - fail, database connection error', async () => {
    jest
      .spyOn(authService, 'validateUser')
      .mockRejectedValue(new Error('Database connection error'));

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send(authDto)
      .expect(500);

    expect(response.body.message).toBe('Internal server error');
  });

  it('/auth/login (POST) - fail, server error', async () => {
    jest.spyOn(authService, 'validateUser').mockRejectedValue(new Error('Some server error'));
    await request(app.getHttpServer()).post('/auth/login').send(authDto).expect(500);
  });

  afterAll(() => {
    disconnect();
  });
});
