import { Campaign, ICampaign } from '../models/Campaign';
import { Segment } from '../models/Segment';
import { Customer } from '../models/Customer';
import { Communication } from '../models/Communication';
import { enqueueCampaignJob } from '../queues/campaign.queue';
import { findCustomersByCriteria } from '../utils/mongoQueryBuilder';
import { personalizeWithName } from '../utils/templateEngine';
import { getCampaignAnalytics } from '../utils/metricsCalculator';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { Channel } from '../types';

export interface SendCommunicationRequest {
  communicationId: string;
  campaignId: string;
  customerId: string;
  customerName: string;
  channel: Channel;
  message: string;
  callbackUrl: string;
}

/** Send communication request to Channel Service */
export async function sendToChannelService(payload: SendCommunicationRequest): Promise<boolean> {
  try {
    const response = await fetch(`${env.channelServiceUrl}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      logger.error('Channel service rejected request', { status: response.status });
      return false;
    }

    logger.info('Communication sent to channel service', { communicationId: payload.communicationId });
    return true;
  } catch (error) {
    logger.error('Failed to reach channel service', { error });
    return false;
  }
}

export async function getCampaigns(status?: string) {
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;

  return Campaign.find(filter)
    .populate('audienceSegmentId', 'name customerCount')
    .sort({ createdAt: -1 });
}

export async function getCampaignById(id: string) {
  const campaign = await Campaign.findById(id).populate('audienceSegmentId');
  if (!campaign) return null;

  const analytics = await getCampaignAnalytics(id);
  const communications = await Communication.find({ campaignId: id })
    .populate('customerId', 'name email')
    .limit(100);

  return { campaign, analytics, communications };
}

export async function createCampaign(data: {
  name: string;
  objective: string;
  audienceSegmentId: string;
  message: string;
  channel: Channel;
  status?: 'Draft' | 'Scheduled' | 'Running' | 'Completed';
  tone?: string;
  offer?: string;
}) {
  return Campaign.create(data);
}

export async function updateCampaign(id: string, data: Partial<{
  name: string;
  objective: string;
  audienceSegmentId: string;
  message: string;
  channel: Channel;
  status: 'Draft' | 'Scheduled' | 'Running' | 'Completed';
  tone: string;
  offer: string;
}>) {
  return Campaign.findByIdAndUpdate(id, data, { new: true });
}

/** Launch campaign via BullMQ worker (or inline fallback) */
export async function launchCampaign(campaignId: string): Promise<{ campaign: ICampaign; jobId: string; mode: string } | null> {
  const campaign = await Campaign.findById(campaignId);
  if (!campaign) return null;

  const segment = await Segment.findById(campaign.audienceSegmentId);
  if (!segment) throw new Error('Segment not found');

  if (segment.status && segment.status !== 'approved') {
    throw new Error('Segment must be approved before launching a campaign');
  }

  const job = await enqueueCampaignJob({ campaignId });

  logger.info('Campaign launch job enqueued', { campaignId, jobId: job.jobId, mode: job.mode });

  return { campaign, jobId: job.jobId, mode: job.mode };
}

/** Mark campaign as completed when all communications are terminal */
export async function checkCampaignCompletion(campaignId: string): Promise<void> {
  const pending = await Communication.countDocuments({
    campaignId,
    status: { $in: ['PENDING', 'SENT'] },
  });

  if (pending === 0) {
    await Campaign.findByIdAndUpdate(campaignId, {
      status: 'Completed',
      completedAt: new Date(),
    });
  }
}

/** Personalize message preview for a sample customer */
export async function getMessagePreview(campaignId: string): Promise<string | null> {
  const campaign = await Campaign.findById(campaignId);
  if (!campaign) return null;

  const segment = await Segment.findById(campaign.audienceSegmentId);
  if (!segment) return campaign.message;

  const customers = await findCustomersByCriteria(segment.criteria);
  const sampleCustomer = customers[0] || (await Customer.findOne());

  if (sampleCustomer) {
    return personalizeWithName(campaign.message, sampleCustomer.name);
  }

  return campaign.message;
}
