import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ContactService } from './contact.service';
import { JwtAuthGuard } from '../auth/guards.ts/jwt.guard';
import { CreateContactDto } from './dto/create-contact.dto';
import { UserId } from '../decorators/userId.decorator';
import { IdValidationPipe } from '../pipes/id-validation.pipe';
import { CONTACT_NOT_FOUND } from './contact.constants';
import { UpdateContactDto } from './dto/update-contact.dto';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create')
  async create(@UserId() userId: string, @Body() createContactDto: CreateContactDto) {
    return this.contactService.create(createContactDto, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAll(@UserId() userId: string) {
    return this.contactService.getAll(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getContact(@Param('id', IdValidationPipe) id: string, @UserId() userId: string) {
    const contact = await this.contactService.getContact(userId, id);
    if (!contact) {
      throw new NotFoundException(CONTACT_NOT_FOUND);
    }
    return contact;
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id', IdValidationPipe) id: string,
    @UserId() userId: string,
    @Body() updateContactDto: UpdateContactDto,
  ) {
    const updatedContact = await this.contactService.update(userId, id, updateContactDto);
    if (!updatedContact) {
      throw new NotFoundException(CONTACT_NOT_FOUND);
    }
    return updatedContact;
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@Param('id', IdValidationPipe) id: string, @UserId() userId: string) {
    const contact = await this.contactService.delete(userId, id);
    if (!contact) {
      throw new NotFoundException(CONTACT_NOT_FOUND);
    }
    return { message: 'Contact deleted successfully' };
  }
}
