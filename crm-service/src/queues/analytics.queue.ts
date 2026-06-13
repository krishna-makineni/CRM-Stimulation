import { getAnalyticsQueue } from '../config/bullmq';
import { processAnalyticsJob } from '../workers/analytics.worker';

export interface AnalyticsJobData {
  communicationId: string;
  campaignId: string;
  customerId: string;
  status: string;
  timestamp: string;
  failureReason?: string;
  channel: string;
}

/** Enqueue or inline-process an analytics/receipt job */
export async function enqueueAnalyticsJob(data: AnalyticsJobData) {
  const queue = getAnalyticsQueue();
  if (queue) {
    await queue.add('analytics', data, { removeOnComplete: 500, removeOnFail: 100 });
    return { mode: 'queued' as const };
  }
  await processAnalyticsJob(data);
  return { mode: 'inline' as const };
}
