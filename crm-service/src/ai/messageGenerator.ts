import { openai } from '../config/openai';
import { logger } from '../utils/logger';

const MESSAGE_SYSTEM_PROMPT = `You are a marketing copywriter for an Indian e-commerce brand. Generate engaging campaign messages for the specified channel.
Use {{name}} as a placeholder for the customer name. Keep the copy concise, friendly, and tailored to the selected communication channel.
Do not include quotes, metadata, or explanation. Return ONLY the message text.`;

/** Generate personalized campaign message */
export async function generateCampaignMessage(params: {
  objective: string;
  audienceDescription: string;
  tone: string;
  offer?: string;
  channel: string;
}): Promise<string> {
  const prompt = `Campaign channel: ${params.channel}
Objective: ${params.objective}
Audience: ${params.audienceDescription}
Tone: ${params.tone}
${params.offer ? `Offer: ${params.offer}` : ''}

Write one marketing message designed to feel natural for ${params.channel}. Use {{name}} as the customer placeholder and include the offer clearly when present.`;

  if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: MESSAGE_SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        temperature: 0.85,
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

  const variants = [
    `Hi {{name}}, we miss you! Come back today and enjoy ${detectedOffer} on your next order. Your favorites are waiting.`,
    `Hello {{name}}, it’s the perfect time to return — grab ${detectedOffer} now and rediscover what you love.`,
    `Hey {{name}}, special savings are here for you. Use ${detectedOffer} and get back in on the best deals today.`,
  ];

  if (objective.includes('win back') || objective.includes('inactive') || objective.includes('re-engage')) {
    return variants[Math.floor(Math.random() * variants.length)];
  }

  if (objective.includes('skincare') || objective.includes('beauty')) {
    const skincareVariants = [
      `Hi {{name}}, refresh your beauty routine with our latest picks and enjoy ${detectedOffer}. Shop your glow-up today.`,
      `Hello {{name}}, your skin deserves something special — enjoy ${detectedOffer} on curated favorites now.`,
    ];
    return skincareVariants[Math.floor(Math.random() * skincareVariants.length)];
  }

  if (objective.includes('playful') || params.tone === 'casual') {
    const casualVariants = [
      `Hi {{name}}, your cart called and it wants a treat. Grab ${detectedOffer} today and make shopping a little more fun.`,
      `Hey {{name}}, good things are waiting — enjoy ${detectedOffer} and make today a little brighter.`,
    ];
    return casualVariants[Math.floor(Math.random() * casualVariants.length)];
  }

  if (objective.includes('premium') || params.tone === 'premium') {
    const premiumVariants = [
      `Hi {{name}}, an exclusive ${detectedOffer} is waiting for you. Discover handpicked favorites before the offer ends.`,
      `Hello {{name}}, enjoy this premium offer of ${detectedOffer} on curated selections made just for you.`,
    ];
    return premiumVariants[Math.floor(Math.random() * premiumVariants.length)];
  }

  const generalVariants = [
    `Hi {{name}}, we picked something special for you. Enjoy ${detectedOffer} on your next purchase and shop your favorites today.`,
    `Hello {{name}}, a new offer is ready — enjoy ${detectedOffer} and treat yourself to something you love.`,
  ];
  return generalVariants[Math.floor(Math.random() * generalVariants.length)];
}
