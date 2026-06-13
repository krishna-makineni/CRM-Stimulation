import mongoose, { Document, Schema } from 'mongoose';
import { LoyaltyTier } from '../types';

export interface ICustomer extends Document {
  name: string;
  email: string;
  phone: string;
  city: string;
  totalSpend: number;
  loyaltyTier: LoyaltyTier;
  embedding?: number[];
  createdAt: Date;
}

const customerSchema = new Schema<ICustomer>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    city: { type: String, required: true },
    totalSpend: { type: Number, default: 0 },
    loyaltyTier: {
      type: String,
      enum: ['Bronze', 'Silver', 'Gold', 'Platinum'],
      default: 'Bronze',
    },
    embedding: { type: [Number], select: false },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

customerSchema.index({ city: 1 });
customerSchema.index({ totalSpend: -1 });
customerSchema.index({ loyaltyTier: 1 });

export const Customer = mongoose.model<ICustomer>('Customer', customerSchema);
