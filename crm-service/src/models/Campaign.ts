import mongoose, { Document, Schema, Types } from 'mongoose';
import { CampaignStatus, Channel } from '../types';

export interface ICampaign extends Document {
  name: string;
  objective: string;
  audienceSegmentId: Types.ObjectId;
  message: string;
  channel: Channel;
  status: CampaignStatus;
  tone?: string;
  offer?: string;
  launchedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

const campaignSchema = new Schema<ICampaign>(
  {
    name: { type: String, required: true },
    objective: { type: String, required: true },
    audienceSegmentId: { type: Schema.Types.ObjectId, ref: 'Segment', required: true },
    message: { type: String, required: true },
    channel: {
      type: String,
      enum: ['WhatsApp', 'SMS', 'Email', 'RCS'],
      required: true,
    },
    status: {
      type: String,
      enum: ['Draft', 'Scheduled', 'Running', 'Completed'],
      default: 'Draft',
    },
    tone: { type: String },
    offer: { type: String },
    launchedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

campaignSchema.index({ status: 1 });
campaignSchema.index({ createdAt: -1 });

export const Campaign = mongoose.model<ICampaign>('Campaign', campaignSchema);
