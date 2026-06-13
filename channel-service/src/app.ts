import express from 'express';
import cors from 'cors';
import { ZodError } from 'zod';
import { env } from './config/env';
import { connectRedis } from './config/redis';
import { startDeliveryWorker } from './workers/delivery.worker';
import sendRoutes from './routes/send.routes';
import { logger } from './utils/logger';

const app = express();

app.use(cors());
app.use(express.json());
app.use(sendRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'channel', timestamp: new Date().toISOString() });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Request error', { error: err.message });

  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation failed',
      details: err.errors,
    });
    return;
  }

  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  const redisOk = await connectRedis();
  if (redisOk) {
    startDeliveryWorker();
    logger.info('Delivery worker started');
  } else {
    logger.info('Running with inline delivery processing');
  }

  app.listen(env.port, () => {
    logger.info(`Channel Service running on port ${env.port}`);
  });
}

start().catch((error) => {
  logger.error('Channel service startup failed', { error });
  process.exit(1);
});
