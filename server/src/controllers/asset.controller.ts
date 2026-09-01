import { Request, Response, Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ENV } from '../config/env';
import { assetService } from '../services/asset.service';

const router = Router();

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, ENV.UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: ENV.MAX_FILE_SIZE_MB * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const allowedExtensions = ['.glb', '.gltf', '.bin', '.obj', '.fbx', '.png', '.jpg', '.jpeg', '.hdr'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext) || file.mimetype.includes('model') || file.mimetype.includes('octet-stream')) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file format (${ext}). Allowed: .glb, .gltf, .obj, .png, .jpg, .hdr`));
    }
  },
});

// GET /api/assets - List uploaded assets
router.get('/', async (_req: Request, res: Response) => {
  try {
    const assets = await assetService.listAssets();
    res.json({ success: true, data: assets });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/assets/upload - Upload 3D model asset
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const asset = await assetService.saveAssetRecord(req.file);
    res.status(201).json({
      success: true,
      data: asset,
      message: 'Asset uploaded successfully',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/assets/:id - Delete asset
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await assetService.deleteAsset(req.params.id);
    res.json({ success: true, message: 'Asset deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export const assetController = router;
