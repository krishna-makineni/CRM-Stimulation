import { Types } from 'mongoose';
import { Customer, ICustomer } from '../models/Customer';
import { Order } from '../models/Order';
import { SegmentCriteria } from '../types';
import { getEmbedding, cosineSimilarity } from '../services/embedding.service';

/**
 * Converts structured segment criteria into MongoDB queries and returns matching customers.
 */
export async function findCustomersByCriteria(criteria: SegmentCriteria): Promise<ICustomer[]> {
  const customerFilter: Record<string, unknown> = {};

  if (criteria.totalSpend) {
    const { operator, value } = criteria.totalSpend;
    const mongoOp = mapOperator(operator);
    customerFilter.totalSpend = { [mongoOp]: value };
  }

  if (criteria.city) {
    customerFilter.city = { $regex: new RegExp(criteria.city, 'i') };
  }

  if (criteria.loyaltyTier) {
    customerFilter.loyaltyTier = criteria.loyaltyTier;
  }

  let customerIds: Types.ObjectId[] | null = null;

  if (criteria.inactiveDays !== undefined) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - criteria.inactiveDays);

    const activeCustomerIds = await Order.distinct('customerId', {
      orderDate: { $gte: cutoffDate },
    });

    const inactiveCustomers = await Customer.find({
      _id: { $nin: activeCustomerIds },
    }).select('_id');

    customerIds = inactiveCustomers.map((c) => c._id);
  }

  if (criteria.minOrders !== undefined) {
    const orderCounts = await Order.aggregate([
      { $group: { _id: '$customerId', count: { $sum: 1 } } },
      { $match: { count: { $gt: criteria.minOrders } } },
    ]);

    const orderCustomerIds = orderCounts.map((o) => o._id as Types.ObjectId);

    customerIds = customerIds
      ? customerIds.filter((id) => orderCustomerIds.some((oid) => oid.equals(id)))
      : orderCustomerIds;
  }

  if (criteria.productCategory || criteria.productKeyword) {
    const keyword = criteria.productCategory || criteria.productKeyword || '';
    const productOrders = await Order.find({
      products: { $regex: new RegExp(keyword, 'i') },
    }).distinct('customerId');

    customerIds = customerIds
      ? customerIds.filter((id) => productOrders.some((oid) => oid.equals(id)))
      : productOrders;
  }

  if (customerIds !== null) {
    customerFilter._id = { $in: customerIds };
  }

  let query: any = Customer.find(customerFilter);
  if (criteria.vectorQuery) {
    query = query.select('+embedding');
  }

  const customers = (await query.sort({ totalSpend: -1 })) as ICustomer[];

  if (criteria.vectorQuery) {
    try {
      const queryEmbedding = await getEmbedding(criteria.vectorQuery);
      if (queryEmbedding && queryEmbedding.length > 0) {
        const scored = customers.map((c) => {
          const score = c.embedding && c.embedding.length > 0
            ? cosineSimilarity(queryEmbedding, c.embedding)
            : 0;
          return { customer: c, score };
        });

        // Sort by similarity score descending
        return scored
          .sort((a, b) => b.score - a.score)
          .map((s) => s.customer);
      }
    } catch (err) {
      // Fallback to default search on failure
    }
  }

  return customers;
}

export async function countCustomersByCriteria(criteria: SegmentCriteria): Promise<number> {
  const customers = await findCustomersByCriteria(criteria);
  return customers.length;
}

function mapOperator(op: string): string {
  const map: Record<string, string> = {
    '>': '$gt',
    '>=': '$gte',
    '<': '$lt',
    '<=': '$lte',
    '=': '$eq',
    '!=': '$ne',
  };
  return map[op] || '$eq';
}
