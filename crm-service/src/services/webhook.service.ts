import { Communication } from '../models/Communication';
import { enqueueAnalyticsJob } from '../queues/analytics.queue';
import { logger } from '../utils/logger';

export async function processReceipt(data: {
  communicationId: string;
  campaignId: string;
  customerId: string;
  status: 'SENT' | 'DELIVERED' | 'FAILED' | 'OPENED' | 'READ' | 'CLICKED';
  timestamp: string;
  failureReason?: string;
}) {
  const communication = await Communication.findById(data.communicationId);
  if (!communication) {
    logger.warn('Communication not found for receipt', { communicationId: data.communicationId });
    return { found: false as const };
  }

  await enqueueAnalyticsJob({
    communicationId: data.communicationId,
    campaignId: data.campaignId,
    customerId: data.customerId,
    status: data.status,
    timestamp: data.timestamp,
    failureReason: data.failureReason,
    channel: communication.channel,
  });

  return { found: true as const, queued: true };
}
