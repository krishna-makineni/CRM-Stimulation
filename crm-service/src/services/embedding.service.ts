import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env';
import { ICustomer } from '../models/Customer';
import { logger } from '../utils/logger';

// Initialize the Google Generative AI client with GEMINI_API_KEY
const genAI = env.geminiApiKey ? new GoogleGenerativeAI(env.geminiApiKey) : null;
const GEMINI_EMBED_MODEL = 'gemini-embedding-001';

/**
 * Generate a descriptive text string representing the customer's profile and shopping behavior.
 */
export function getCustomerTextDescription(customer: ICustomer, products: string[]): string {
  const productStr = products.length > 0 ? products.join(', ') : 'none';
  return `Customer Name: ${customer.name}. City: ${customer.city}. Loyalty Tier: ${customer.loyaltyTier}. Total Spend: INR ${customer.totalSpend}. Purchased Products: ${productStr}.`;
}

/**
 * Generate a vector embedding for a single text input.
 */
export async function getEmbedding(text: string): Promise<number[]> {
  if (!genAI) {
    logger.warn('Google Generative AI is not configured. Returning empty embedding.');
    return [];
  }

  try {
    const model = genAI.getGenerativeModel({ model: GEMINI_EMBED_MODEL });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    logger.error('Error generating Google embedding', { error });
    throw error;
  }
}

/**
 * Generate vector embeddings for a batch of text inputs in a single API call.
 */
export async function getEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  if (!genAI) {
    logger.warn('Google Generative AI is not configured. Returning empty embeddings batch.');
    return texts.map(() => []);
  }

  if (texts.length === 0) return [];

  try {
    const model = genAI.getGenerativeModel({ model: GEMINI_EMBED_MODEL });
    
    // Map requests for batch execution
    const requests = texts.map((t) => ({
      content: { role: 'user', parts: [{ text: t }] },
      model: `models/${GEMINI_EMBED_MODEL}`,
    }));

    const result = await model.batchEmbedContents({ requests });
    
    return result.embeddings.map((e) => e.values);
  } catch (error) {
    logger.error('Error generating Google batch embeddings', { error });
    throw error;
  }
}

/**
 * Calculate the cosine similarity between two numeric vectors.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  if (magnitude === 0) return 0;
  
  return dotProduct / magnitude;
}
