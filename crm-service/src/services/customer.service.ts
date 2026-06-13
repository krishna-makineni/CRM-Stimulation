import { Customer } from '../models/Customer';
import { Order } from '../models/Order';
import { parse } from 'csv-parse/sync';

export async function getCustomers(params: {
  search?: string;
  city?: string;
  tier?: string;
  page?: string;
  limit?: string;
}) {
  const { search, city, tier, page = '1', limit = '20' } = params;
  const filter: Record<string, unknown> = {};

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }
  if (city) filter.city = { $regex: city, $options: 'i' };
  if (tier) filter.loyaltyTier = tier;

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);

  const [customers, total] = await Promise.all([
    Customer.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Customer.countDocuments(filter),
  ]);

  return { customers, total, page: pageNum, totalPages: Math.ceil(total / limitNum) };
}

export async function getCustomerById(id: string) {
  const customer = await Customer.findById(id);
  if (!customer) return null;

  const orders = await Order.find({ customerId: customer._id }).sort({ orderDate: -1 });
  return { customer, orders };
}

export async function createCustomer(data: {
  name: string;
  email: string;
  phone: string;
  city: string;
  totalSpend?: number;
  loyaltyTier?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
}) {
  return Customer.create(data);
}

export async function importCustomersFromCsv(buffer: Buffer) {
  const records = parse(buffer.toString(), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  const imported = [];
  const errors = [];

  for (const [index, row] of records.entries()) {
    try {
      const customer = await Customer.create({
        name: row.name || row.Name,
        email: row.email || row.Email,
        phone: row.phone || row.Phone,
        city: row.city || row.City,
        totalSpend: parseFloat(row.totalSpend || row.TotalSpend || '0'),
        loyaltyTier: row.loyaltyTier || row.LoyaltyTier || 'Bronze',
      });
      imported.push(customer);
    } catch (error) {
      errors.push({ row: index + 1, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  return { imported: imported.length, errors };
}
