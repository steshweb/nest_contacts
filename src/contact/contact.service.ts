import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Contact } from './contact.model';
import { Model, Types } from 'mongoose';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Injectable()
export class ContactService {
  constructor(@InjectModel(Contact.name) private readonly contactModel: Model<Contact>) {}

  async create(createContactDto: CreateContactDto, userId: string): Promise<Contact> {
    const newContact = {
      ...createContactDto,
      userId: new Types.ObjectId(userId),
    };

    return this.contactModel.create(newContact);
  }

  async getAll(userId: string): Promise<Contact[]> {
    return this.contactModel.find({ userId: userId }).exec();
  }

  async getContact(userId: string, contactId: string): Promise<Contact | null> {
    return this.contactModel.findOne({ _id: contactId, userId }).exec();
  }

  async update(
    userId: string,
    contactId: string,
    updateContactDto: UpdateContactDto,
  ): Promise<Contact | null> {
    return this.contactModel
      .findOneAndUpdate({ _id: contactId, userId }, { $set: updateContactDto }, { new: true })
      .exec();
  }

  async delete(userId: string, contactId: string): Promise<Contact | null> {
    return this.contactModel.findOneAndDelete({ _id: contactId, userId }).exec();
  }
}
