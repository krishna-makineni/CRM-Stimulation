import { Worker, Job } from 'bullmq';
import { getRedisConnection } from '../config/redis';
import { SEGMENT_QUEUE } from '../config/bullmq';
import { SegmentJobData, SegmentJobResult } from '../queues/segment.queue';
import { parseSegmentQueryWithAmbiguity } from '../ai/ambiguityResolver';
import { generateSegmentName } from '../ai/nlpSegmentation';
import { findCustomersByCriteria } from '../utils/mongoQueryBuilder';
import { buildSegmentInsights } from '../ai/segmentInsights';
import { buildCampaignRecommendations } from '../ai/campaignRecommendation';
import { logger } from '../utils/logger';

/** Process NLP segmentation: intent extraction → filters → customer query → insights */
export async function processSegmentJob(data: SegmentJobData): Promise<SegmentJobResult> {
  const fullQuery = data.refinementContext
    ? `${data.query}\n\nRefinement: ${data.refinementContext}`
    : data.query;

  const parseResult = await parseSegmentQueryWithAmbiguity(fullQuery);

  if (parseResult.ambiguous) {
    return {
      criteria: parseResult.criteria,
      customerCount: 0,
      customers: [],
      ambiguous: true,
      clarifyingQuestions: parseResult.clarifyingQuestions,
      suggestedName: '',
      insights: { topCities: [], tierBreakdown: [], avgSpend: 0, summary: '' },
      campaignRecommendations: [],
    };
  }

  const customers = await findCustomersByCriteria(parseResult.criteria);
  const suggestedName = await generateSegmentName(fullQuery, parseResult.criteria);
  const insights = buildSegmentInsights(customers);
  const campaignRecommendations = await buildCampaignRecommendations(customers, parseResult.criteria);

  return {
    criteria: parseResult.criteria,
    customerCount: customers.length,
    customers: customers.slice(0, 50).map((c) => ({
      _id: c._id.toString(),
      name: c.name,
      email: c.email,
      city: c.city,
      totalSpend: c.totalSpend,
    })),
    ambiguous: false,
    suggestedName,
    insights,
    campaignRecommendations,
  };
}

export function startSegmentWorker(): Worker<SegmentJobData, SegmentJobResult> | null {
  const connection = getRedisConnection();
  if (!connection) return null;

  const worker = new Worker<SegmentJobData, SegmentJobResult>(
    SEGMENT_QUEUE,
    async (job: Job<SegmentJobData>) => processSegmentJob(job.data),
    { connection: connection as any, concurrency: 3 }
  );

  worker.on('completed', (job) => {
    logger.info('Segment job completed', { jobId: job.id });
  });

  worker.on('failed', (job, err) => {
    logger.error('Segment job failed', { jobId: job?.id, error: err.message });
  });

  return worker;
}
