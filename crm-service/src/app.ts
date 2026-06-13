import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { connectDatabase } from './config/db';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api', routes);
app.use(errorHandler);

async function start() {
  await connectDatabase();

  app.listen(env.port, () => {
    logger.info(`CRM Service running on port ${env.port}`);
  });
}

start().catch((error) => {
  logger.error('Failed to start CRM service', { error });
  process.exit(1);
});
