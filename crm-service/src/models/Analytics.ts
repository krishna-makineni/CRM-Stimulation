import mongoose, { Document, Schema, Types } from 'mongoose';
import { CommunicationStatus } from '../types';

export interface IAnalyticsEvent extends Document {
  campaignId: Types.ObjectId;
  communicationId: Types.ObjectId;
  customerId: Types.ObjectId;
  eventType: CommunicationStatus;
  channel: string;
  timestamp: Date;
  failureReason?: string;
  metadata?: Record<string, unknown>;
}

const analyticsSchema = new Schema<IAnalyticsEvent>(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
    communicationId: { type: Schema.Types.ObjectId, ref: 'Communication', required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    eventType: {
      type: String,
      enum: ['SENT', 'DELIVERED', 'FAILED', 'OPENED', 'READ', 'CLICKED'],
      required: true,
    },
    channel: { type: String, required: true },
    timestamp: { type: Date, required: true },
    failureReason: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

analyticsSchema.index({ campaignId: 1, eventType: 1 });
analyticsSchema.index({ timestamp: -1 });

export const Analytics = mongoose.model<IAnalyticsEvent>('AnalyticsEvent', analyticsSchema);
