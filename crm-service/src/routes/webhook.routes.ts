import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import * as webhookController from '../controllers/webhook.controller';

const router = Router();

router.post('/receipt', asyncHandler(webhookController.handleReceipt));

export default router;
