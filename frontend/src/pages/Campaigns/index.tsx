import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Sparkles, Rocket } from 'lucide-react';
import { campaignApi } from '@/services/campaignApi';
import { segmentationApi } from '@/services/segmentationApi';
import { Campaign, Segment, Channel } from '@/types';
import { CHANNELS } from '@shared/constants/channels';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

const statusVariant: Record<string, 'default' | 'secondary' | 'warning' | 'success'> = {
  Draft: 'secondary',
  Scheduled: 'warning',
  Running: 'default',
  Completed: 'success',
};

export function Campaigns() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: '',
    objective: '',
    audienceSegmentId: '',
    message: '',
    channel: 'WhatsApp' as Channel,
    tone: 'friendly',
    offer: '',
  });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => campaignApi.list(),
    refetchInterval: 10000,
  });

  const { data: segments } = useQuery({
    queryKey: ['segments'],
    queryFn: () => segmentationApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: () => campaignApi.create(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setShowCreate(false);
      setForm({ name: '', objective: '', audienceSegmentId: '', message: '', channel: 'WhatsApp', tone: 'friendly', offer: '' });
    },
  });

  const launchMutation = useMutation({
    mutationFn: (id: string) => campaignApi.launch(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] }),
  });

  const generateMessageMutation = useMutation({
    mutationFn: () =>
      campaignApi.generateMessage({
        objective: form.objective,
        audienceDescription: segments?.find((s) => s._id === form.audienceSegmentId)?.name || 'target audience',
        tone: form.tone,
        offer: form.offer,
      }),
    onSuccess: (data) => setForm((f) => ({ ...f, message: data.message })),
  });

  const getSegmentName = (seg: Segment | string | null | undefined) => {
    if (seg && typeof seg === 'object') return seg.name;
    if (typeof seg === 'string') return segments?.find((s) => s._id === seg)?.name ?? 'Unknown';
    return 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground mt-1">Create and manage marketing campaigns</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          <Plus className="h-4 w-4" />
          New Campaign
        </Button>
      </div>

      {showCreate && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>Create Campaign</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Campaign name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Textarea placeholder="Campaign objective" value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })} />
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.audienceSegmentId}
              onChange={(e) => setForm({ ...form, audienceSegmentId: e.target.value })}
            >
              <option value="">Select segment</option>
              {segments?.map((s) => (
                <option key={s._id} value={s._id}>{s.name} ({s.customerCount} customers)</option>
              ))}
            </select>
            <div className="flex gap-2">
              {CHANNELS.map((ch) => (
                <Button
                  key={ch}
                  variant={form.channel === ch ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setForm({ ...form, channel: ch })}
                >
                  {ch}
                </Button>
              ))}
            </div>
            <Input placeholder="Tone (friendly, urgent, premium)" value={form.tone} onChange={(e) => setForm({ ...form, tone: e.target.value })} />
            <Input placeholder="Offer (optional)" value={form.offer} onChange={(e) => setForm({ ...form, offer: e.target.value })} />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => generateMessageMutation.mutate()} disabled={!form.objective}>
                <Sparkles className="h-4 w-4" />
                AI Generate Message
              </Button>
            </div>
            <Textarea placeholder="Campaign message (use {{name}} for personalization)" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={3} />
            <Button onClick={() => createMutation.mutate()} disabled={!form.name || !form.objective || !form.audienceSegmentId || !form.message}>
              Create Campaign
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Campaign History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <div className="space-y-3">
              {campaigns?.map((campaign: Campaign) => (
                <div
                  key={campaign._id}
                  className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-accent/30 cursor-pointer transition-colors"
                  onClick={() => navigate(`/campaigns/${campaign._id}`)}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{campaign.name}</p>
                      <Badge variant={statusVariant[campaign.status]}>{campaign.status}</Badge>
                      <Badge variant="outline">{campaign.channel}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{campaign.objective}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Segment: {getSegmentName(campaign.audienceSegmentId)} · {formatDate(campaign.createdAt)}
                    </p>
                  </div>
                  {campaign.status === 'Draft' && (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        launchMutation.mutate(campaign._id);
                      }}
                    >
                      <Rocket className="h-4 w-4" />
                      Launch
                    </Button>
                  )}
                </div>
              ))}
              {(!campaigns || campaigns.length === 0) && (
                <p className="text-muted-foreground text-center py-8">No campaigns yet</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
