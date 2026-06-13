import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from './env';
import { logger } from '../utils/logger';

function createGeminiOpenAiAdapter(): any {
  logger.info('Initializing Gemini-OpenAI compatibility adapter.');
  const genAI = new GoogleGenerativeAI(env.geminiApiKey);
  const timeoutMs = 8000;
  const geminiModels = ['gemini-1.5-flash', 'gemini-1.0', 'gemini-1.5-pro', 'text-bison-001'];
  const requestOptions = { apiVersion: 'v1' };

  return {
    chat: {
      completions: {
        create: async (params: {
          messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
          temperature?: number;
          response_format?: { type: 'json_object' };
        }) => {
          logger.info('Gemini adapter: Intercepted chat completion request.');

          let systemInstruction = '';
          const contents: any[] = [];

          for (const m of params.messages) {
            if (m.role === 'system') {
              systemInstruction += (systemInstruction ? '\n' : '') + m.content;
            } else {
              contents.push({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }],
              });
            }
          }

          if (contents.length === 0) {
            contents.push({
              role: 'user',
              parts: [{ text: 'Please proceed.' }],
            });
          }

          const generationConfig: any = {};
          if (params.temperature !== undefined) {
            generationConfig.temperature = params.temperature;
          }
          if (params.response_format?.type === 'json_object') {
            generationConfig.responseMimeType = 'application/json';
          }

          let lastError: unknown;
          for (const modelName of geminiModels) {
            try {
              const model = genAI.getGenerativeModel(
                {
                  model: modelName,
                  systemInstruction: systemInstruction || undefined,
                },
                requestOptions
              );

              const result = await Promise.race([
                model.generateContent({
                  contents,
                  generationConfig,
                }),
                new Promise<never>((_, reject) => {
                  setTimeout(() => reject(new Error(`Gemini request timed out after ${timeoutMs}ms`)), timeoutMs);
                }),
              ]);

              const text = result.response.text();
              return {
                choices: [
                  {
                    message: {
                      content: text || '',
                    },
                  },
                ],
              };
            } catch (error) {
              lastError = error;
              logger.warn('Gemini adapter: model request failed, trying next model', {
                model: modelName,
                error,
              });
              if (modelName === geminiModels.at(-1)) {
                throw error;
              }
            }
          }

          throw lastError;
        },
      },
    },
  };
}

function isUsableOpenAiKey(key: string): boolean {
  return key.trim().startsWith('sk-') && !key.includes('your-openai-api-key');
}

export const openai = isUsableOpenAiKey(env.openaiApiKey)
  ? new OpenAI({ apiKey: env.openaiApiKey })
  : (env.geminiApiKey ? createGeminiOpenAiAdapter() : null);
