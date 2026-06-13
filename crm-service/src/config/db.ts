import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

export const mongodbUri = env.mongodbUri;

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(mongodbUri);
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.error('MongoDB connection failed', { error });
    throw error;
  }
}
