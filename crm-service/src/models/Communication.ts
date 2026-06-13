import mongoose, { Document, Schema, Types } from 'mongoose';
import { Channel, CommunicationStatus } from '../types';

export interface ICommunication extends Document {
  campaignId: Types.ObjectId;
  customerId: Types.ObjectId;
  channel: Channel;
  status: CommunicationStatus;
  message: string;
  sentAt?: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  readAt?: Date;
  clickedAt?: Date;
  failedAt?: Date;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const communicationSchema = new Schema<ICommunication>(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    channel: {
      type: String,
      enum: ['WhatsApp', 'SMS', 'Email', 'RCS'],
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'SENT', 'DELIVERED', 'FAILED', 'OPENED', 'READ', 'CLICKED'],
      default: 'PENDING',
    },
    message: { type: String, required: true },
    sentAt: { type: Date },
    deliveredAt: { type: Date },
    openedAt: { type: Date },
    readAt: { type: Date },
    clickedAt: { type: Date },
    failedAt: { type: Date },
    failureReason: { type: String },
  },
  { timestamps: true }
);

communicationSchema.index({ campaignId: 1, status: 1 });
communicationSchema.index({ customerId: 1 });

export const Communication = mongoose.model<ICommunication>('Communication', communicationSchema);
