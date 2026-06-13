import { Customer, Segment } from '@/types';
import { request } from './client';

export interface ParseSegmentResult {
  jobId?: string;
  status?: string;
  criteria: Record<string, unknown>;
  customerCount: number;
  customers: Customer[];
  ambiguous?: boolean;
  clarifyingQuestions?: string[];
  suggestedName?: string;
  insights?: { summary: string; topCities: { city: string; count: number }[]; avgSpend: number };
  campaignRecommendations?: { channel: string; reason: string; suggestedObjective: string }[];
}

export const segmentationApi = {
  list: () => request<Segment[]>('/segments'),

  parse: (payload: { query: string; refinementContext?: string }) =>
    request<ParseSegmentResult>('/segments/parse', { method: 'POST', body: JSON.stringify(payload) }),

  approve: (data: {
    name: string;
    criteria?: Record<string, unknown>;
    naturalLanguageQuery: string;
    insights?: ParseSegmentResult['insights'];
    campaignRecommendations?: ParseSegmentResult['campaignRecommendations'];
  }) => request('/segments/approve', { method: 'POST', body: JSON.stringify(data) }),

  delete: (id: string) => request(`/segments/${id}`, { method: 'DELETE' }),
};
