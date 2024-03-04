import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Types, disconnect } from 'mongoose';
import { AppModule } from '../src/app.module';
import { CreateContactDto } from '../src/contact/dto/create-contact.dto';
import { Contact } from '../src/contact/contact.model';
import { ContactService } from '../src/contact/contact.service';
import { AuthDto } from '../src/auth/dto/auth.dto';
import { UpdateContactDto } from '../src/contact/dto/update-contact.dto';

const authDto: AuthDto = {
  email: 'test3@mail.com',
  password: '123456',
};

const contactDto: CreateContactDto = {
  name: 'John Doe',
  phone: '123456789',
  address: '123 Main Street',
};

const createdContact: Partial<Contact> = {
  name: 'John Doe',
  phone: '123456789',
  address: '123 Main Street',
  userId: new Types.ObjectId(),
};

const existedContact: Promise<Contact> = Promise.resolve({
  name: 'John Doe',
  phone: '123456789',
  address: '123 Main Street',
  userId: new Types.ObjectId(),
} as Contact);

const updatedContact: UpdateContactDto = {
  name: 'Updated Name',
  phone: '987654321',
  address: 'Updated Address',
};

describe('ContactController (e2e)', () => {
  let app: INestApplication;
  let contactService: ContactService;
  let token: string;
  const contactId = new Types.ObjectId();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    contactService = moduleFixture.get<ContactService>(ContactService);

    await app.init();

    const { body } = await request(app.getHttpServer()).post('/auth/login').send(authDto);
    token = body.token;
  });

  it('/contact/create (POST) - success', async () => {
    jest.spyOn(contactService, 'create').mockResolvedValue(createdContact as Contact);
    const response = await request(app.getHttpServer())
      .post('/contact/create')
      .set('Authorization', `Bearer ${token}`)
      .send(contactDto)
      .expect(201);

    expect(response.body.name).toBe(contactDto.name);
    expect(response.body.phone).toBe(contactDto.phone);
    expect(response.body.address).toBe(contactDto.address);
  });

  it('/contact/create (POST) - fail, missing required fields', async () => {
    request(app.getHttpServer())
      .post('/contact/create')
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(400);
  });

  it('/contact (GET) - success', async () => {
    jest.spyOn(contactService, 'getAll').mockResolvedValue([]);
    await request(app.getHttpServer())
      .get('/contact')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  it('/contact/:id (GET) - success', async () => {
    jest.spyOn(contactService, 'getContact').mockResolvedValue(existedContact);

    const response = await request(app.getHttpServer())
      .get(`/contact/${contactId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.name).toBe(createdContact.name);
    expect(response.body.phone).toBe(createdContact.phone);
    expect(response.body.address).toBe(createdContact.address);
  });

  it('/contact/:id (GET) - fail, contact id not valid', async () => {
    request(app.getHttpServer())
      .get(`/contact/123456`)
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });

  it('/contact/:id (GET) - fail, contact not found', async () => {
    jest.spyOn(contactService, 'getContact').mockResolvedValue(null);

    request(app.getHttpServer())
      .get(`/contact/${contactId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });

  it('/contact/:id (PATCH) - success', async () => {
    jest.spyOn(contactService, 'update').mockResolvedValue(updatedContact as Contact);

    const response = await request(app.getHttpServer())
      .patch(`/contact/${contactId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatedContact)
      .expect(200);

    expect(response.body.name).toBe(updatedContact.name);
    expect(response.body.phone).toBe(updatedContact.phone);
    expect(response.body.address).toBe(updatedContact.address);
  });

  it('/contact/:id (PATCH) - fail, contact not found', async () => {
    jest.spyOn(contactService, 'update').mockResolvedValue(null);

    const response = await request(app.getHttpServer())
      .patch(`/contact/${contactId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatedContact)
      .expect(404);

    expect(response.body.message).toBe('Contact with this id does not found');
  });

  it('/contact/:id (DELETE) - success', async () => {
    jest.spyOn(contactService, 'delete').mockResolvedValue({} as Contact);

    const response = await request(app.getHttpServer())
      .delete(`/contact/${contactId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.message).toBe('Contact deleted successfully');
  });

  it('/contact/:id (DELETE) - fail, contact not found', async () => {
    jest.spyOn(contactService, 'delete').mockResolvedValue(null);

    const response = await request(app.getHttpServer())
      .delete(`/contact/${contactId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    expect(response.body.message).toBe('Contact with this id does not found');
  });

  it('/contact/create (POST) - fail, invalid token', async () => {
    const invalidToken = 'invalid_token';
    request(app.getHttpServer())
      .post('/contact/create')
      .set('Authorization', `Bearer ${invalidToken}`)
      .send(contactDto)
      .expect(400);
  });

  it('/auth/login (POST) - fail, database connection error', async () => {
    jest.spyOn(contactService, 'create').mockRejectedValue(new Error('Database connection error'));

    const response = await request(app.getHttpServer())
      .post('/contact/create')
      .set('Authorization', `Bearer ${token}`)
      .send(contactDto)
      .expect(500);

    expect(response.body.message).toBe('Internal server error');
  });

  it('/contact/create (POST) - fail, internal server error', async () => {
    jest.spyOn(contactService, 'create').mockRejectedValue(new Error('Internal server error'));

    const response = await request(app.getHttpServer())
      .post('/contact/create')
      .set('Authorization', `Bearer ${token}`)
      .send(contactDto)
      .expect(500);

    expect(response.body.message).toBe('Internal server error');
  });

  afterAll(async () => {
    await disconnect();
    await app.close();
  });
});
