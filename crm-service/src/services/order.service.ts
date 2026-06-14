import { Order } from '../models/Order';
import { Customer } from '../models/Customer';
import { parse } from 'csv-parse/sync';
import { Types } from 'mongoose';

function getCsvValue(row: Record<string, string>, ...keys: string[]): string | undefined {
  const normalized = new Map(
    Object.entries(row).map(([key, value]) => [
      key.replace(/^\uFEFF/, '').toLowerCase().replace(/[^a-z0-9]/g, ''),
      value,
    ])
  );

  for (const key of keys) {
    const value = normalized.get(key.toLowerCase().replace(/[^a-z0-9]/g, ''))?.trim();
    if (value) return value;
  }

  return undefined;
}

function parseNumber(value: string | undefined): number {
  if (!value) return 0;
  const parsed = Number(value.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function getOrders(params: {
  page?: string;
  limit?: string;
  customerId?: string;
}) {
  const { page = '1', limit = '20', customerId } = params;
  const filter: Record<string, unknown> = {};
  if (customerId) filter.customerId = customerId;

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('customerId', 'name email')
      .sort({ orderDate: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Order.countDocuments(filter),
  ]);

  return { orders, total, page: pageNum, totalPages: Math.ceil(total / limitNum) };
}

export async function createOrder(data: {
  customerId: string;
  products: string[];
  orderAmount: number;
  orderDate?: string;
}) {
  const order = await Order.create({
    ...data,
    orderDate: data.orderDate ? new Date(data.orderDate) : new Date(),
  });

  await Customer.findByIdAndUpdate(data.customerId, {
    $inc: { totalSpend: data.orderAmount },
  });

  return order;
}

export async function importOrdersFromCsv(buffer: Buffer) {
  const records = parse(buffer.toString(), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  const imported = [];
  const errors = [];

  for (const [index, row] of records.entries()) {
    try {
      let customerId = getCsvValue(row, 'customerId', 'customer_id', 'customer id');

      const email = getCsvValue(row, 'email', 'customerEmail', 'customer email', 'emailAddress')?.toLowerCase();
      if (!customerId && email) {
        const customer = await Customer.findOne({ email });
        if (!customer) throw new Error(`Customer not found: ${email}`);
        customerId = customer._id.toString();
      }

      if (!customerId) throw new Error('Missing customerId or customer email');
      if (!Types.ObjectId.isValid(customerId)) throw new Error(`Invalid customerId: ${customerId}`);

      const customerExists = await Customer.exists({ _id: customerId });
      if (!customerExists) throw new Error(`Customer not found: ${customerId}`);

      const products = (getCsvValue(row, 'products', 'product', 'items', 'item') || 'Imported order')
        .split(/[;,|]/)
        .map((p) => p.trim())
        .filter(Boolean);
      const orderAmount = parseNumber(getCsvValue(row, 'orderAmount', 'amount', 'total', 'orderTotal'));
      if (orderAmount <= 0) throw new Error('Order amount must be greater than 0');

      const orderDate = getCsvValue(row, 'orderDate', 'date', 'purchaseDate', 'createdAt');

      const order = await Order.create({
        customerId,
        products,
        orderAmount,
        orderDate: orderDate ? new Date(orderDate) : new Date(),
      });

      await Customer.findByIdAndUpdate(customerId, { $inc: { totalSpend: orderAmount } });
      imported.push(order);
    } catch (error) {
      errors.push({ row: index + 1, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  return { imported: imported.length, errors };
}
