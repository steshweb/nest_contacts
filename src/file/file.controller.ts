import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileService } from './file.service';
import { JwtAuthGuard } from '../auth/guards.ts/jwt.guard';
import { CreateFileDto } from './dto/create-file.dto';
import { FILE_DELETED_SUCCESSFULLY, FILE_NOT_FOUND } from './file.constants';
import { IdValidationPipe } from '../pipes/id-validation.pipe';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('file')
export class FileController {
  constructor(private readonly filesService: FileService) {}

  @Post('upload')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ })],
      }),
    )
    file: Express.Multer.File,
    @Body() createFileDto: CreateFileDto,
  ) {
    return this.filesService.saveFile(file, createFileDto.contactId);
  }

  @Get(':contactId')
  @UseGuards(JwtAuthGuard)
  async getFile(@Param('contactId', IdValidationPipe) contactId: string) {
    const file = await this.filesService.getFileByContactId(contactId);

    if (!file) {
      throw new NotFoundException(FILE_NOT_FOUND);
    }

    return file;
  }

  @Delete(':contactId')
  @UseGuards(JwtAuthGuard)
  async deleteFile(@Param('contactId', IdValidationPipe) contactId: string) {
    const file = await this.filesService.deleteFileByContactId(contactId);

    if (!file) {
      throw new NotFoundException(FILE_NOT_FOUND);
    }

    return { message: FILE_DELETED_SUCCESSFULLY };
  }
}
