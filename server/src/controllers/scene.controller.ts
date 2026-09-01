import { Request, Response, Router } from 'express';
import { sceneService } from '../services/scene.service';

const router = Router();

// GET /api/scenes - List recent scenes
router.get('/', async (_req: Request, res: Response) => {
  try {
    const scenes = await sceneService.listScenes();
    res.json({ success: true, data: scenes });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/scenes - Create new scene session
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, environmentPreset } = req.body;
    const scene = await sceneService.createScene({ name, environmentPreset });
    res.status(201).json({ success: true, data: scene });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/scenes/:id - Fetch scene snapshot
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const snapshot = await sceneService.getSceneSnapshot(req.params.id);
    res.json({ success: true, data: snapshot });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/scenes/:id - Persist active scene state
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const updatedSnapshot = await sceneService.saveSceneSnapshot(req.params.id, req.body);
    res.json({ success: true, data: updatedSnapshot });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/scenes/:id - Delete scene
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await sceneService.deleteScene(req.params.id);
    res.json({ success: true, message: 'Scene deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export const sceneController = router;
