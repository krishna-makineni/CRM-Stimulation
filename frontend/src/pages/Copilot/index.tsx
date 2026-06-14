import { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Send, Sparkles, CheckCircle, Circle, Loader2 } from 'lucide-react';
import { copilotApi } from '@/services/campaignApi';
import { CampaignPreview } from '@/components/CampaignPreview';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const SUGGESTIONS = [
  'Launch a win-back campaign for customers inactive 90 days spending over ₹5000',
  'Promote skincare products to premium customers in Mumbai',
  'Re-engage Gold tier customers who haven\'t ordered in 30 days',
];

export function Copilot() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const queryClient = useQueryClient();

  const startMutation = useMutation({
    mutationFn: () => copilotApi.startSession(),
    onSuccess: (data) => {
      setSessionId(data.id);
      queryClient.setQueryData(['copilot', data.id], data);
    },
  });

  const { data: session, error: sessionError, refetch } = useQuery({
    queryKey: ['copilot', sessionId],
    queryFn: () => copilotApi.getSession(sessionId!),
    enabled: !!sessionId,
    retry: false,
  });

  const sendMutation = useMutation({
    mutationFn: (message: string) => copilotApi.sendMessage(sessionId!, message),
    onSuccess: (data) => {
      if (sessionId) queryClient.setQueryData(['copilot', sessionId], data);
      refetch();
    },
    onError: (error) => {
      if (error instanceof Error && error.message.includes('HTTP 404')) {
        setSessionId(null);
      }
    },
  });

  useEffect(() => {
    if (!sessionId) startMutation.mutate();
  }, [sessionId]);

  useEffect(() => {
    if (sessionError instanceof Error && sessionError.message.includes('HTTP 404')) {
      setSessionId(null);
    }
  }, [sessionError]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages]);

  const handleSend = () => {
    if (!input.trim() || !sessionId) return;
    sendMutation.mutate(input);
    setInput('');
  };

  const handleQuickAction = (message: string) => {
    if (!sessionId || sendMutation.isPending) return;
    sendMutation.mutate(message);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderMessage = (content: string) => {
    return content.split('\n').map((line, i) => {
      const formatted = line
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/`(.*?)`/g, '<code class="bg-background px-1 rounded text-xs">$1</code>')
        .replace(/^> (.+)/, '<blockquote class="border-l-2 border-primary pl-3 italic text-muted-foreground">$1</blockquote>');

      if (line.startsWith('> ')) {
        return <div key={i} dangerouslySetInnerHTML={{ __html: formatted }} />;
      }
      return <p key={i} className="mb-1" dangerouslySetInnerHTML={{ __html: formatted }} />;
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          AI Campaign Copilot
        </h1>
        <p className="text-muted-foreground mt-1">
          Describe your marketing goal — I'll build the segment, recommend a channel, draft the message, and wait for your approval.
        </p>
      </div>

      <div className="grid gap-6 justify-center lg:grid-cols-[minmax(0,900px)_320px]">
        <div className="lg:col-span-2 flex justify-center">
          <Card className="h-[600px] w-full max-w-[900px] flex flex-col border-primary/20">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-lg">Chat</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {session?.messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex',
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[85%] rounded-lg px-4 py-3 text-sm',
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-accent border border-border'
                    )}
                  >
                    {renderMessage(msg.content)}
                  </div>
                </div>
              ))}
              {sendMutation.isPending && (
                <div className="flex justify-start">
                  <div className="bg-accent border border-border rounded-lg px-4 py-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    {session?.reviewStage === 'details' ? 'Launching or updating campaign...' : 'Building campaign draft...'}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </CardContent>

            <div className="p-4 border-t border-border">
              {!session?.awaitingApproval && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setInput(s)}
                      className="text-xs rounded-full border border-border px-3 py-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                    >
                      {s.length > 60 ? s.slice(0, 60) + '...' : s}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Textarea
                  placeholder={session?.awaitingApproval ? 'Change the name, offer, channel, tone, or message...' : 'Describe your campaign goal...'}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={2}
                  className="resize-none"
                />
                <Button onClick={handleSend} disabled={!input.trim() || sendMutation.isPending} className="self-end">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {session?.awaitingApproval && session.reviewStage !== 'details' && (
              <div className="p-4 border-t border-border flex gap-3">
                <Button onClick={() => handleQuickAction('review details')} disabled={sendMutation.isPending}>
                  <CheckCircle className="h-4 w-4" />
                  Review Details
                </Button>
                <Button variant="outline" onClick={() => sendMutation.mutate('cancel')}>
                  Cancel
                </Button>
              </div>
            )}

            {session?.awaitingApproval && session.reviewStage === 'details' && (
              <div className="p-4 border-t border-border flex gap-3 flex-wrap">
                <Button onClick={() => handleQuickAction('launch now')} disabled={sendMutation.isPending}>
                  {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  Launch Campaign
                </Button>
                <Button variant="secondary" onClick={() => handleQuickAction('save draft')} disabled={sendMutation.isPending}>
                  Save Draft
                </Button>
                <Button variant="outline" onClick={() => handleQuickAction('cancel')} disabled={sendMutation.isPending}>
                  Cancel
                </Button>
              </div>
            )}
          </Card>
        </div>

        <div>
          {session?.campaignPreview && (
            <div className="mt-4">
              <CampaignPreview preview={session.campaignPreview} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
