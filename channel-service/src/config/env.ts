import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: parseInt(process.env.PORT || '5001', 10),
  crmWebhookUrl: process.env.CRM_WEBHOOK_URL || 'http://localhost:5000/api/webhooks/receipt',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  useInlineJobs: process.env.USE_INLINE_JOBS !== 'false',
  nodeEnv: process.env.NODE_ENV || 'development',
};
