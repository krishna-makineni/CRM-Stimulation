import { openai } from '../config/openai';
import { logger } from '../utils/logger';

const MESSAGE_SYSTEM_PROMPT = `You are a marketing copywriter for an Indian e-commerce brand. Generate personalized campaign messages.
Use {{name}} as placeholder for customer name. Keep messages concise and engaging.
Return ONLY the message text, no quotes or explanation.`;

/** Generate personalized campaign message */
export async function generateCampaignMessage(params: {
  objective: string;
  audienceDescription: string;
  tone: string;
  offer?: string;
}): Promise<string> {
  const prompt = `Objective: ${params.objective}
Audience: ${params.audienceDescription}
Tone: ${params.tone}
${params.offer ? `Offer: ${params.offer}` : ''}`;

  if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: MESSAGE_SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content?.trim();
      if (content) return content;
    } catch (error) {
      logger.warn('OpenAI message generation failed, using fallback', { error });
    }
  }

  return buildFallbackMessage(params);
}

function buildFallbackMessage(params: {
  objective: string;
  tone: string;
  offer?: string;
}): string {
  const objective = params.objective.toLowerCase();
  const detectedOffer =
    params.offer ||
    params.objective.match(/(?:\d+)\s*(?:%|percent)\s*(?:off|discount)?/i)?.[0]?.replace(/percent/i, '%') ||
    'a special offer';

  if (objective.includes('win back') || objective.includes('inactive') || objective.includes('re-engage')) {
    return `Hi {{name}}, we miss you! Come back today and enjoy ${detectedOffer} on your next order. Your favorites are waiting.`;
  }

  if (objective.includes('skincare') || objective.includes('beauty')) {
    return `Hi {{name}}, refresh your beauty routine with our latest picks and enjoy ${detectedOffer}. Shop your glow-up today.`;
  }

  if (objective.includes('playful') || params.tone === 'casual') {
    return `Hi {{name}}, your cart called and it wants a treat. Grab ${detectedOffer} today and make shopping a little more fun.`;
  }

  if (objective.includes('premium') || params.tone === 'premium') {
    return `Hi {{name}}, an exclusive ${detectedOffer} is waiting for you. Discover handpicked favorites before the offer ends.`;
  }

  return `Hi {{name}}, we picked something special for you. Enjoy ${detectedOffer} on your next purchase and shop your favorites today.`;
}
