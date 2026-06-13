import { SegmentCriteria } from '../types';
import { getSegmentQueue } from '../config/bullmq';
import { processSegmentJob } from '../workers/segment.worker';

export interface SegmentJobData {
  query: string;
  refinementContext?: string;
  sessionId?: string;
}

export interface SegmentJobResult {
  criteria: SegmentCriteria;
  customerCount: number;
  customers: { _id: string; name: string; email: string; city: string; totalSpend: number }[];
  ambiguous: boolean;
  clarifyingQuestions?: string[];
  suggestedName: string;
  insights: {
    topCities: { city: string; count: number }[];
    tierBreakdown: { tier: string; count: number }[];
    avgSpend: number;
    summary: string;
  };
  campaignRecommendations: {
    channel: string;
    reason: string;
    suggestedObjective: string;
    suggestedOffer?: string;
  }[];
}

/** Enqueue or inline-process a segmentation job */
export async function enqueueSegmentJob(data: SegmentJobData) {
  const queue = getSegmentQueue();
  if (queue) {
    const job = await queue.add('segment', data, { removeOnComplete: 100, removeOnFail: 50 });
    return { jobId: job.id!, mode: 'queued' as const };
  }
  const result = await processSegmentJob(data);
  return { jobId: `inline-${Date.now()}`, mode: 'inline' as const, result };
}

/** Get segment job status/result */
export async function getSegmentJobResult(jobId: string) {
  const queue = getSegmentQueue();
  if (!queue || jobId.startsWith('inline-')) return null;

  const job = await queue.getJob(jobId);
  if (!job) return null;

  const state = await job.getState();
  return {
    id: job.id,
    state,
    progress: job.progress,
    result: job.returnvalue,
    failedReason: job.failedReason,
  };
}
