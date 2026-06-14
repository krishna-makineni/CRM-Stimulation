import { v4 as uuidv4 } from 'uuid';
import { openai } from '../config/openai';
import { Segment } from '../models/Segment';
import { Campaign } from '../models/Campaign';
import { parseSegmentQuery } from './nlpSegmentation';
import { generateCampaignMessage } from './messageGenerator';
import { recommendChannel } from './campaignRecommendation';
import { findCustomersByCriteria } from '../utils/mongoQueryBuilder';
import { getChannelPerformance } from '../utils/metricsCalculator';
import { launchCampaign } from '../services/campaign.service';
import { personalizeWithName } from '../utils/templateEngine';
import { CopilotSession, CopilotStep, Channel } from '../types';
import { logger } from '../utils/logger';

const COPILOT_SYSTEM_PROMPT = `You are Xeno Campaign Copilot, an AI marketing assistant for Indian e-commerce brands.
Help marketers plan campaigns. Be concise, actionable, and explain your reasoning.
When analyzing goals, think step by step about segmentation, channel, and messaging.`;

const sessions = new Map<string, CopilotSession>();

const INITIAL_STEPS: CopilotStep[] = [
  { step: 1, title: 'Understand campaign intent', status: 'pending' },
  { step: 2, title: 'Generate segmentation filters', status: 'pending' },
  { step: 3, title: 'Query matching customers', status: 'pending' },
  { step: 4, title: 'Recommend communication channel', status: 'pending' },
  { step: 5, title: 'Generate campaign message', status: 'pending' },
  { step: 6, title: 'Show campaign preview', status: 'pending' },
  { step: 7, title: 'Await human approval', status: 'pending' },
  { step: 8, title: 'Launch campaign', status: 'pending' },
];

export function createSession(): CopilotSession {
  const session: CopilotSession = {
    id: uuidv4(),
    messages: [
      {
        role: 'assistant',
        content:
          "Hi! I'm your Campaign Copilot. Tell me your marketing goal — for example:\n\n• \"Launch a win-back campaign for customers inactive 90 days spending over ₹5000\"\n• \"Promote skincare to premium customers in Mumbai\"\n\nI'll build the segment, recommend a channel, draft the message, and wait for your approval before launching.",
      },
    ],
    steps: JSON.parse(JSON.stringify(INITIAL_STEPS)),
    awaitingApproval: false,
  };
  sessions.set(session.id, session);
  return session;
}

export function getSession(sessionId: string): CopilotSession | undefined {
  return sessions.get(sessionId);
}

function updateStep(session: CopilotSession, stepNum: number, status: CopilotStep['status'], result?: unknown) {
  const step = session.steps.find((s) => s.step === stepNum);
  if (step) {
    step.status = status;
    if (result !== undefined) step.result = result;
  }
}

/** Copilot chat response */
export async function getCopilotResponse(
  messages: { role: 'user' | 'assistant'; content: string }[],
  context?: string
): Promise<string> {
  if (openai) {
    try {
      const systemContent = context
        ? `${COPILOT_SYSTEM_PROMPT}\n\nContext:\n${context}`
        : COPILOT_SYSTEM_PROMPT;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: systemContent }, ...messages],
        temperature: 0.6,
      });

      const content = response.choices[0]?.message?.content;
      if (content) return content;
    } catch (error) {
      logger.warn('OpenAI copilot failed, using fallback', { error });
    }
  }

  return 'I can help you create a targeted marketing campaign. Tell me your goal — for example, win back inactive customers or promote a new product launch.';
}

/** Extract campaign intent from user message for copilot workflow */
export async function extractCampaignIntent(userMessage: string): Promise<{
  objective: string;
  segmentQuery: string;
  suggestedName: string;
  tone: string;
  offer?: string;
}> {
  const intentPrompt = `Analyze this marketing goal and return JSON:
{
  "objective": "clear campaign objective",
  "segmentQuery": "natural language segment query",
  "suggestedName": "campaign name",
  "tone": "friendly|urgent|premium|casual",
  "offer": "optional offer description"
}

Goal: ${userMessage}`;

  if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Return only valid JSON.' },
          { role: 'user', content: intentPrompt },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (content) return JSON.parse(content);
    } catch (error) {
      logger.warn('Intent extraction failed', { error });
    }
  }

  return {
    objective: userMessage,
    segmentQuery: userMessage,
    suggestedName: 'AI Campaign',
    tone: 'friendly',
  };
}

/** Process user message through the 8-step copilot workflow */
export async function processCopilotMessage(
  sessionId: string,
  userMessage: string
): Promise<CopilotSession> {
  const session = sessions.get(sessionId);
  if (!session) throw new Error('Session not found');

  session.messages.push({ role: 'user', content: userMessage });

  const lower = userMessage.toLowerCase().trim();

  if (session.awaitingApproval) {
    if (lower === 'cancel' || lower === 'no' || lower.includes('cancel')) {
      session.awaitingApproval = false;
      session.reviewStage = undefined;
      session.steps = JSON.parse(JSON.stringify(INITIAL_STEPS));
      session.campaignPreview = undefined;
      const reply = 'Campaign cancelled. Tell me about your next marketing goal!';
      session.messages.push({ role: 'assistant', content: reply });
      return session;
    }

    if (!session.campaignPreview) {
      session.awaitingApproval = false;
      session.reviewStage = undefined;
      session.messages.push({ role: 'assistant', content: 'No campaign preview is available. Tell me your campaign goal and I will build a new draft.' });
      return session;
    }

    if (isLaunchCommand(lower)) {
      return await approveAndLaunch(session);
    }

    if (isSaveDraftCommand(lower)) {
      return await saveDraft(session);
    }

    if (session.reviewStage !== 'details' && isReviewDetailsRequest(lower)) {
      session.reviewStage = 'details';
      const reply = buildLaunchDetailsMessage(session.campaignPreview);
      session.messages.push({ role: 'assistant', content: reply });
      return session;
    }

    if (session.reviewStage !== 'details') {
      session.reviewStage = 'details';
    }

    const changes = await applyDraftUpdates(session.campaignPreview, userMessage);
    let reply: string;

    if (changes.length > 0) {
      reply = `${buildDraftUpdatedMessage(session.campaignPreview, changes)}\n\nType **"launch now"** when this looks right, or send another change.`;
    } else {
      session.reviewStage = 'details';
      reply = buildLaunchDetailsMessage(session.campaignPreview);
    }

    session.messages.push({ role: 'assistant', content: reply });
    return session;
  }

  try {
    updateStep(session, 1, 'in_progress');
    const intent = await extractCampaignIntent(userMessage);
    updateStep(session, 1, 'completed', intent);

    updateStep(session, 2, 'in_progress');
    const criteria = await parseSegmentQuery(intent.segmentQuery);
    updateStep(session, 2, 'completed', criteria);

    updateStep(session, 3, 'in_progress');
    const customers = await findCustomersByCriteria(criteria);
    const customerCount = customers.length;
    updateStep(session, 3, 'completed', { customerCount, sampleCustomers: customers.slice(0, 3).map((c) => ({ name: c.name, email: c.email })) });

    if (customerCount === 0) {
      const reply = `I couldn't find any customers matching your criteria: ${JSON.stringify(criteria)}. Try broadening your segment — for example, lower the spend threshold or reduce inactive days.`;
      session.messages.push({ role: 'assistant', content: reply });
      session.steps = JSON.parse(JSON.stringify(INITIAL_STEPS));
      return session;
    }

    updateStep(session, 4, 'in_progress');
    const channelStats = await getChannelPerformance();
    const channelRec = await recommendChannel(channelStats, intent.objective);
    updateStep(session, 4, 'completed', channelRec);

    updateStep(session, 5, 'in_progress');
    const audienceDesc = `${customerCount} customers matching: ${intent.segmentQuery}`;
    const message = await generateCampaignMessage({
      objective: intent.objective,
      audienceDescription: audienceDesc,
      tone: intent.tone,
      offer: intent.offer,
      channel: channelRec.channel,
    });
    updateStep(session, 5, 'completed', { message });

    updateStep(session, 6, 'in_progress');
    const sampleCustomerName = customers[0]?.name ?? 'Customer';
    const preview = {
      name: intent.suggestedName,
      objective: intent.objective,
      segmentName: intent.suggestedName + ' Segment',
      segmentCriteria: criteria,
      segmentQuery: intent.segmentQuery,
      customerCount,
      channel: channelRec.channel as Channel,
      channelReason: channelRec.reason,
      tone: intent.tone,
      offer: intent.offer,
      message,
      sampleCustomerName,
      sentPreview: personalizeWithName(message, sampleCustomerName),
    };
    session.campaignPreview = preview;
    updateStep(session, 6, 'completed', preview);

    updateStep(session, 7, 'in_progress');
    session.awaitingApproval = true;
    session.reviewStage = 'preview';

    const reply = buildPreviewMessage(preview);
    session.messages.push({ role: 'assistant', content: reply });
    updateStep(session, 7, 'completed', { awaitingApproval: true });

    return session;
  } catch (error) {
    logger.error('Copilot processing error', { error });
    const reply = 'I encountered an issue processing your request. Please try rephrasing your campaign goal.';
    session.messages.push({ role: 'assistant', content: reply });
    session.steps = JSON.parse(JSON.stringify(INITIAL_STEPS));
    return session;
  }
}

function isLaunchCommand(lower: string): boolean {
  const normalized = lower.replace(/[.!?]+$/g, '').trim();
  return [
    'launch',
    'launch now',
    'confirm launch',
    'yes launch',
    'looks good launch',
    'approve and launch',
  ].includes(normalized);
}

function isSaveDraftCommand(lower: string): boolean {
  const normalized = lower.replace(/[.!?]+$/g, '').trim();
  return [
    'save draft',
    'save as draft',
    'save this draft',
    'draft',
    'save as draft please',
  ].includes(normalized);
}

function isReviewDetailsRequest(lower: string): boolean {
  const normalized = lower.replace(/[.!?]+$/g, '').trim();
  return [
    'approve',
    'review',
    'review details',
    'show details',
    'show final details',
    'details',
  ].includes(normalized);
}

async function saveDraft(session: CopilotSession): Promise<CopilotSession> {
  if (!session.campaignPreview) {
    session.messages.push({ role: 'assistant', content: 'No campaign preview available. Please describe your campaign goal first.' });
    return session;
  }

  const preview = session.campaignPreview;
  updateStep(session, 8, 'in_progress');

  const segment = await Segment.create({
    name: preview.segmentName,
    criteria: preview.segmentCriteria,
    customerCount: preview.customerCount,
    naturalLanguageQuery: preview.segmentQuery,
    status: 'approved',
  });
  session.segmentId = segment._id.toString();

  const campaign = await Campaign.create({
    name: preview.name,
    objective: preview.objective,
    audienceSegmentId: segment._id.toString(),
    message: preview.message,
    channel: preview.channel,
    tone: preview.tone,
    offer: preview.offer,
    status: 'Draft',
  });

  updateStep(session, 8, 'completed', { campaignId: campaign._id.toString(), status: 'Draft', mode: 'draft' });
  session.savedDraftCampaignId = campaign._id.toString();
  session.awaitingApproval = false;
  session.reviewStage = undefined;

  const reply = `Draft saved as campaign **"${preview.name}"**.

**Campaign ID:** ${campaign._id}
**Status:** Draft
You can continue editing it later in Campaigns.`;
  session.messages.push({ role: 'assistant', content: reply });
  return session;
}

async function applyDraftUpdates(
  preview: NonNullable<CopilotSession['campaignPreview']>,
  userMessage: string
): Promise<string[]> {
  const changes: string[] = [];
  const text = userMessage.trim();
  const lower = text.toLowerCase();

  const setField = <K extends keyof typeof preview>(field: K, value: (typeof preview)[K], label: string) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      preview[field] = value;
      changes.push(label);
    }
  };

  const lineValue = (field: string) => {
    const match = text.match(new RegExp(`(?:^|\\n)\\s*${field}\\s*:\\s*(.+)`, 'i'));
    return match?.[1]?.trim();
  };

  const extractTone = (input: string) => {
    const toneWords = [
      'friendly',
      'urgent',
      'premium',
      'casual',
      'romantic',
      'professional',
      'playful',
      'exciting',
      'luxury',
      'warm',
      'confident',
      'fun',
      'formal',
      'informal',
      'bold',
      'energetic',
      'sincere',
      'exclusive',
      'motivational',
      'relaxed',
      'polished',
      'trusted',
    ];

    const explicitTone = lineValue('tone');
    if (explicitTone) return explicitTone.trim();

    const toneMatch = input.match(new RegExp(`(?:change(?: the)? tone(?: to| to be| is)?\\s*|set(?: the)? tone(?: to| to be| is)?\\s*|make(?: the)? tone(?: to| to be| is)?\\s*|tone(?:\\s*(?:to|is|=))?\\s*[:\\-]?\\s*|make it\\s*)(` + toneWords.join('|') + `)\\b`, 'i'));
    if (toneMatch?.[1]) return toneMatch[1].trim();

    const fallbackMatch = input.match(new RegExp(`\\b(${toneWords.join('|')})\\b`, 'i'));
    return fallbackMatch?.[1]?.trim();
  };

  const isLikelyChangeInstruction = (value: string) =>
    /\\b(?:tone|channel|offer|objective|name|audience|segment|copy|content)\\b/i.test(value) &&
    value.split(/\\s+/).length <= 8;

  const extractMessage = (input: string) => {
    const explicitMessage = lineValue('message') ?? lineValue('copy') ?? lineValue('content');
    if (explicitMessage && !isLikelyChangeInstruction(explicitMessage)) return explicitMessage;

    const patterns = [
      /(?:change|rewrite|update|revise|edit)(?: the)? message(?: to| so that it| so it is)?[:\-]?\s*(.+)/i,
      /(?:make|keep)(?: the)? message(?: more| less)?[:\-]?\s*(.+)/i,
      /(?:message|copy|content)[:\-]?\s*(.+)/i,
    ];

    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (!match?.[1]) continue;
      const value = match[1].trim();
      if (isLikelyChangeInstruction(value) || /\btone\b/i.test(value) && value.split(/\s+/).length <= 6) continue;
      return value;
    }

    return undefined;
  };

  const name = lineValue('(?:campaign\\s*)?name') ?? text.match(/(?:rename|name|call it|called)\s+(?:it\s+)?(?:to\s+)?["']?([^"'\n.]+)/i)?.[1]?.trim();
  if (name) {
    setField('name', name, 'campaign name');
    setField('segmentName', `${name} Segment`, 'segment name');
  }

  const objective = lineValue('objective');
  if (objective) setField('objective', objective, 'objective');

  const offer = lineValue('offer') ?? text.match(/(?:offer|discount|coupon)\s*[:\-]?\s*([^.\n]+)/i)?.[1]?.trim();
  if (offer) setField('offer', offer, 'offer');

  const tone = extractTone(text);
  if (tone) setField('tone', tone.toLowerCase(), 'tone');

  const channel = lineValue('channel') ?? text.match(/\b(WhatsApp|SMS|Email|RCS)\b/i)?.[1]?.trim();
  if (channel && ['whatsapp', 'sms', 'email', 'rcs'].includes(channel.toLowerCase())) {
    const normalized = channel.toLowerCase() === 'sms'
      ? 'SMS'
      : channel.toLowerCase() === 'rcs'
        ? 'RCS'
        : channel.charAt(0).toUpperCase() + channel.slice(1).toLowerCase();
    setField('channel', normalized as Channel, 'channel');
    preview.channelReason = 'Selected by marketer during final copilot review.';
  }

  let message = extractMessage(text);
  if (message) setField('message', message, 'message');

  const wantsMessageRefresh =
    !message &&
    /(?:change|rewrite|revise|update|edit|make|improve).*(?:\bmessage\b|\bcopy\b|\bcontent\b)|(?:\bmessage\b|\bcopy\b|\bcontent\b).*(?:change|rewrite|revise|update|edit|make|improve)/i.test(text);

  const shouldRegenerateMessage =
    !message &&
    (wantsMessageRefresh || changes.includes('tone') || lower.includes('regenerate') || lower.includes('rewrite') || lower.includes('make it'));

  if (shouldRegenerateMessage) {
    const regenerated = await generateCampaignMessage({
      objective: preview.objective,
      audienceDescription: `${preview.customerCount} customers matching: ${preview.segmentQuery}`,
      tone: preview.tone ?? 'friendly',
      offer: preview.offer,
      channel: preview.channel,
    });
    setField('message', regenerated, 'message');
  }

  if (changes.includes('message') || changes.includes('tone') || changes.includes('offer')) {
    preview.sentPreview = personalizeWithName(preview.message, preview.sampleCustomerName ?? 'Customer');
  }

  return [...new Set(changes)];
}

function buildLaunchDetailsMessage(preview: NonNullable<CopilotSession['campaignPreview']>): string {
  return `Before I launch, review or edit the final details:

**Campaign name:** ${preview.name}
**Objective:** ${preview.objective}
**Audience:** ${preview.customerCount} customers from "${preview.segmentQuery}"
**Channel:** ${preview.channel}
**Tone:** ${preview.tone ?? 'friendly'}
**Offer:** ${preview.offer ?? 'None specified'}

Send changes in natural language or as fields, like: ` + '`name: VIP Skincare Relaunch`' + `, ` + '`offer: 15% off today`' + `, ` + '`channel: Email`' + `

Type **"launch now"** or **"save draft"** when you want me to create this campaign as a draft.`;
}

function buildDraftUpdatedMessage(preview: NonNullable<CopilotSession['campaignPreview']>, changes: string[]): string {
  return `Updated ${changes.join(', ')}.

**Campaign name:** ${preview.name}
**Objective:** ${preview.objective}
**Audience:** ${preview.customerCount} customers
**Channel:** ${preview.channel}
**Tone:** ${preview.tone ?? 'friendly'}
**Offer:** ${preview.offer ?? 'None specified'}
**Message preview**
> ${preview.sentPreview ?? preview.message}`;
}

async function approveAndLaunch(session: CopilotSession): Promise<CopilotSession> {
  if (!session.campaignPreview) {
    session.messages.push({ role: 'assistant', content: 'No campaign preview available. Please describe your campaign goal first.' });
    return session;
  }

  const preview = session.campaignPreview;
  updateStep(session, 8, 'in_progress');

  const segment = await Segment.create({
    name: preview.segmentName,
    criteria: preview.segmentCriteria,
    customerCount: preview.customerCount,
    naturalLanguageQuery: preview.segmentQuery,
    status: 'approved',
  });
  session.segmentId = segment._id.toString();

  const campaign = await Campaign.create({
    name: preview.name,
    objective: preview.objective,
    audienceSegmentId: segment._id.toString(),
    message: preview.message,
    channel: preview.channel,
    tone: preview.tone,
    offer: preview.offer,
    status: 'Draft',
  });

  try {
    const launchResult = await launchCampaign(campaign._id.toString());
    const launchedCampaign = await Campaign.findById(campaign._id).select('status');
    const status = launchedCampaign?.status ?? 'Running';
    updateStep(session, 8, 'completed', { campaignId: campaign._id.toString(), jobId: launchResult?.jobId, mode: launchResult?.mode, status });
    session.launchedCampaignId = campaign._id.toString();
    session.awaitingApproval = false;
    session.reviewStage = undefined;

    const reply = `Campaign **"${preview.name}"** is launched.

**Campaign ID:** ${campaign._id}
**Audience:** ${preview.customerCount} customers
**Channel:** ${preview.channel}
**Status:** ${status}
**Launch mode:** ${launchResult?.mode ?? 'queued'}

You can now track it in Campaigns and Dashboard.`;
    session.messages.push({ role: 'assistant', content: reply });
  } catch (error) {
    updateStep(session, 8, 'pending');
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    session.messages.push({ role: 'assistant', content: `Failed to launch campaign: ${errMsg}` });
  }

  return session;
}

function buildPreviewMessage(preview: NonNullable<CopilotSession['campaignPreview']>): string {
  return `**AI-generated message**
> ${preview.message}

**Preview as sent on ${preview.channel}**
> ${preview.sentPreview ?? preview.message}

---
Reply **"approve"** to review final launch details, or ask me to change the name, offer, channel, tone, audience, or message.`;
}
