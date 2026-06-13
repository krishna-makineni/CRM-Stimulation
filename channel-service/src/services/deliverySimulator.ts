import { CHANNEL_CONFIG } from '../../../shared/constants/channels';
import type { CommunicationStatus, SendRequest, ReceiptPayload } from '../../../shared/types';
import { sendCallback } from './callback.service';
import { logger } from '../utils/logger';

/**
 * Simulate the full communication lifecycle with async delays.
 * Events: SENT → DELIVERED → OPENED/READ → CLICKED (or FAILED)
 */
export function simulateCommunication(request: SendRequest): void {
  const config = CHANNEL_CONFIG[request.channel] || CHANNEL_CONFIG.Email;

  logger.info('Starting communication simulation', {
    communicationId: request.communicationId,
    channel: request.channel,
  });

  scheduleEvent(request, 'SENT', 500);

  if (Math.random() < config.failRate) {
    scheduleEvent(request, 'FAILED', randomDelay(2000, 5000), 'Simulated delivery failure');
    return;
  }

  scheduleEvent(request, 'DELIVERED', randomDelay(1000, 3000));

  if (Math.random() < config.openRate) {
    scheduleEvent(request, 'OPENED', randomDelay(5000, 15000));

    if (['WhatsApp', 'RCS'].includes(request.channel) && Math.random() < config.readRate) {
      scheduleEvent(request, 'READ', randomDelay(8000, 20000));
    }

    if (Math.random() < config.clickRate) {
      scheduleEvent(request, 'CLICKED', randomDelay(10000, 30000));
    }
  }
}

function scheduleEvent(
  request: SendRequest,
  status: CommunicationStatus,
  delayMs: number,
  failureReason?: string
): void {
  setTimeout(async () => {
    const payload: ReceiptPayload = {
      communicationId: request.communicationId,
      campaignId: request.campaignId,
      customerId: request.customerId,
      status,
      timestamp: new Date().toISOString(),
      failureReason,
    };

    await sendCallback(request.callbackUrl, payload);
  }, delayMs);
}

function randomDelay(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
