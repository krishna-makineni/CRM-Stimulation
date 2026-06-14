import { z } from 'zod';

export const customerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  city: z.string().min(1),
  totalSpend: z.number().optional(),
  loyaltyTier: z.enum(['Bronze', 'Silver', 'Gold', 'Platinum']).optional(),
});

export const orderSchema = z.object({
  customerId: z.string(),
  products: z.array(z.string()).min(1),
  orderAmount: z.number().positive(),
  orderDate: z.string().optional(),
});

export const segmentSchema = z.object({
  name: z.string().min(1),
  criteria: z.record(z.unknown()),
  naturalLanguageQuery: z.string().optional(),
  insights: z.record(z.unknown()).optional(),
  campaignRecommendations: z.array(z.record(z.unknown())).optional(),
});

export const segmentParseSchema = z.object({
  query: z.string().min(1),
  refinementContext: z.string().optional(),
});

export const segmentApproveSchema = z.object({
  name: z.string().optional(),
  criteria: z.record(z.unknown()),
  naturalLanguageQuery: z.string().optional(),
  insights: z.record(z.unknown()).optional(),
  campaignRecommendations: z.array(z.record(z.unknown())).optional(),
});

export const segmentPreviewSchema = z.object({
  criteria: z.record(z.unknown()),
});

export const campaignSchema = z.object({
  name: z.string().min(1),
  objective: z.string().min(1),
  audienceSegmentId: z.string(),
  message: z.string().min(1),
  channel: z.enum(['WhatsApp', 'SMS', 'Email', 'RCS']),
  status: z.enum(['Draft', 'Scheduled', 'Running', 'Completed']).optional(),
  tone: z.string().optional(),
  offer: z.string().optional(),
});

export const generateMessageSchema = z.object({
  objective: z.string(),
  audienceDescription: z.string(),
  tone: z.string().default('friendly'),
  offer: z.string().optional(),
  channel: z.enum(['WhatsApp', 'SMS', 'Email', 'RCS']).default('WhatsApp'),
});

export const recommendChannelSchema = z.object({
  objective: z.string(),
});

export const copilotMessageSchema = z.object({
  message: z.string().min(1),
});

export const receiptSchema = z.object({
  communicationId: z.string(),
  campaignId: z.string(),
  customerId: z.string(),
  status: z.enum(['SENT', 'DELIVERED', 'FAILED', 'OPENED', 'READ', 'CLICKED']),
  timestamp: z.string(),
  failureReason: z.string().optional(),
});
