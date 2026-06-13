import { Order } from '../models/Order';
import { Customer } from '../models/Customer';
import { parse } from 'csv-parse/sync';

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
      let customerId = row.customerId || row.CustomerId;

      if (!customerId && row.email) {
        const customer = await Customer.findOne({ email: row.email });
        if (!customer) throw new Error(`Customer not found: ${row.email}`);
        customerId = customer._id.toString();
      }

      const products = (row.products || row.Products || '').split(';').map((p) => p.trim()).filter(Boolean);
      const orderAmount = parseFloat(row.orderAmount || row.OrderAmount || '0');

      const order = await Order.create({
        customerId,
        products,
        orderAmount,
        orderDate: row.orderDate ? new Date(row.orderDate) : new Date(),
      });

      await Customer.findByIdAndUpdate(customerId, { $inc: { totalSpend: orderAmount } });
      imported.push(order);
    } catch (error) {
      errors.push({ row: index + 1, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  return { imported: imported.length, errors };
}
