import { Router } from 'express';
import { handleSend } from '../controllers/send.controller';

const router = Router();

router.post('/send', async (req, res, next) => {
  try {
    await handleSend(req, res);
  } catch (error) {
    next(error);
  }
});

export default router;
