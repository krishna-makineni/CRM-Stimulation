import { Worker, Job } from 'bullmq';
import { getRedisConnection } from '../config/redis';
import { CAMPAIGN_QUEUE } from '../config/bullmq';
import { CampaignJobData, CampaignJobResult } from '../queues/campaign.queue';
import { Campaign } from '../models/Campaign';
import { Communication } from '../models/Communication';
import { Segment } from '../models/Segment';
import { env } from '../config/env';
import { sendToChannelService } from '../services/campaign.service';
import { findCustomersByCriteria } from '../utils/mongoQueryBuilder';
import { personalizeWithName } from '../utils/templateEngine';
import { logger } from '../utils/logger';

/** Campaign execution worker: retrieve customers → create communications → personalize → send */
export async function processCampaignJob(data: CampaignJobData): Promise<CampaignJobResult> {
  const campaign = await Campaign.findById(data.campaignId);
  if (!campaign) throw new Error('Campaign not found');

  const segment = await Segment.findById(campaign.audienceSegmentId);
  if (!segment) throw new Error('Segment not found');

  if (segment.status !== 'approved') {
    throw new Error('Segment must be approved before campaign launch');
  }

  const customers = await findCustomersByCriteria(segment.criteria);
  if (customers.length === 0) throw new Error('No customers match segment');

  campaign.status = 'Running';
  campaign.launchedAt = new Date();
  await campaign.save();

  let created = 0;

  for (const customer of customers) {
    const personalizedMessage = personalizeWithName(campaign.message, customer.name);

    const comm = await Communication.create({
      campaignId: campaign._id,
      customerId: customer._id,
      channel: campaign.channel,
      status: 'PENDING',
      message: personalizedMessage,
    });

    await sendToChannelService({
      communicationId: comm._id.toString(),
      campaignId: campaign._id.toString(),
      customerId: customer._id.toString(),
      customerName: customer.name,
      channel: campaign.channel,
      message: personalizedMessage,
      callbackUrl: env.crmWebhookUrl,
    });

    created++;
  }

  logger.info('Campaign worker completed', { campaignId: data.campaignId, created });

  return { campaignId: data.campaignId, communicationsCreated: created };
}

export function startCampaignWorker(): Worker<CampaignJobData, CampaignJobResult> | null {
  const connection = getRedisConnection();
  if (!connection) return null;

  const worker = new Worker<CampaignJobData, CampaignJobResult>(
    CAMPAIGN_QUEUE,
    async (job: Job<CampaignJobData>) => processCampaignJob(job.data),
    { connection: connection as any, concurrency: 2 }
  );

  worker.on('completed', (job) => {
    logger.info('Campaign job completed', { jobId: job.id });
  });

  worker.on('failed', (job, err) => {
    logger.error('Campaign job failed', { jobId: job?.id, error: err.message });
  });

  return worker;
}
