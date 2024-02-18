import { ConflictException, Injectable } from '@nestjs/common';
import { format } from 'date-fns';
import { path, toString as rootPath } from 'app-root-path';
import { join } from 'path';
import { ensureDir, writeFile, unlink } from 'fs-extra';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { File } from './file.model';
import { FILE_ALREADY_EXIST } from './file.constants';

@Injectable()
export class FileService {
  constructor(@InjectModel(File.name) private readonly fileModel: Model<File>) {}

  async saveFile(file: Express.Multer.File, contactId: string) {
    const existingFile = await this.fileModel.findOne({ contactId }).exec();

    if (existingFile) {
      throw new ConflictException(FILE_ALREADY_EXIST);
    }
    const dateFolder = format(new Date(), 'yyyy-MM-dd');
    const uploadFolder = `${path}/uploads/${dateFolder}`;
    await ensureDir(uploadFolder);

    const uniqueFileName = `${Date.now()}_${file.originalname}`;
    await writeFile(`${uploadFolder}/${uniqueFileName}`, file.buffer);

    const newFile = new this.fileModel({
      filename: file.originalname,
      url: `${dateFolder}/${uniqueFileName}`,
      contactId,
    });
    const savedFile = await newFile.save();

    return {
      contactId: savedFile.contactId,
      url: savedFile.url,
    };
  }

  async getFileByContactId(contactId: string): Promise<Pick<File, 'contactId' | 'url'> | null> {
    const file = await this.fileModel.findOne({ contactId }).exec();
    if (file) {
      return {
        contactId: file.contactId,
        url: file.url,
      };
    }
    return null;
  }

  async deleteFileByContactId(contactId: string): Promise<boolean> {
    const file = await this.fileModel.findOneAndDelete({ contactId }).exec();
    if (file) {
      const filePath = join(rootPath(), 'uploads', file.url);
      try {
        await unlink(filePath);
      } catch (error) {
        console.error(`Failed to delete file: ${filePath}`, error);
      }
      return true;
    }
    return false;
  }
}
