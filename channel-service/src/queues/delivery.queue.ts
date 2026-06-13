import { Queue } from 'bullmq';
import { getRedisConnection } from '../config/redis';
import { processDeliveryJob } from '../workers/delivery.worker';
import type { SendRequest } from '../../../shared/types';

export const DELIVERY_QUEUE = 'delivery-jobs';

let deliveryQueue: Queue<any> | null = null;

function getDeliveryQueue(): Queue<any> | null {
  const connection = getRedisConnection();
  if (!connection) return null;

  if (!deliveryQueue) {
    deliveryQueue = new Queue<any>(DELIVERY_QUEUE, { connection: connection as any });
  }

  return deliveryQueue;
}

/** Enqueue or inline-process a delivery simulation job */
export async function enqueueDeliveryJob(data: SendRequest) {
  const queue = getDeliveryQueue();
  if (queue) {
    const job = await queue.add('delivery', data, { removeOnComplete: 500, removeOnFail: 100 });
    return { jobId: job.id!, mode: 'queued' as const };
  }

  await processDeliveryJob(data);
  return { jobId: `inline-${Date.now()}`, mode: 'inline' as const };
}
