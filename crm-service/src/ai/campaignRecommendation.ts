import { openai } from '../config/openai';
import { ICustomer } from '../models/Customer';
import { CampaignRecommendation } from '../models/Segment';
import { Channel, SegmentCriteria } from '../types';
import { getChannelPerformance } from '../utils/metricsCalculator';
import { logger } from '../utils/logger';

/** Recommend channel with reasoning based on performance data */
export async function recommendChannel(
  channelStats: { channel: Channel; openRate: number; clickRate: number }[],
  objective: string
): Promise<{ channel: Channel; reason: string }> {
  if (channelStats.length === 0) {
    return { channel: 'WhatsApp', reason: 'WhatsApp typically has the highest engagement for Indian consumers.' };
  }

  const sorted = [...channelStats].sort((a, b) => b.openRate - a.openRate);
  const best = sorted[0];

  if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Recommend the best marketing channel. Return JSON: {"channel":"WhatsApp|SMS|Email|RCS","reason":"brief explanation"}',
          },
          {
            role: 'user',
            content: `Objective: ${objective}\nChannel stats: ${JSON.stringify(channelStats)}`,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (content) return JSON.parse(content);
    } catch (error) {
      logger.warn('Channel recommendation AI failed', { error });
    }
  }

  return {
    channel: best.channel,
    reason: `${best.channel} has the highest open rate at ${best.openRate}% based on historical campaign data.`,
  };
}

export async function buildCampaignRecommendations(
  customers: ICustomer[],
  criteria: SegmentCriteria
): Promise<CampaignRecommendation[]> {
  const channelStats = await getChannelPerformance();
  const objective = buildObjectiveFromCriteria(criteria);
  const channelRec = await recommendChannel(channelStats, objective);

  const recommendations: CampaignRecommendation[] = [
    {
      channel: channelRec.channel as Channel,
      reason: channelRec.reason,
      suggestedObjective: objective,
      suggestedOffer: criteria.inactiveDays
        ? '15% welcome-back discount on next order'
        : 'Exclusive early access to new collection',
    },
  ];

  if (channelRec.channel !== 'Email') {
    recommendations.push({
      channel: 'Email',
      reason: 'Good for detailed product storytelling and longer offers.',
      suggestedObjective: `${objective} — detailed product showcase`,
    });
  }

  return recommendations;
}

function buildObjectiveFromCriteria(criteria: SegmentCriteria): string {
  const parts: string[] = [];
  if (criteria.inactiveDays) parts.push(`Win back customers inactive ${criteria.inactiveDays}+ days`);
  if (criteria.loyaltyTier) parts.push(`Target ${criteria.loyaltyTier} tier`);
  if (criteria.city) parts.push(`Engage shoppers in ${criteria.city}`);
  if (criteria.productCategory) parts.push(`Promote ${criteria.productCategory} products`);
  if (criteria.totalSpend) parts.push('Reward high-value customers');
  return parts.length > 0 ? parts.join('. ') : 'Drive engagement with targeted offer';
}
