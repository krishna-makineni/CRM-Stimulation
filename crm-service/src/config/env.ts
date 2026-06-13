import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: parseInt(process.env.PORT || '5000', 10),
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/xeno-crm',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  channelServiceUrl: process.env.CHANNEL_SERVICE_URL || 'http://localhost:5001',
  crmWebhookUrl: process.env.CRM_WEBHOOK_URL || 'http://localhost:5000/api/webhooks/receipt',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  useInlineJobs: process.env.USE_INLINE_JOBS !== 'false',
  nodeEnv: process.env.NODE_ENV || 'development',
};
