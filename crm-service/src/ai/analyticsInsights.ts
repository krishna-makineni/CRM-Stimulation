import { openai } from '../config/openai';
import { getDashboardMetrics, getCampaignComparison } from '../utils/metricsCalculator';
import { logger } from '../utils/logger';

/** Generate OpenAI narrative insights for the analytics dashboard */
export async function generateDashboardInsights(): Promise<{
  summary: string;
  recommendations: string[];
  highlights: string[];
}> {
  const metrics = await getDashboardMetrics();
  const comparison = await getCampaignComparison();

  const dataContext = JSON.stringify({ metrics, recentCampaigns: comparison.slice(0, 5) });

  if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a marketing analytics advisor. Return JSON:
{
  "summary": "2-3 sentence performance overview",
  "recommendations": ["actionable tip 1", "tip 2", "tip 3"],
  "highlights": ["key metric highlight 1", "highlight 2"]
}`,
          },
          { role: 'user', content: `Analyze this CRM marketing data:\n${dataContext}` },
        ],
        temperature: 0.5,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (content) return JSON.parse(content);
    } catch (error) {
      logger.warn('Dashboard insights generation failed', { error });
    }
  }

  const deliveryRate = metrics.messagesSent > 0
    ? Math.round((metrics.delivered / metrics.messagesSent) * 100)
    : 0;
  const openRate = metrics.delivered > 0
    ? Math.round((metrics.opened / metrics.delivered) * 100)
    : 0;

  return {
    summary: `You have ${metrics.totalCustomers} customers and ${metrics.totalCampaigns} campaigns. ${metrics.messagesSent} messages sent with ${deliveryRate}% delivery and ${openRate}% open rate.`,
    recommendations: [
      'Try WhatsApp for win-back campaigns — historically highest open rates.',
      'Segment inactive high-spenders for personalized re-engagement.',
      'A/B test message tone between friendly and urgent for click-through.',
    ],
    highlights: [
      `${metrics.clicked} total clicks across campaigns`,
      `${metrics.failed} failed deliveries — review channel health`,
      `Top channel: ${metrics.channelPerformance.sort((a, b) => b.openRate - a.openRate)[0]?.channel || 'WhatsApp'}`,
    ],
  };
}
