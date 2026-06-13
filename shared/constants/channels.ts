export const CHANNELS = ['WhatsApp', 'SMS', 'Email', 'RCS'] as const;
export type Channel = (typeof CHANNELS)[number];

export const CHANNEL_CONFIG: Record<
  Channel,
  { failRate: number; openRate: number; clickRate: number; readRate: number }
> = {
  WhatsApp: { failRate: 0.02, openRate: 0.72, clickRate: 0.18, readRate: 0.55 },
  SMS: { failRate: 0.05, openRate: 0.45, clickRate: 0.08, readRate: 0.35 },
  Email: { failRate: 0.08, openRate: 0.40, clickRate: 0.12, readRate: 0.25 },
  RCS: { failRate: 0.04, openRate: 0.55, clickRate: 0.14, readRate: 0.40 },
};
