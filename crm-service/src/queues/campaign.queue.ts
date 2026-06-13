import { getCampaignQueue } from '../config/bullmq';
import { processCampaignJob } from '../workers/campaign.worker';

export interface CampaignJobData {
  campaignId: string;
}

export interface CampaignJobResult {
  campaignId: string;
  communicationsCreated: number;
}

/** Enqueue or inline-process a campaign launch job */
export async function enqueueCampaignJob(data: CampaignJobData) {
  const queue = getCampaignQueue();
  if (queue) {
    const job = await queue.add('campaign', data, { removeOnComplete: 100, removeOnFail: 50 });
    return { jobId: job.id!, mode: 'queued' as const };
  }
  const result = await processCampaignJob(data);
  return { jobId: `inline-${Date.now()}`, mode: 'inline' as const, result };
}

export async function getCampaignJobResult(jobId: string) {
  const queue = getCampaignQueue();
  if (!queue || jobId.startsWith('inline-')) return null;

  const job = await queue.getJob(jobId);
  if (!job) return null;

  const state = await job.getState();
  return { id: job.id, state, result: job.returnvalue, failedReason: job.failedReason };
}
