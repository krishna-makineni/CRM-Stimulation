import { Queue } from 'bullmq';
import { getRedisConnection } from './redis';
import { env } from './env';

export const SEGMENT_QUEUE = 'segment-jobs';
export const CAMPAIGN_QUEUE = 'campaign-jobs';
export const ANALYTICS_QUEUE = 'analytics-jobs';

const connection = () => getRedisConnection()!;

let segmentQueue: Queue<any> | null = null;
let campaignQueue: Queue<any> | null = null;
let analyticsQueue: Queue<any> | null = null;

export function getSegmentQueue(): Queue<any> | null {
  if (env.useInlineJobs) return null;
  if (!segmentQueue) {
    segmentQueue = new Queue<any>(SEGMENT_QUEUE, { connection: connection() as any });
  }
  return segmentQueue;
}

export function getCampaignQueue(): Queue<any> | null {
  if (env.useInlineJobs) return null;
  if (!campaignQueue) {
    campaignQueue = new Queue<any>(CAMPAIGN_QUEUE, { connection: connection() as any });
  }
  return campaignQueue;
}

export function getAnalyticsQueue(): Queue<any> | null {
  if (env.useInlineJobs) return null;
  if (!analyticsQueue) {
    analyticsQueue = new Queue<any>(ANALYTICS_QUEUE, { connection: connection() as any });
  }
  return analyticsQueue;
}
