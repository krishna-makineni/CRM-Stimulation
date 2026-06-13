import { connectDatabase } from './config/db';
import { connectRedis } from './config/redis';
import { startSegmentWorker } from './workers/segment.worker';
import { startCampaignWorker } from './workers/campaign.worker';
import { startAnalyticsWorker } from './workers/analytics.worker';
import { logger } from './utils/logger';

async function start() {
  await connectDatabase();
  const redisOk = await connectRedis();

  if (!redisOk) {
    logger.error('Worker requires Redis. Set REDIS_URL or run API with USE_INLINE_JOBS=true');
    process.exit(1);
  }

  startSegmentWorker();
  startCampaignWorker();
  startAnalyticsWorker();

  logger.info('Xeno workers started (segment, campaign, analytics)');
}

start().catch((error) => {
  logger.error('Worker startup failed', { error });
  process.exit(1);
});
