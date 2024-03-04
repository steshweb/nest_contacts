import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Types, disconnect } from 'mongoose';
import { AppModule } from '../src/app.module';
import { AuthDto } from '../src/auth/dto/auth.dto';
import { FileService } from '../src/file/file.service';
import { ObjectId } from 'mongodb';

const authDto: AuthDto = {
  email: 'test3@mail.com',
  password: '123456',
};

const testFile = {
  originalname: 'test.jpg',
  buffer: Buffer.from('fake image data'),
};

const invalidFile = {
  originalname: 'test.txt',
  buffer: Buffer.from('fake text data'),
};

const existingFile = {
  contactId: new Types.ObjectId(),
  url: 'existing_file_url',
};

const createFileDto = { contactId: new Types.ObjectId().toString() };

describe('FileController (e2e)', () => {
  let app: INestApplication;
  let fileService: FileService;
  let token: string;
  const contactId = new Types.ObjectId();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    fileService = moduleFixture.get<FileService>(FileService);

    await app.init();

    const { body } = await request(app.getHttpServer()).post('/auth/login').send(authDto);
    token = body.token;
  }, 10000);

  it('/file/upload (POST) - success', async () => {
    jest.spyOn(fileService, 'saveFile').mockResolvedValue({
      contactId: new ObjectId(createFileDto.contactId),
      url: 'path/to/uploaded/file',
    });

    const response = await request(app.getHttpServer())
      .post('/file/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', testFile.buffer, testFile.originalname)
      .field(createFileDto);

    expect(response.status).toBe(200);
    expect(response.body.contactId).toBe(createFileDto.contactId);
    expect(response.body.url).toBeDefined();
  });

  it('/file/upload (POST) - fail, invalid file type', async () => {
    request(app.getHttpServer())
      .post('/file/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', invalidFile.buffer, invalidFile.originalname)
      .field(createFileDto)
      .expect(400);
  });

  it('/file/upload (POST) - fail, invalid token', async () => {
    const invalidToken = 'invalid_token';
    request(app.getHttpServer())
      .post('/file/upload')
      .set('Authorization', `Bearer ${invalidToken}`)
      .attach('file', testFile.buffer, testFile.originalname)
      .field(createFileDto)
      .expect(400);
  });

  it('/file/upload (POST) - fail, file already exists for contact', async () => {
    jest.spyOn(fileService, 'saveFile').mockImplementation(async () => existingFile);

    request(app.getHttpServer())
      .post('/file/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', testFile.buffer, testFile.originalname)
      .field(createFileDto)
      .expect(409);
  });

  it('/file/:contactId (GET) - success', async () => {
    jest.spyOn(fileService, 'getFileByContactId').mockResolvedValue(existingFile);

    const response = await request(app.getHttpServer())
      .get(`/file/${contactId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.contactId).toBe(String(existingFile.contactId));
    expect(response.body.url).toBe(existingFile.url);
  });

  it('/file/:contactId (GET) - fail, file not found', async () => {
    jest.spyOn(fileService, 'getFileByContactId').mockResolvedValue(null);

    request(app.getHttpServer())
      .get(`/file/${contactId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('/file/:contactId (DELETE) - success', async () => {
    jest.spyOn(fileService, 'deleteFileByContactId').mockResolvedValue(true);

    request(app.getHttpServer())
      .delete(`/file/${contactId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  it('/file/:contactId (DELETE) - fail, file not found', async () => {
    jest.spyOn(fileService, 'deleteFileByContactId').mockResolvedValue(false);

    request(app.getHttpServer())
      .delete(`/file/${contactId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('/auth/login (POST) - fail, database connection error', async () => {
    jest.spyOn(fileService, 'saveFile').mockRejectedValue(new Error('Database connection error'));
    request(app.getHttpServer()).post('/auth/login').send(authDto).expect(500);
  });

  it('/file/upload (POST) - fail, internal server error', async () => {
    jest.spyOn(fileService, 'saveFile').mockRejectedValue(new Error('Internal server error'));

    request(app.getHttpServer())
      .post('/file/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', testFile.buffer, testFile.originalname)
      .field(createFileDto)
      .expect(500);
  });

  afterAll(async () => {
    await disconnect();
    await app.close();
  });
});
