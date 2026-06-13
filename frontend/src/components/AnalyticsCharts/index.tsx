import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Sparkles, TrendingUp, BarChart3 } from 'lucide-react';
import { DashboardMetrics } from '@/types';

const COLORS = ['#7c3aed', '#06b6d4', '#f59e0b', '#10b981'];

const tooltipStyle = {
  contentStyle: {
    backgroundColor: 'rgba(10,8,24,0.95)',
    border: '1px solid rgba(124,58,237,0.3)',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    color: 'white',
    fontSize: 12,
  },
};

interface AnalyticsChartsProps {
  metrics?: DashboardMetrics;
  comparison?: Record<string, unknown>[];
  aiInsights?: {
    summary: string;
    recommendations: string[];
    highlights: string[];
  };
}

export function AnalyticsCharts({ metrics, comparison, aiInsights }: AnalyticsChartsProps) {
  const funnelData = [
    { name: 'Sent', value: metrics?.messagesSent || 0 },
    { name: 'Delivered', value: metrics?.delivered || 0 },
    { name: 'Opened', value: metrics?.opened || 0 },
    { name: 'Clicked', value: metrics?.clicked || 0 },
  ];

  return (
    <div className="space-y-4">
      {/* AI Insights panel */}
      {aiInsights && (
        <div
          className="rounded-2xl p-6"
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(99,102,241,0.07), rgba(6,182,212,0.05))',
            border: '1px solid rgba(124,58,237,0.2)',
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)', boxShadow: '0 4px 12px rgba(124,58,237,0.4)' }}
            >
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Gemini AI Insights</h3>
              <p className="text-xs text-white/35">Powered by Google Gemini</p>
            </div>
          </div>
          <p className="text-sm text-white/65 leading-relaxed mb-4">{aiInsights.summary}</p>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold text-violet-400 mb-2 uppercase tracking-wider">Recommendations</p>
              <ul className="space-y-1.5">
                {aiInsights.recommendations?.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-white/50">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-cyan-400 mb-2 uppercase tracking-wider">Highlights</p>
              <ul className="space-y-1.5">
                {aiInsights.highlights?.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-white/50">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-cyan-500 shrink-0" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Charts grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Message Funnel Bar Chart */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 className="h-4 w-4 text-violet-400" />
            <div>
              <h3 className="text-sm font-semibold text-white">Message Funnel</h3>
              <p className="text-xs text-white/35">Delivery to engagement pipeline</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={funnelData} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
              <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {funnelData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Channel Performance Donut */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="h-4 w-4 text-cyan-400" />
            <div>
              <h3 className="text-sm font-semibold text-white">Channel Performance</h3>
              <p className="text-xs text-white/35">Open rates by channel</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={metrics?.channelPerformance || []}
                dataKey="openRate"
                nameKey="channel"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                label={({ channel, openRate }: { channel: string; openRate: number }) =>
                  `${channel} ${openRate}%`
                }
                labelLine={false}
              >
                {(metrics?.channelPerformance || []).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v}%`, 'Open Rate']} />
              <Legend
                formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Campaign Comparison */}
      {comparison && comparison.length > 0 && (
        <div
          className="rounded-2xl p-5"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 className="h-4 w-4 text-amber-400" />
            <div>
              <h3 className="text-sm font-semibold text-white">Campaign Comparison</h3>
              <p className="text-xs text-white/35">Performance across recent campaigns</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={comparison} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
              <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
              <Tooltip {...tooltipStyle} />
              <Legend
                formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>{value}</span>}
              />
              <Bar dataKey="deliveryRate" fill="#06b6d4" name="Delivery %" radius={[4, 4, 0, 0]} />
              <Bar dataKey="openRate" fill="#7c3aed" name="Open %" radius={[4, 4, 0, 0]} />
              <Bar dataKey="clickRate" fill="#f59e0b" name="Click %" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
