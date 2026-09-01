import fs from 'fs';
import path from 'path';
import { prisma } from '../models/prisma';
import { ENV } from '../config/env';

export class AssetService {
  constructor() {
    this.ensureUploadDir();
  }

  private ensureUploadDir() {
    if (!fs.existsSync(ENV.UPLOAD_DIR)) {
      fs.mkdirSync(ENV.UPLOAD_DIR, { recursive: true });
    }
  }

  public async saveAssetRecord(file: Express.Multer.File) {
    const relativeUrl = `/uploads/${file.filename}`;

    const asset = await prisma.uploadedAsset.create({
      data: {
        filename: file.filename,
        originalName: file.originalname,
        url: relativeUrl,
        size: file.size,
        mimeType: file.mimetype,
      },
    });

    return asset;
  }

  public async listAssets() {
    return prisma.uploadedAsset.findMany({
      orderBy: { uploadedAt: 'desc' },
    });
  }

  public async getAssetById(id: string) {
    return prisma.uploadedAsset.findUnique({ where: { id } });
  }

  public async deleteAsset(id: string) {
    const asset = await prisma.uploadedAsset.findUnique({ where: { id } });
    if (asset) {
      const filePath = path.join(ENV.UPLOAD_DIR, asset.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return prisma.uploadedAsset.delete({ where: { id } });
    }
    return null;
  }
}

export const assetService = new AssetService();
