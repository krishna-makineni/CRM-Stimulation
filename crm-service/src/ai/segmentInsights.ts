import { ICustomer } from '../models/Customer';
import { SegmentInsights } from '../models/Segment';

export function buildSegmentInsights(customers: ICustomer[]): SegmentInsights {
  if (customers.length === 0) {
    return { topCities: [], tierBreakdown: [], avgSpend: 0, summary: 'No customers match this segment.' };
  }

  const cityMap: Record<string, number> = {};
  const tierMap: Record<string, number> = {};
  let totalSpend = 0;

  customers.forEach((c) => {
    cityMap[c.city] = (cityMap[c.city] || 0) + 1;
    tierMap[c.loyaltyTier] = (tierMap[c.loyaltyTier] || 0) + 1;
    totalSpend += c.totalSpend;
  });

  const topCities = Object.entries(cityMap)
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const tierBreakdown = Object.entries(tierMap).map(([tier, count]) => ({ tier, count }));
  const avgSpend = Math.round(totalSpend / customers.length);

  const topCity = topCities[0]?.city || 'various cities';
  const summary = `${customers.length} customers, avg spend ₹${avgSpend.toLocaleString('en-IN')}, mostly from ${topCity}.`;

  return { topCities, tierBreakdown, avgSpend, summary };
}
