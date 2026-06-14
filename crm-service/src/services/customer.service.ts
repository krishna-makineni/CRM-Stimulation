import { Customer } from '../models/Customer';
import { Order } from '../models/Order';
import { parse } from 'csv-parse/sync';

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

function parseNumber(value: string | undefined, fallback = 0): number {
  if (!value) return fallback;
  const parsed = Number(value.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeLoyaltyTier(value: string | undefined): 'Bronze' | 'Silver' | 'Gold' | 'Platinum' {
  const tier = value?.trim().toLowerCase();
  if (tier === 'platinum') return 'Platinum';
  if (tier === 'gold') return 'Gold';
  if (tier === 'silver') return 'Silver';
  return 'Bronze';
}

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
      const name = getCsvValue(row, 'name', 'customerName', 'customer');
      const email = getCsvValue(row, 'email', 'customerEmail', 'emailAddress')?.toLowerCase();
      const phone = getCsvValue(row, 'phone', 'mobile', 'mobileNumber', 'phoneNumber') ?? '';
      const city = getCsvValue(row, 'city', 'location') ?? '';

      if (!name) throw new Error('Missing customer name');
      if (!email) throw new Error('Missing customer email');
      if (!city) throw new Error('Missing customer city');

      const totalSpend = getCsvValue(row, 'totalSpend', 'totalSpent', 'spend', 'lifetimeValue');
      const customer = await Customer.findOneAndUpdate(
        { email },
        {
          $set: {
            name,
            email,
            phone,
            city,
            loyaltyTier: normalizeLoyaltyTier(getCsvValue(row, 'loyaltyTier', 'tier')),
            ...(totalSpend ? { totalSpend: parseNumber(totalSpend) } : {}),
          },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
      imported.push(customer);
    } catch (error) {
      errors.push({ row: index + 1, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  return { imported: imported.length, errors };
}
