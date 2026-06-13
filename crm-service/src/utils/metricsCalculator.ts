import { Customer } from '../models/Customer';
import { Campaign } from '../models/Campaign';
import { Communication } from '../models/Communication';
import { Channel } from '../types';

export async function getChannelPerformance(): Promise<
  { channel: Channel; openRate: number; clickRate: number; total: number }[]
> {
  const channels: Channel[] = ['WhatsApp', 'SMS', 'Email', 'RCS'];
  const results = [];

  for (const channel of channels) {
    const comms = await Communication.find({
      channel,
      status: { $in: ['DELIVERED', 'OPENED', 'READ', 'CLICKED', 'SENT'] },
    });

    const total = comms.length;
    const opened = comms.filter((c) =>
      ['OPENED', 'READ', 'CLICKED'].includes(c.status)
    ).length;
    const clicked = comms.filter((c) => c.status === 'CLICKED').length;
    const delivered = comms.filter((c) =>
      ['DELIVERED', 'OPENED', 'READ', 'CLICKED'].includes(c.status)
    ).length;

    results.push({
      channel,
      openRate: delivered > 0 ? Math.round((opened / delivered) * 100) : getDefaultOpenRate(channel),
      clickRate: opened > 0 ? Math.round((clicked / opened) * 100) : getDefaultClickRate(channel),
      total,
    });
  }

  return results;
}

function getDefaultOpenRate(channel: Channel): number {
  const rates: Record<Channel, number> = {
    WhatsApp: 72,
    SMS: 45,
    Email: 40,
    RCS: 55,
  };
  return rates[channel];
}

function getDefaultClickRate(channel: Channel): number {
  const rates: Record<Channel, number> = {
    WhatsApp: 18,
    SMS: 8,
    Email: 12,
    RCS: 14,
  };
  return rates[channel];
}

export async function getCampaignTimeline(campaignId: string) {
  const communications = await Communication.find({ campaignId });

  const timeline: Record<string, { sent: number; delivered: number; opened: number; clicked: number }> = {};

  communications.forEach((c) => {
    const date = (c.sentAt || c.createdAt).toISOString().split('T')[0];
    if (!timeline[date]) {
      timeline[date] = { sent: 0, delivered: 0, opened: 0, clicked: 0 };
    }
    if (c.sentAt) timeline[date].sent++;
    if (c.deliveredAt) timeline[date].delivered++;
    if (c.openedAt) timeline[date].opened++;
    if (c.clickedAt) timeline[date].clicked++;
  });

  return Object.entries(timeline).map(([date, stats]) => ({ date, ...stats }));
}

export async function getCampaignAnalytics(campaignId: string) {
  const communications = await Communication.find({ campaignId });
  const total = communications.length;

  const counts = {
    pending: 0,
    sent: 0,
    delivered: 0,
    failed: 0,
    opened: 0,
    read: 0,
    clicked: 0,
  };

  communications.forEach((c) => {
    const key = c.status.toLowerCase() as keyof typeof counts;
    if (key in counts) counts[key]++;
  });

  const sent = counts.sent + counts.delivered + counts.opened + counts.read + counts.clicked;
  const delivered = counts.delivered + counts.opened + counts.read + counts.clicked;
  const opened = counts.opened + counts.read + counts.clicked;

  return {
    total,
    ...counts,
    deliveryRate: sent > 0 ? Math.round((delivered / sent) * 100) : 0,
    openRate: delivered > 0 ? Math.round((opened / delivered) * 100) : 0,
    clickRate: opened > 0 ? Math.round((counts.clicked / opened) * 100) : 0,
    timeline: await getCampaignTimeline(campaignId),
  };
}

export async function getDashboardMetrics() {
  const [
    totalCustomers,
    totalCampaigns,
    statusCounts,
    channelPerformance,
  ] = await Promise.all([
    Customer.countDocuments(),
    Campaign.countDocuments(),
    Communication.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    getChannelPerformance(),
  ]);

  const statusMap: Record<string, number> = {};
  statusCounts.forEach((s: { _id: string; count: number }) => {
    statusMap[s._id] = s.count;
  });

  const sent = (statusMap.SENT || 0) + (statusMap.DELIVERED || 0) +
    (statusMap.OPENED || 0) + (statusMap.READ || 0) + (statusMap.CLICKED || 0);
  const delivered = (statusMap.DELIVERED || 0) + (statusMap.OPENED || 0) +
    (statusMap.READ || 0) + (statusMap.CLICKED || 0);

  return {
    totalCustomers,
    totalCampaigns,
    messagesSent: sent + (statusMap.FAILED || 0),
    delivered: delivered,
    failed: statusMap.FAILED || 0,
    opened: statusMap.OPENED || 0,
    read: statusMap.READ || 0,
    clicked: statusMap.CLICKED || 0,
    channelPerformance,
  };
}

export async function getCampaignComparison() {
  const campaigns = await Campaign.find({ status: { $in: ['Running', 'Completed'] } })
    .sort({ createdAt: -1 })
    .limit(10);

  const comparison = await Promise.all(
    campaigns.map(async (campaign) => {
      const analytics = await getCampaignAnalytics(campaign._id.toString());
      return {
        id: campaign._id,
        name: campaign.name,
        channel: campaign.channel,
        status: campaign.status,
        ...analytics,
      };
    })
  );

  return comparison;
}
