import { openai } from '../config/openai';
import { SegmentCriteria } from '../types';
import { logger } from '../utils/logger';
import { parseSegmentFallback } from './nlpSegmentation';

const AMBIGUITY_PROMPT = `You are a marketing CRM segmentation assistant. Analyze the query and return JSON:
{
  "criteria": { optional filter fields },
  "ambiguous": true/false,
  "confidence": 0.0-1.0,
  "clarifyingQuestions": ["question if ambiguous"]
}

Criteria fields: totalSpend, inactiveDays, city, loyaltyTier, minOrders, productCategory.
Mark ambiguous=true if the query is vague, missing key thresholds, or could mean multiple segments.`;

export interface SegmentParseResult {
  criteria: SegmentCriteria;
  ambiguous: boolean;
  clarifyingQuestions?: string[];
  confidence: number;
}

/** Parse NL query with ambiguity detection for conversational refinement */
export async function parseSegmentQueryWithAmbiguity(naturalLanguage: string): Promise<SegmentParseResult> {
  if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: AMBIGUITY_PROMPT },
          { role: 'user', content: naturalLanguage },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        return {
          criteria: parsed.criteria || {},
          ambiguous: parsed.ambiguous === true,
          clarifyingQuestions: parsed.clarifyingQuestions,
          confidence: parsed.confidence ?? 0.8,
        };
      }
    } catch (error) {
      logger.warn('OpenAI ambiguity parse failed', { error });
    }
  }

  const criteria = parseSegmentFallback(naturalLanguage);
  const isEmpty = Object.keys(criteria).length === 0;

  return {
    criteria,
    ambiguous: isEmpty,
    clarifyingQuestions: isEmpty
      ? ['What spend threshold, city, or inactivity period should I use?']
      : undefined,
    confidence: isEmpty ? 0.3 : 0.7,
  };
}
