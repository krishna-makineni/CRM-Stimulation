import { env } from '../config/env';
import { logger } from '../utils/logger';
import type { ReceiptPayload } from '../../../shared/types';

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;

/** Send callback to CRM with exponential backoff retry */
export async function sendCallback(
  callbackUrl: string,
  payload: ReceiptPayload,
  attempt = 1
): Promise<boolean> {
  const url = callbackUrl || env.crmWebhookUrl;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      logger.info('Callback delivered', {
        communicationId: payload.communicationId,
        status: payload.status,
        attempt,
      });
      return true;
    }

    throw new Error(`CRM returned ${response.status}`);
  } catch (error) {
    logger.warn('Callback failed', {
      communicationId: payload.communicationId,
      status: payload.status,
      attempt,
      error: error instanceof Error ? error.message : 'Unknown',
    });

    if (attempt < MAX_RETRIES) {
      const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
      await sleep(delay);
      return sendCallback(callbackUrl, payload, attempt + 1);
    }

    logger.error('Callback exhausted retries', {
      communicationId: payload.communicationId,
      status: payload.status,
    });
    return false;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
