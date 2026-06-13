import { Segment } from '../models/Segment';
import { findCustomersByCriteria, countCustomersByCriteria } from '../utils/mongoQueryBuilder';
import { enqueueSegmentJob, getSegmentJobResult } from '../queues/segment.queue';

export async function getSegments() {
  return Segment.find().sort({ createdAt: -1 });
}

export async function getSegmentById(id: string) {
  const segment = await Segment.findById(id);
  if (!segment) return null;

  const customers = await findCustomersByCriteria(segment.criteria);
  return { segment, customers };
}

export async function createSegment(data: {
  name: string;
  criteria: Record<string, unknown>;
  naturalLanguageQuery?: string;
  insights?: Record<string, unknown>;
  campaignRecommendations?: Record<string, unknown>[];
}) {
  const customerCount = await countCustomersByCriteria(data.criteria);

  return Segment.create({
    ...data,
    customerCount,
    status: 'pending_approval',
  });
}

export async function parseNaturalLanguage(query: string, refinementContext?: string) {
  return enqueueSegmentJob({ query, refinementContext });
}

export async function getSegmentJob(jobId: string) {
  return getSegmentJobResult(jobId);
}

export async function approveSegment(data: {
  name?: string;
  criteria: Record<string, unknown>;
  naturalLanguageQuery?: string;
  insights?: Record<string, unknown>;
  campaignRecommendations?: Record<string, unknown>[];
}) {
  const customerCount = await countCustomersByCriteria(data.criteria);

  return Segment.create({
    name: data.name || 'Approved Segment',
    criteria: data.criteria,
    naturalLanguageQuery: data.naturalLanguageQuery,
    customerCount,
    status: 'approved',
    insights: data.insights,
    campaignRecommendations: data.campaignRecommendations,
  });
}

export async function getSegmentInsights(id: string) {
  const segment = await Segment.findById(id);
  if (!segment) return null;

  return {
    insights: segment.insights,
    campaignRecommendations: segment.campaignRecommendations,
  };
}

export async function previewSegment(criteria: Record<string, unknown>) {
  const customers = await findCustomersByCriteria(criteria);
  return { customerCount: customers.length, customers: customers.slice(0, 50) };
}

export async function deleteSegment(id: string) {
  return Segment.findByIdAndDelete(id);
}
