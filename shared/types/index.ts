import type { CampaignStatus, CommunicationStatus, SegmentStatus } from '../constants/events';
import type { Channel } from '../constants/channels';

export type { Channel, CampaignStatus, CommunicationStatus, SegmentStatus };

export type LoyaltyTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

export type {
  Customer,
  Order,
  Segment,
  Campaign,
  Communication,
  SendRequest,
  ReceiptPayload,
  DashboardMetrics,
  ChannelPerformance,
  CopilotSession,
} from '../interfaces';
