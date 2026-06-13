import type { Channel } from '../constants/channels';
import type { CampaignStatus, CommunicationStatus, SegmentStatus } from '../constants/events';
import type { LoyaltyTier } from '../types';

export interface Customer {
  _id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  totalSpend: number;
  loyaltyTier: LoyaltyTier;
  createdAt: string;
}

export interface Order {
  _id: string;
  customerId: Customer | string;
  products: string[];
  orderAmount: number;
  orderDate: string;
}

export interface Segment {
  _id: string;
  name: string;
  criteria: Record<string, unknown>;
  customerCount: number;
  naturalLanguageQuery?: string;
  status?: SegmentStatus;
  insights?: { summary: string; topCities: { city: string; count: number }[]; avgSpend: number };
  campaignRecommendations?: { channel: string; reason: string; suggestedObjective: string }[];
  createdAt: string;
}

export interface Campaign {
  _id: string;
  name: string;
  objective: string;
  audienceSegmentId: Segment | string;
  message: string;
  channel: Channel;
  status: CampaignStatus;
  tone?: string;
  offer?: string;
  launchedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface Communication {
  _id: string;
  campaignId: string;
  customerId: Customer | string;
  channel: Channel;
  status: string;
  message: string;
  sentAt?: string;
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
}

export interface SendRequest {
  communicationId: string;
  campaignId: string;
  customerId: string;
  customerName: string;
  channel: Channel;
  message: string;
  callbackUrl: string;
}

export interface ReceiptPayload {
  communicationId: string;
  campaignId: string;
  customerId: string;
  status: CommunicationStatus;
  timestamp: string;
  failureReason?: string;
}

export interface DashboardMetrics {
  totalCustomers: number;
  totalCampaigns: number;
  messagesSent: number;
  delivered: number;
  failed: number;
  opened: number;
  read: number;
  clicked: number;
  channelPerformance: ChannelPerformance[];
}

export interface ChannelPerformance {
  channel: Channel;
  openRate: number;
  clickRate: number;
  total: number;
}

export interface CopilotSession {
  id: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
  steps: { step: number; title: string; status: string; result?: unknown }[];
  awaitingApproval: boolean;
  campaignPreview?: {
    name: string;
    objective: string;
    segmentName: string;
    segmentCriteria: Record<string, unknown>;
    segmentQuery: string;
    customerCount: number;
    channel: Channel;
    channelReason: string;
    tone?: string;
    offer?: string;
    message: string;
    sampleCustomerName?: string;
    sentPreview?: string;
  };
  reviewStage?: 'preview' | 'details';
  launchedCampaignId?: string;
  savedDraftCampaignId?: string;
}
