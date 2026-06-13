import { Request, Response } from 'express';
import {
  getDashboardMetrics,
  getCampaignComparison,
  getChannelPerformance,
  generateDashboardInsights,
} from '../services/analytics.service';

export async function getDashboard(_req: Request, res: Response): Promise<void> {
  const metrics = await getDashboardMetrics();
  res.json(metrics);
}

export async function getInsights(_req: Request, res: Response): Promise<void> {
  const insights = await generateDashboardInsights();
  res.json(insights);
}

export async function getComparison(_req: Request, res: Response): Promise<void> {
  const comparison = await getCampaignComparison();
  res.json(comparison);
}

export async function getChannels(_req: Request, res: Response): Promise<void> {
  const channels = await getChannelPerformance();
  res.json(channels);
}
