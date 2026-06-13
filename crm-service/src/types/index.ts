export type { SegmentInsights, CampaignRecommendation } from '../models/Segment';

export type LoyaltyTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
export type CampaignStatus = 'Draft' | 'Scheduled' | 'Running' | 'Completed';
export type Channel = 'WhatsApp' | 'SMS' | 'Email' | 'RCS';
export type CommunicationStatus =
  | 'PENDING'
  | 'SENT'
  | 'DELIVERED'
  | 'FAILED'
  | 'OPENED'
  | 'READ'
  | 'CLICKED';

export interface FilterOperator {
  operator: '>' | '>=' | '<' | '<=' | '=' | '!=';
  value: number | string;
}

export interface SegmentCriteria {
  totalSpend?: FilterOperator;
  inactiveDays?: number;
  city?: string;
  loyaltyTier?: LoyaltyTier;
  minOrders?: number;
  productCategory?: string;
  productKeyword?: string;
  vectorQuery?: string;
}

export interface CopilotStep {
  step: number;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
  result?: unknown;
}

export interface CopilotSession {
  id: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
  steps: CopilotStep[];
  segmentId?: string;
  campaignPreview?: {
    name: string;
    objective: string;
    segmentName: string;
    segmentCriteria: SegmentCriteria;
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
  awaitingApproval: boolean;
  reviewStage?: 'preview' | 'details';
  launchedCampaignId?: string;
  savedDraftCampaignId?: string;
}
