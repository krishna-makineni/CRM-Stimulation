import { Worker, Job } from 'bullmq';
import { getRedisConnection } from '../config/redis';
import { DELIVERY_QUEUE } from '../queues/delivery.queue';
import { simulateCommunication } from '../services/deliverySimulator';
import type { SendRequest } from '../../../shared/types';
import { logger } from '../utils/logger';

export async function processDeliveryJob(data: SendRequest): Promise<void> {
  simulateCommunication(data);
}

export function startDeliveryWorker(): Worker<SendRequest, void> | null {
  const connection = getRedisConnection();
  if (!connection) return null;

  const worker = new Worker<SendRequest, void>(
    DELIVERY_QUEUE,
    async (job: Job<SendRequest>) => processDeliveryJob(job.data),
    { connection: connection as any, concurrency: 10 }
  );

  worker.on('completed', (job) => {
    logger.info('Delivery job completed', { jobId: job.id, communicationId: job.data.communicationId });
  });

  worker.on('failed', (job, err) => {
    logger.error('Delivery job failed', { jobId: job?.id, error: err.message });
  });

  return worker;
}
