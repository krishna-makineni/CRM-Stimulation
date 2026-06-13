import { Request, Response } from 'express';
import * as webhookService from '../services/webhook.service';
import { receiptSchema } from '../middleware/validation';

export async function handleReceipt(req: Request, res: Response): Promise<void> {
  const data = receiptSchema.parse(req.body);
  const result = await webhookService.processReceipt(data);

  if (!result.found) {
    res.status(404).json({ error: 'Communication not found' });
    return;
  }

  res.status(202).json({ success: true, queued: result.queued });
}
