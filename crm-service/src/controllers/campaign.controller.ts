import { Request, Response } from 'express';
import * as campaignService from '../services/campaign.service';
import { generateCampaignMessage } from '../ai/messageGenerator';
import { recommendChannel } from '../ai/campaignRecommendation';
import { getChannelPerformance } from '../services/analytics.service';
import { getCampaignJobResult } from '../queues/campaign.queue';
import {
  campaignSchema,
  generateMessageSchema,
  recommendChannelSchema,
  copilotMessageSchema,
} from '../middleware/validation';
import {
  createSession,
  getSession,
  processCopilotMessage,
} from '../ai/campaignCopilot';


export async function getCampaigns(req: Request, res: Response): Promise<void> {
  const campaigns = await campaignService.getCampaigns(req.query.status as string | undefined);
  res.json(campaigns);
}

export async function getCampaignById(req: Request, res: Response): Promise<void> {
  const result = await campaignService.getCampaignById(req.params.id as string);
  if (!result) {
    res.status(404).json({ error: 'Campaign not found' });
    return;
  }
  res.json(result);
}

export async function createCampaign(req: Request, res: Response): Promise<void> {
  const data = campaignSchema.parse(req.body);
  const campaign = await campaignService.createCampaign(data);
  res.status(201).json(campaign);
}

export async function updateCampaign(req: Request, res: Response): Promise<void> {
  const data = campaignSchema.partial().parse(req.body);
  const campaign = await campaignService.updateCampaign(req.params.id as string, data);
  if (!campaign) {
    res.status(404).json({ error: 'Campaign not found' });
    return;
  }
  res.json(campaign);
}

export async function launchCampaignHandler(req: Request, res: Response): Promise<void> {
  const result = await campaignService.launchCampaign(req.params.id as string);
  if (!result) {
    res.status(404).json({ error: 'Campaign not found' });
    return;
  }
  res.status(202).json({
    message: 'Campaign launch job queued',
    campaign: result.campaign,
    jobId: result.jobId,
    mode: result.mode,
  });
}

export async function getCampaignJobStatus(req: Request, res: Response): Promise<void> {
  const result = await getCampaignJobResult(req.params.jobId as string);
  if (!result) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }
  res.json(result);
}

export async function generateMessage(req: Request, res: Response): Promise<void> {
  const body = generateMessageSchema.parse(req.body);
  const message = await generateCampaignMessage(body);
  res.json({ message });
}

export async function recommendChannelHandler(req: Request, res: Response): Promise<void> {
  const { objective } = recommendChannelSchema.parse(req.body);
  const channelStats = await getChannelPerformance();
  const recommendation = await recommendChannel(channelStats, objective);
  res.json({ recommendation, channelStats });
}

export async function getMessagePreviewHandler(req: Request, res: Response): Promise<void> {
  const preview = await campaignService.getMessagePreview(req.params.id as string);
  if (!preview) {
    res.status(404).json({ error: 'Campaign not found' });
    return;
  }
  res.json({ preview });
}

export async function startCopilotSession(_req: Request, res: Response): Promise<void> {
  const session = createSession();
  res.json(session);
}

export async function getCopilotSession(req: Request, res: Response): Promise<void> {
  const session = getSession(req.params.sessionId as string);
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }
  res.json(session);
}

export async function sendCopilotMessage(req: Request, res: Response): Promise<void> {
  const { message } = copilotMessageSchema.parse(req.body);
  const sessionId = req.params.sessionId as string;
  if (!getSession(sessionId)) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  const session = await processCopilotMessage(sessionId, message);
  res.json(session);
}

