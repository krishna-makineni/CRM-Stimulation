import mongoose, { Document, Schema } from 'mongoose';
import { Channel, SegmentCriteria } from '../types';

export type SegmentStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected';

export interface SegmentInsights {
  topCities: { city: string; count: number }[];
  tierBreakdown: { tier: string; count: number }[];
  avgSpend: number;
  summary: string;
}

export interface CampaignRecommendation {
  channel: Channel;
  reason: string;
  suggestedObjective: string;
  suggestedOffer?: string;
}

export interface ISegment extends Document {
  name: string;
  criteria: SegmentCriteria;
  customerCount: number;
  naturalLanguageQuery?: string;
  status: SegmentStatus;
  insights?: SegmentInsights;
  campaignRecommendations?: CampaignRecommendation[];
  refinementHistory?: { query: string; criteria: SegmentCriteria }[];
  createdAt: Date;
}

const segmentSchema = new Schema<ISegment>(
  {
    name: { type: String, required: true },
    criteria: { type: Schema.Types.Mixed, required: true },
    customerCount: { type: Number, default: 0 },
    naturalLanguageQuery: { type: String },
    status: {
      type: String,
      enum: ['draft', 'pending_approval', 'approved', 'rejected'],
      default: 'draft',
    },
    insights: { type: Schema.Types.Mixed },
    campaignRecommendations: [{ type: Schema.Types.Mixed }],
    refinementHistory: [{ type: Schema.Types.Mixed }],
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

segmentSchema.index({ status: 1 });

export const Segment = mongoose.model<ISegment>('Segment', segmentSchema);
