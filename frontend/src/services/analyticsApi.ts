import { ChannelPerformance, DashboardMetrics } from '@/types';
import { request } from './client';

export const analyticsApi = {
  getDashboard: () => request<DashboardMetrics>('/analytics/dashboard'),

  getComparison: () => request<Record<string, unknown>[]>('/analytics/comparison'),

  getChannels: () => request<ChannelPerformance[]>('/analytics/channels'),

  getInsights: () =>
    request<{
      summary: string;
      recommendations: string[];
      highlights: string[];
    }>('/analytics/insights'),
};

