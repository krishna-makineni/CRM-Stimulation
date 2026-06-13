import { openai } from '../config/openai';
import { SegmentCriteria } from '../types';
import { logger } from '../utils/logger';

const SEGMENT_SYSTEM_PROMPT = `You are a marketing CRM segmentation assistant. Convert natural language queries into structured JSON filters.

Return ONLY valid JSON with these optional fields:
- totalSpend: { "operator": ">"|">="|"<"|"<="|"="|"!=", "value": number }
- inactiveDays: number (days since last purchase)
- city: string
- loyaltyTier: "Bronze"|"Silver"|"Gold"|"Platinum"
- minOrders: number (customers with MORE than this many orders)
- productCategory: string (product keyword to search)
- vectorQuery: string (use this for general semantic preferences, lifestyle descriptions, or complex interest-based criteria that do NOT fit into the structured fields above)

Examples:
"spent more than 10000" -> {"totalSpend":{"operator":">","value":10000}}
"inactive 60 days" -> {"inactiveDays":60}
"interested in luxury lifestyle and skincare" -> {"vectorQuery":"interested in luxury lifestyle and skincare"}
"from Hyderabad with 5+ orders" -> {"city":"Hyderabad","minOrders":5}`;

/** Parse natural language into structured segment criteria using OpenAI or fallback rules */
export async function parseSegmentQuery(naturalLanguage: string): Promise<SegmentCriteria> {
  if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SEGMENT_SYSTEM_PROMPT },
          { role: 'user', content: naturalLanguage },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        return JSON.parse(content) as SegmentCriteria;
      }
    } catch (error) {
      logger.warn('OpenAI segment parsing failed, using fallback', { error });
    }
  }

  return parseSegmentFallback(naturalLanguage);
}

/** Auto-generate segment name from query and criteria */
export async function generateSegmentName(query: string, criteria: SegmentCriteria): Promise<string> {
  if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Generate a short marketing segment name (3-5 words). Return only the name.' },
          { role: 'user', content: `Query: ${query}\nCriteria: ${JSON.stringify(criteria)}` },
        ],
        temperature: 0.4,
      });
      const name = response.choices[0]?.message?.content?.trim();
      if (name) return name.replace(/"/g, '');
    } catch (error) {
      logger.warn('Segment naming failed', { error });
    }
  }

  if (criteria.city) return `${criteria.city} Shoppers`;
  if (criteria.inactiveDays) return `Inactive ${criteria.inactiveDays}d Customers`;
  if (criteria.loyaltyTier) return `${criteria.loyaltyTier} Segment`;
  return 'AI Segment';
}

export function parseSegmentFallback(query: string): SegmentCriteria {
  const criteria: SegmentCriteria = {};
  const lower = query.toLowerCase();

  const spendMatch = lower.match(/(?:spent|spend|spending)\s+(?:more than|over|above)\s+₹?\s*(\d+)/i);
  if (spendMatch) {
    criteria.totalSpend = { operator: '>', value: parseInt(spendMatch[1], 10) };
  }

  const inactiveMatch = lower.match(/(?:inactive|not purchased|haven'?t bought).*?(\d+)\s*days/i);
  if (inactiveMatch) {
    criteria.inactiveDays = parseInt(inactiveMatch[1], 10);
  }

  const cityMatch = lower.match(/(?:from|in)\s+([A-Za-z]+)/i);
  if (cityMatch) {
    criteria.city = cityMatch[1];
  }

  const ordersMatch = lower.match(/(?:more than|over)\s+(\d+)\s*orders/i);
  if (ordersMatch) {
    criteria.minOrders = parseInt(ordersMatch[1], 10);
  }

  const tierMatch = lower.match(/(bronze|silver|gold|platinum|premium)/i);
  if (tierMatch) {
    const tier = tierMatch[1].toLowerCase();
    criteria.loyaltyTier = tier === 'premium' ? 'Platinum' : (tier.charAt(0).toUpperCase() + tier.slice(1)) as SegmentCriteria['loyaltyTier'];
  }

  const productMatch = lower.match(/(?:bought|purchased|buying)\s+(\w+)\s+products?/i);
  if (productMatch) {
    criteria.productCategory = productMatch[1];
  }

  return criteria;
}
