import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IOrder extends Document {
  customerId: Types.ObjectId;
  products: string[];
  orderAmount: number;
  orderDate: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    products: [{ type: String, required: true }],
    orderAmount: { type: Number, required: true },
    orderDate: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

orderSchema.index({ customerId: 1, orderDate: -1 });
orderSchema.index({ orderDate: -1 });

export const Order = mongoose.model<IOrder>('Order', orderSchema);
