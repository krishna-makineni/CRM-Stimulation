import { Worker, Job } from 'bullmq';
import { getRedisConnection } from '../config/redis';
import { ANALYTICS_QUEUE } from '../config/bullmq';
import { AnalyticsJobData } from '../queues/analytics.queue';
import { Communication } from '../models/Communication';
import { Analytics } from '../models/Analytics';
import { checkCampaignCompletion } from '../services/campaign.service';
import { CommunicationStatus } from '../types';
import { logger } from '../utils/logger';

/** Process receipt webhook: update communication + store analytics event */
export async function processAnalyticsJob(data: AnalyticsJobData): Promise<void> {
  const timestamp = new Date(data.timestamp);
  const updateFields: Record<string, unknown> = { status: data.status };

  switch (data.status) {
    case 'SENT':
      updateFields.sentAt = timestamp;
      break;
    case 'DELIVERED':
      updateFields.deliveredAt = timestamp;
      break;
    case 'OPENED':
      updateFields.openedAt = timestamp;
      break;
    case 'READ':
      updateFields.readAt = timestamp;
      break;
    case 'CLICKED':
      updateFields.clickedAt = timestamp;
      break;
    case 'FAILED':
      updateFields.failedAt = timestamp;
      updateFields.failureReason = data.failureReason;
      break;
  }

  await Communication.findByIdAndUpdate(data.communicationId, updateFields);

  await Analytics.create({
    campaignId: data.campaignId,
    communicationId: data.communicationId,
    customerId: data.customerId,
    eventType: data.status as CommunicationStatus,
    channel: data.channel,
    timestamp,
    failureReason: data.failureReason,
  });

  if (['DELIVERED', 'FAILED', 'CLICKED', 'OPENED', 'READ'].includes(data.status)) {
    await checkCampaignCompletion(data.campaignId);
  }

  logger.info('Analytics event processed', {
    communicationId: data.communicationId,
    status: data.status,
  });
}

export function startAnalyticsWorker(): Worker<AnalyticsJobData> | null {
  const connection = getRedisConnection();
  if (!connection) return null;

  const worker = new Worker<AnalyticsJobData>(
    ANALYTICS_QUEUE,
    async (job: Job<AnalyticsJobData>) => processAnalyticsJob(job.data),
    { connection: connection as any, concurrency: 10 }
  );

  worker.on('failed', (job, err) => {
    logger.error('Analytics job failed', { jobId: job?.id, error: err.message });
  });

  return worker;
}
