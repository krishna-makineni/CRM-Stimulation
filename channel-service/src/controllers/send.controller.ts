import { Request, Response } from 'express';
import { z } from 'zod';
import { CHANNELS } from '../../../shared/constants/channels';
import { enqueueDeliveryJob } from '../queues/delivery.queue';
import { logger } from '../utils/logger';

const sendSchema = z.object({
  communicationId: z.string(),
  campaignId: z.string(),
  customerId: z.string(),
  customerName: z.string(),
  channel: z.enum(CHANNELS),
  message: z.string(),
  callbackUrl: z.string().url(),
});

export async function handleSend(req: Request, res: Response): Promise<void> {
  const data = sendSchema.parse(req.body);

  logger.info('Received send request', {
    communicationId: data.communicationId,
    channel: data.channel,
    customer: data.customerName,
  });

  res.status(202).json({
    accepted: true,
    communicationId: data.communicationId,
    message: 'Communication queued for delivery',
  });

  await enqueueDeliveryJob(data);
}
