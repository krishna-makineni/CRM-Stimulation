import { useQuery } from '@tanstack/react-query';
import {
  Users, Megaphone, Send, CheckCircle, XCircle, Eye, MousePointer,
  TrendingUp, ArrowUpRight, ArrowDownRight, Sparkles, BarChart3,
} from 'lucide-react';
import { analyticsApi } from '@/services/analyticsApi';
import { AnalyticsCharts } from '@/components/AnalyticsCharts';
import { DashboardMetrics } from '@/types';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

// ── Helper ──
function fmtNum(n: number) {
  if (n >= 10_00_000) return `${(n / 10_00_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

// ── Metric Card ──
interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  gradient: string;
  change?: number;
  prefix?: string;
}

function MetricCard({ title, value, subtitle, icon: Icon, color, gradient, change, prefix = '' }: MetricCardProps) {
  return (
    <div
      className="metric-card relative rounded-2xl p-5 transition-transform duration-200 hover:-translate-y-0.5 cursor-default"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
      }}
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-300"
        style={{ background: `radial-gradient(ellipse at top left, ${color}10, transparent 70%)` }}
      />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-white/40 mb-3 tracking-wide uppercase">{title}</p>
          <p className="text-3xl font-bold text-white tracking-tight">
            {prefix}{typeof value === 'number' ? fmtNum(value) : value}
          </p>
          {subtitle && <p className="text-xs text-white/35 mt-1">{subtitle}</p>}
          {change !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(change)}% vs last month
            </div>
          )}
        </div>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0"
          style={{ background: gradient, boxShadow: `0 4px 12px ${color}40` }}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}

// ── Channel Performance Bar ──
function ChannelBar({ channel, rate, color }: { channel: string; rate: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-white/50 w-16 shrink-0">{channel}</span>
      <div className="flex-1 progress-bar">
        <div
          className="progress-bar-fill"
          style={{
            width: `${rate}%`,
            background: `linear-gradient(90deg, ${color}, ${color}99)`,
          }}
        />
      </div>
      <span className="text-xs font-semibold text-white/70 w-8 text-right">{rate}%</span>
    </div>
  );
}

// ── Sparkline mini chart data ──
const sparkData = Array.from({ length: 12 }, (_, i) => ({ v: Math.random() * 100 + 20 }));

export function Dashboard() {
  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ['dashboard'],
    queryFn: () => analyticsApi.getDashboard(),
    refetchInterval: 10000,
  });

  const { data: comparison } = useQuery({
    queryKey: ['comparison'],
    queryFn: () => analyticsApi.getComparison(),
  });

  const { data: aiInsights } = useQuery({
    queryKey: ['ai-insights'],
    queryFn: () => analyticsApi.getInsights(),
  });

  const { data: channels } = useQuery({
    queryKey: ['channels'],
    queryFn: () => analyticsApi.getChannels(),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div
          className="h-10 w-10 rounded-full animate-spin"
          style={{ border: '2px solid rgba(124,58,237,0.2)', borderTopColor: '#7c3aed' }}
        />
        <p className="text-white/40 text-sm">Loading dashboard...</p>
      </div>
    );
  }

  const deliveryRate = metrics?.messagesSent
    ? Math.round(((metrics?.delivered || 0) / metrics.messagesSent) * 100)
    : 0;

  const openRate = metrics?.delivered
    ? Math.round(((metrics?.opened || 0) / metrics.delivered) * 100)
    : 0;

  // Donut data for message funnel
  const funnelData = [
    { name: 'Delivered', value: metrics?.delivered || 0, color: '#10b981' },
    { name: 'Opened', value: metrics?.opened || 0, color: '#7c3aed' },
    { name: 'Clicked', value: metrics?.clicked || 0, color: '#06b6d4' },
    { name: 'Failed', value: metrics?.failed || 0, color: '#f43f5e' },
  ];

  return (
    <div className="space-y-6 slide-up">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Good evening, <span className="gradient-text">Nykaa CRM</span> 👋
          </h1>
          <p className="text-white/40 text-sm mt-1">Here's what's happening with your campaigns today</p>
        </div>
        <div
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm"
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(99,102,241,0.15))',
            border: '1px solid rgba(124,58,237,0.3)',
          }}
        >
          <Sparkles className="h-4 w-4 text-violet-400" />
          <span className="text-violet-300 font-medium text-xs">AI Insights Available</span>
        </div>
      </div>

      {/* Primary Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Customers"
          value={metrics?.totalCustomers || 0}
          subtitle="Nykaa beauty contacts"
          icon={Users}
          color="#7c3aed"
          gradient="linear-gradient(135deg, #7c3aed, #6366f1)"
          change={12}
        />
        <MetricCard
          title="Active Campaigns"
          value={metrics?.totalCampaigns || 0}
          subtitle="Across all channels"
          icon={Megaphone}
          color="#06b6d4"
          gradient="linear-gradient(135deg, #06b6d4, #0ea5e9)"
          change={8}
        />
        <MetricCard
          title="Messages Sent"
          value={metrics?.messagesSent || 0}
          subtitle="Total dispatched"
          icon={Send}
          color="#10b981"
          gradient="linear-gradient(135deg, #10b981, #059669)"
          change={24}
        />
        <MetricCard
          title="Delivered"
          value={metrics?.delivered || 0}
          subtitle={`${deliveryRate}% delivery rate`}
          icon={CheckCircle}
          color="#f59e0b"
          gradient="linear-gradient(135deg, #f59e0b, #d97706)"
          change={5}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          title="Failed Deliveries"
          value={metrics?.failed || 0}
          icon={XCircle}
          color="#f43f5e"
          gradient="linear-gradient(135deg, #f43f5e, #e11d48)"
        />
        <MetricCard
          title="Messages Opened"
          value={metrics?.opened || 0}
          subtitle={`${openRate}% open rate`}
          icon={Eye}
          color="#a78bfa"
          gradient="linear-gradient(135deg, #a78bfa, #7c3aed)"
          change={15}
        />
        <MetricCard
          title="Clicked"
          value={metrics?.clicked || 0}
          subtitle="CTA interactions"
          icon={MousePointer}
          color="#34d399"
          gradient="linear-gradient(135deg, #34d399, #10b981)"
          change={31}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Message Funnel */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 className="h-4 w-4 text-violet-400" />
            <h3 className="text-sm font-semibold text-white">Message Funnel</h3>
          </div>
          <div className="flex items-center justify-center">
            <PieChart width={160} height={160}>
              <Pie
                data={funnelData}
                cx={75}
                cy={75}
                innerRadius={45}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
              >
                {funnelData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number) => [fmtNum(v), '']}
                contentStyle={{
                  background: 'rgba(15,12,30,0.95)',
                  border: '1px solid rgba(124,58,237,0.3)',
                  borderRadius: 10,
                  color: 'white',
                  fontSize: 12,
                }}
              />
            </PieChart>
          </div>
          <div className="space-y-2 mt-2">
            {funnelData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                  <span className="text-white/50">{d.name}</span>
                </div>
                <span className="text-white/80 font-semibold">{fmtNum(d.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Channel Performance */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Channel Open Rates</h3>
          </div>
          <div className="space-y-4">
            {channels?.map((ch: { channel: string; openRate: number }, i: number) => {
              const colors = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b'];
              return (
                <ChannelBar key={ch.channel} channel={ch.channel} rate={ch.openRate} color={colors[i % colors.length]} />
              );
            })}
            {!channels && (
              <>
                <ChannelBar channel="WhatsApp" rate={72} color="#25d366" />
                <ChannelBar channel="Email" rate={40} color="#7c3aed" />
                <ChannelBar channel="SMS" rate={45} color="#06b6d4" />
                <ChannelBar channel="RCS" rate={55} color="#f59e0b" />
              </>
            )}
          </div>
        </div>

        {/* Trend sparkline */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">Engagement Trend</h3>
            </div>
            <span className="badge-success rounded-full px-2 py-0.5 text-[10px] font-semibold">+24%</span>
          </div>
          <p className="text-xs text-white/35 mb-4">Last 12 weeks</p>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={sparkData}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke="#7c3aed" strokeWidth={2} fill="url(#grad)" dot={false} />
              <Tooltip
                formatter={(v: number) => [v.toFixed(0) + '%', 'Engagement']}
                contentStyle={{
                  background: 'rgba(15,12,30,0.95)',
                  border: '1px solid rgba(124,58,237,0.3)',
                  borderRadius: 10,
                  color: 'white',
                  fontSize: 12,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Insights */}
      {aiInsights && (
        <div
          className="rounded-2xl p-5"
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(99,102,241,0.07))',
            border: '1px solid rgba(124,58,237,0.2)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}
            >
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-white">Gemini AI Insights</h3>
          </div>
          <p className="text-sm text-white/60 leading-relaxed">
            {typeof aiInsights === 'string' ? aiInsights : JSON.stringify(aiInsights)}
          </p>
        </div>
      )}

      {/* Campaign Comparison */}
      <AnalyticsCharts
        metrics={metrics}
        comparison={comparison as Record<string, unknown>[] | undefined}
        aiInsights={aiInsights}
      />
    </div>
  );
}
