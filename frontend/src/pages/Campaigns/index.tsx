import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Rocket, Trash2 } from 'lucide-react';
import { campaignApi } from '@/services/campaignApi';
import { segmentationApi } from '@/services/segmentationApi';
import { Campaign, Segment, Channel } from '@/types';
import { CHANNELS, CHANNEL_CONFIG } from '@shared/constants/channels';
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

const defaultForm = {
  name: 'Re-engagement campaign',
  objective: 'Re-engagement',
  kpi: 'Click-through Rate > 5%',
  audienceSegmentId: '',
  subject: "We've missed you! Here's something special.",
  message: "Hi {{first_name}},\n\nIt's been a while since we saw you around. We wanted to let you know that we've added a ton of new features that make managing your workflow faster than ever.\n\nAs a welcome back, here is a special link to get 20% off your next month.\n\nLet us know if you need any help getting set up!",
  channel: 'WhatsApp' as Channel,
  tone: 'friendly',
  offer: '20% off',
};

const getAiSuggestion = (tone: string, objective: string, offer?: string, channel?: string) => {
  const lowerObjective = objective.toLowerCase();
  const channelLabel = channel ? ` for ${channel}` : '';
  if (tone === 'urgent' || lowerObjective.includes('now') || lowerObjective.includes('limited') || lowerObjective.includes('last') || lowerObjective.includes('hurry')) {
    return {
      title: 'Use a more urgent tone',
      detail: `Emphasize ${offer ?? 'this offer'}${channelLabel} and add a clear call to action so customers feel they must act now.`,
    };
  }
  if (tone === 'premium' || lowerObjective.includes('premium') || lowerObjective.includes('vip') || lowerObjective.includes('exclusive')) {
    return {
      title: 'Highlight exclusivity',
      detail: `Focus on VIP value and upscale language${channelLabel} while keeping the offer clear and concise.`,
    };
  }
  if (tone === 'friendly' || lowerObjective.includes('welcome') || lowerObjective.includes('re-engage') || lowerObjective.includes('win back')) {
    return {
      title: 'Use a warmer tone',
      detail: `Open with a friendly greeting, mention ${offer ?? 'your offer'}${channelLabel}, and keep the message personal and inviting.`,
    };
  }
  return {
    title: 'Keep it personal and concise',
    detail: `Use plain, human language that speaks directly to the customer${channelLabel} while highlighting ${offer ?? 'your promotion'}.`,
  };
};

export function Campaigns() {
  const [form, setForm] = useState(defaultForm);
  const [aiSuggestion, setAiSuggestion] = useState(getAiSuggestion(defaultForm.tone, defaultForm.objective, defaultForm.offer));
  const [sendToAll, setSendToAll] = useState(false);
  const [campaignsFilter, setCampaignsFilter] = useState('All');
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

  const createMutation = useMutation<Campaign, Error, Channel>({
    mutationFn: (channel) =>
      campaignApi.create({
        name: form.name,
        objective: form.objective,
        audienceSegmentId: form.audienceSegmentId,
        message: form.message,
        channel,
        tone: form.tone,
        offer: form.offer,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });

  const launchMutation = useMutation({
    mutationFn: (id: string) => campaignApi.launch(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => campaignApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] }),
  });

  const generateMessageMutation = useMutation({
    mutationFn: () =>
      campaignApi.generateMessage({
        objective: form.objective,
        audienceDescription: segments?.find((s) => s._id === form.audienceSegmentId)?.name || 'target audience',
        tone: form.tone,
        offer: form.offer,
        channel: form.channel,
      }),
    onSuccess: (data) => {
      setForm((prev) => ({ ...prev, message: data.message }));
      setAiSuggestion(getAiSuggestion(form.tone, form.objective, form.offer));
    },
  });

  const selectedSegment = useMemo(
    () => segments?.find((segment) => segment._id === form.audienceSegmentId),
    [form.audienceSegmentId, segments]
  );

  useEffect(() => {
    setAiSuggestion(getAiSuggestion(form.tone, form.objective, form.offer, form.channel));
  }, [form.tone, form.objective, form.offer, form.channel]);

  const channelMatches = useMemo(
    () =>
      CHANNELS.map((channel) => {
        const score = Math.min(
          98,
          Math.round(CHANNEL_CONFIG[channel].openRate * 100 + (channel === form.channel ? 12 : 0))
        );
        return {
          channel,
          label: channel === 'Email' ? 'Email Sequence' : channel === 'SMS' ? 'SMS Bump' : `${channel} Flow`,
          score,
        };
      }),
    [form.channel]
  );

  const filteredCampaigns = useMemo(() => {
    if (!campaigns) return [];
    if (campaignsFilter === 'All') return campaigns;
    return campaigns.filter((item) => item.status === campaignsFilter);
  }, [campaigns, campaignsFilter]);

  const handleSaveDraft = async () => {
    if (sendToAll) {
      await Promise.all(CHANNELS.map((channel) => createMutation.mutateAsync(channel)));
    } else {
      await createMutation.mutateAsync(form.channel);
    }
  };

  const handleReviewLaunch = async () => {
    if (sendToAll) {
      const campaigns = await Promise.all(CHANNELS.map((channel) => createMutation.mutateAsync(channel)));
      navigate(`/campaigns/${campaigns[0]._id}`);
    } else {
      await createMutation.mutateAsync(form.channel, {
        onSuccess: (campaign) => {
          navigate(`/campaigns/${campaign._id}`);
        },
      });
    }
  };

  const handleCreateMessage = () => {
    setAiSuggestion(getAiSuggestion(form.tone, form.objective, form.offer));
    generateMessageMutation.mutate();
  };

  const handleChannelSelect = (channel: Channel) => {
    setForm((prev) => ({ ...prev, channel }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="text-sm uppercase tracking-[0.24em] text-white/40">Campaigns</div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Campaign Copilot</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/60">
            AI-assisted campaign generation and deployment for re-engagement, conversions, and channel optimization.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleSaveDraft} disabled={!form.audienceSegmentId || !form.objective || !form.message}>
            Save Draft
          </Button>
          <Button size="sm" onClick={handleReviewLaunch} disabled={!form.audienceSegmentId || !form.objective || !form.message}>
            Review &amp; Launch
          </Button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_1.4fr_0.9fr]">
        <div className="space-y-5">
          <Card className="bg-white/5 border border-white/10">
            <CardHeader>
              <CardTitle>Goal Definition</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.24em] text-white/50">Campaign name</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter campaign name"
                  className="text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.24em] text-white/50">Campaign objective</label>
                <Input
                  value={form.objective}
                  onChange={(e) => setForm((prev) => ({ ...prev, objective: e.target.value }))}
                  placeholder="E.g. Re-engagement"
                  className="text-white"
                />
                <div className="flex flex-wrap gap-2">
                  {['Re-engagement', 'Win-back', 'Promo offer', 'Brand awareness'].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, objective: option }))}
                      className={`rounded-full border px-3 py-1 text-xs transition ${
                        form.objective === option
                          ? 'border-white/20 bg-white/10 text-white'
                          : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:bg-white/10'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.24em] text-white/50">Primary KPI</label>
                <select
                  className="flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-slate-900 outline-none"
                  value={form.kpi}
                  onChange={(e) => setForm((prev) => ({ ...prev, kpi: e.target.value }))}
                >
                  <option className="text-slate-900" value="Click-through Rate > 5%">Click-through Rate &gt; 5%</option>
                  <option className="text-slate-900" value="Open Rate > 25%">Open Rate &gt; 25%</option>
                  <option className="text-slate-900" value="Conversion Rate > 3%">Conversion Rate &gt; 3%</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border border-white/10">
            <CardHeader>
              <CardTitle>Target Segment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <select
                className="flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-slate-900 outline-none"
                value={form.audienceSegmentId}
                onChange={(e) => setForm((prev) => ({ ...prev, audienceSegmentId: e.target.value }))}
              >
                <option className="text-slate-900" value="">Choose segment</option>
                {segments?.map((segment) => (
                  <option key={segment._id} className="text-slate-900" value={segment._id}>
                    {segment.name} ({segment.customerCount} users)
                  </option>
                ))}
              </select>
              <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm text-white/70">{selectedSegment?.naturalLanguageQuery || 'Select a segment to view the target description and match score.'}</p>
                {selectedSegment && (
                  <div className="mt-4 rounded-2xl bg-white/5 p-3 text-xs text-white/70">
                    {selectedSegment.customerCount.toLocaleString('en-IN')} users • High churn risk profile
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border border-white/10">
            <CardHeader>
              <CardTitle>AI Channel Strategy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {channelMatches.map((channelMatch) => (
                  <div key={channelMatch.channel} className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-white/75">
                      <span>{channelMatch.label}</span>
                      <span className="font-semibold">{channelMatch.score}% Match</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-400 via-fuchsia-500 to-cyan-400 transition-all"
                        style={{ width: `${channelMatch.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="bg-white/5 border border-white/10">
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Campaign copy</CardTitle>
                <p className="text-sm text-white/60">Draft your subject line and message with real-time AI suggestions.</p>
              </div>
              <div className="flex flex-col gap-3 sm:items-end">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs uppercase tracking-[0.24em] text-white/50">Channel</span>
                  <select
                    className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-slate-900 outline-none"
                    value={form.channel}
                    onChange={(e) => setForm((prev) => ({ ...prev, channel: e.target.value as Channel }))}
                  >
                    {CHANNELS.map((channel) => (
                      <option key={channel} className="text-slate-900" value={channel}>
                        {channel}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <input
                    id="send-all"
                    type="checkbox"
                    checked={sendToAll}
                    onChange={(e) => setSendToAll(e.target.checked)}
                    className="h-4 w-4 rounded border-white/20 bg-white/5 text-primary focus:ring-primary"
                  />
                  <label htmlFor="send-all" className="select-none">
                    Send to all channels (WhatsApp, SMS, Email, RCS)
                  </label>
                </div>
                <Badge variant="secondary">{sendToAll ? 'All channels' : form.channel}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <label className="text-xs uppercase tracking-[0.24em] text-white/50">Subject line</label>
                <Input
                  value={form.subject}
                  onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
                  placeholder="Subject line"
                  className="text-white"
                />
              </div>
              <div className="space-y-3">
                <label className="text-xs uppercase tracking-[0.24em] text-white/50">Message</label>
                <Textarea
                  value={form.message}
                  onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
                  rows={10}
                  className="text-white"
                />
              </div>
              <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between text-sm text-white/70">
                  <span>AI Suggestion</span>
                  <span className="font-semibold text-white">{aiSuggestion.title}</span>
                </div>
                <p className="mt-3 text-sm text-white/60">
                  {aiSuggestion.detail}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleCreateMessage}>
                  <Sparkles className="h-4 w-4" />
                  Regenerate copy
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setForm(defaultForm)}>
                  Reset draft
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border border-white/10">
            <CardHeader>
              <CardTitle>Campaign Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-white/50">Desktop Preview</p>
                <div className="mt-4 space-y-3 rounded-3xl bg-white/5 p-4 text-white">
                  <p className="text-sm font-semibold text-white">{form.subject || 'No subject yet'}</p>
                  <div className="text-sm text-white/70 whitespace-pre-wrap break-words">
                    {form.message || 'No message generated yet.'}
                  </div>
                </div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-white/50">Mobile Preview</p>
                <div className="mt-4 rounded-3xl bg-white/5 p-4 text-white">
                  <p className="text-sm font-semibold text-white">{form.subject || 'No subject yet'}</p>
                  <div className="mt-2 text-sm text-white/70 whitespace-pre-wrap break-words max-h-40 overflow-hidden">
                    {form.message || 'No message generated yet.'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="bg-white/5 border border-white/10">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm text-white/70">
                <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/50">Campaign name</p>
                  <p className="mt-2 font-medium text-white">{form.name}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/50">Selected segment</p>
                  <p className="mt-2 font-medium text-white">{selectedSegment?.name || 'No segment selected'}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/50">Estimated match</p>
                  <p className="mt-2 font-medium text-white">{Math.max(...channelMatches.map((item) => item.score))}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border border-white/10">
            <CardHeader>
              <CardTitle>Campaign history</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between gap-3 text-sm text-white/60">
                <span>Filter</span>
                <select
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-900 outline-none"
                  value={campaignsFilter}
                  onChange={(e) => setCampaignsFilter(e.target.value)}
                >
                  <option value="All" className="text-slate-900">All</option>
                  <option value="Draft" className="text-slate-900">Draft</option>
                  <option value="Scheduled" className="text-slate-900">Scheduled</option>
                  <option value="Running" className="text-slate-900">Running</option>
                  <option value="Completed" className="text-slate-900">Completed</option>
                </select>
              </div>
              {isLoading ? (
                <p className="text-sm text-white/60">Loading campaigns...</p>
              ) : (
                filteredCampaigns.slice(0, 4).map((campaign) => (
                  <button
                    key={campaign._id}
                    className="w-full rounded-3xl border border-white/10 bg-black/20 p-4 text-left text-sm text-white transition hover:border-white/20"
                    onClick={() => navigate(`/campaigns/${campaign._id}`)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{campaign.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={statusVariant[campaign.status]}>{campaign.status}</Badge>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            if (window.confirm('Delete this campaign?')) {
                              deleteMutation.mutate(campaign._id);
                            }
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition hover:bg-red-500 hover:text-white"
                          disabled={deleteMutation.isLoading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-white/50">{campaign.objective}</p>
                  </button>
                ))
              )}
              {filteredCampaigns?.length === 0 && !isLoading && (
                <p className="text-sm text-white/50">No campaigns in this view yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
