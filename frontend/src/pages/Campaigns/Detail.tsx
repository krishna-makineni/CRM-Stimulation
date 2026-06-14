import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { campaignApi } from '@/services/campaignApi';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCard } from '@/components/MetricCard';
import { Send, CheckCircle, Eye, MousePointer } from 'lucide-react';

export function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => campaignApi.getById(id!),
    enabled: !!id,
    refetchInterval: 5000,
  });

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;
  if (!data) return <p>Campaign not found</p>;

  const { campaign, analytics, communications } = data;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate('/campaigns')}>
        <ArrowLeft className="h-4 w-4" />
        Back to Campaigns
      </Button>

      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">{campaign.name}</h1>
          <Badge>{campaign.status}</Badge>
          <Badge variant="outline">{campaign.channel}</Badge>
        </div>
        <p className="text-muted-foreground mt-1">{campaign.objective}</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground mb-1">Message</p>
          <p className="text-lg">{campaign.message}</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Total Sent" value={analytics.total} icon={Send} />
        <MetricCard title="Delivery Rate" value={`${analytics.deliveryRate}%`} icon={CheckCircle} />
        <MetricCard title="Open Rate" value={`${analytics.openRate}%`} icon={Eye} />
        <MetricCard title="Click Rate" value={`${analytics.clickRate}%`} icon={MousePointer} />
      </div>

      {analytics.timeline.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Delivery Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analytics.timeline} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="sentGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.4} />
                  </linearGradient>
                  <linearGradient id="deliveredGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.35} />
                  </linearGradient>
                  <linearGradient id="openedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.35} />
                  </linearGradient>
                  <linearGradient id="clickedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0.35} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#cbd5e1', fontSize: 12 }} padding={{ left: 10, right: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#cbd5e1', fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: 'rgba(15,23,42,0.15)' }}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '10px',
                    color: '#e2e8f0',
                    boxShadow: '0 12px 30px rgba(15,23,42,0.35)',
                  }}
                  labelStyle={{ color: '#94a3b8', fontSize: 12 }}
                  itemStyle={{ color: '#ffffff', fontSize: 13 }}
                />
                <Bar dataKey="sent" fill="url(#sentGradient)" radius={[10, 10, 0, 0]} barSize={28} name="Sent" />
                <Bar dataKey="delivered" fill="url(#deliveredGradient)" radius={[10, 10, 0, 0]} barSize={28} name="Delivered" />
                <Bar dataKey="opened" fill="url(#openedGradient)" radius={[10, 10, 0, 0]} barSize={28} name="Opened" />
                <Bar dataKey="clicked" fill="url(#clickedGradient)" radius={[10, 10, 0, 0]} barSize={28} name="Clicked" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Communications ({communications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Channel</th>
                </tr>
              </thead>
              <tbody>
                {communications.map((comm) => (
                  <tr key={comm._id} className="border-b border-border/50">
                    <td className="py-2">
                      {typeof comm.customerId === 'object' ? comm.customerId.name : 'Unknown'}
                    </td>
                    <td className="py-2">
                      <Badge variant={comm.status === 'FAILED' ? 'destructive' : 'secondary'}>
                        {comm.status}
                      </Badge>
                    </td>
                    <td className="py-2">{comm.channel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
