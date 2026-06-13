import { Campaign, Communication } from '@/types';
import { request } from './client';

export const campaignApi = {
  list: () => request<Campaign[]>('/campaigns'),

  getById: (id: string) =>
    request<{
      campaign: Campaign;
      analytics: {
        total: number;
        deliveryRate: number;
        openRate: number;
        clickRate: number;
        timeline: { date: string; sent: number; delivered: number; opened: number; clicked: number }[];
      };
      communications: Communication[];
    }>(`/campaigns/${id}`),

  create: (data: {
    name: string;
    objective: string;
    audienceSegmentId: string;
    message: string;
    channel: string;
    tone: string;
    offer: string;
  }) => request('/campaigns', { method: 'POST', body: JSON.stringify(data) }),

  launch: (id: string) => request(`/campaigns/${id}/launch`, { method: 'POST' }),

  generateMessage: (data: {
    objective: string;
    audienceDescription: string;
    tone: string;
    offer: string;
  }) => request<{ message: string }>('/campaigns/generate-message', { method: 'POST', body: JSON.stringify(data) }),
};

export const copilotApi = {
  startSession: () => request<import('@/types').CopilotSession>('/campaigns/copilot/sessions', { method: 'POST' }),

  getSession: (id: string) => request<import('@/types').CopilotSession>(`/campaigns/copilot/sessions/${id}`),

  sendMessage: (sessionId: string, message: string) =>
    request<import('@/types').CopilotSession>(`/campaigns/copilot/sessions/${sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),
};
