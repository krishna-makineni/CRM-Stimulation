export const COMMUNICATION_EVENTS = [
  'SENT',
  'DELIVERED',
  'FAILED',
  'OPENED',
  'READ',
  'CLICKED',
] as const;

export type CommunicationStatus = (typeof COMMUNICATION_EVENTS)[number];

export const CAMPAIGN_STATUSES = ['Draft', 'Scheduled', 'Running', 'Completed'] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export const SEGMENT_STATUSES = ['draft', 'pending_approval', 'approved', 'rejected'] as const;
export type SegmentStatus = (typeof SEGMENT_STATUSES)[number];
