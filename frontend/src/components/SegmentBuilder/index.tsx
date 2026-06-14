import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Sparkles, CheckCircle, XCircle, MessageCircle } from 'lucide-react';
import { segmentationApi, ParseSegmentResult } from '@/services/segmentationApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';

interface SegmentBuilderProps {
  onApproved: () => void;
}

export function SegmentBuilder({ onApproved }: SegmentBuilderProps) {
  const [query, setQuery] = useState('');
  const [refinement, setRefinement] = useState('');
  const [segmentName, setSegmentName] = useState('');
  const [parseResult, setParseResult] = useState<ParseSegmentResult | null>(null);

  const parseMutation = useMutation({
    mutationFn: (payload: { query: string; refinementContext?: string }) =>
      segmentationApi.parse(payload),
    onSuccess: (data) => {
      setParseResult(data);
      if (data.suggestedName) setSegmentName(data.suggestedName);
    },
  });

  const approveMutation = useMutation({
    mutationFn: () =>
      segmentationApi.approve({
        name: segmentName,
        criteria: parseResult?.criteria,
        naturalLanguageQuery: query,
        insights: parseResult?.insights,
        campaignRecommendations: parseResult?.campaignRecommendations,
      }),
    onSuccess: () => {
      resetBuilder();
      onApproved();
    },
  });

  const resetBuilder = () => {
    setQuery('');
    setRefinement('');
    setSegmentName('');
    setParseResult(null);
  };

  const handleGenerate = () => {
    parseMutation.mutate({
      query,
      refinementContext: refinement || undefined,
    });
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Smart Segment Builder
        </CardTitle>
        <CardDescription>
          Describe the customers you want to reach in simple language, then review the generated segment and recommendations.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Find customers who spent more than ₹10000 and inactive for 60 days..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={3}
        />

        {parseResult?.ambiguous && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 space-y-3">
            <p className="text-sm font-medium flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Ambiguous query — please refine
            </p>
            <ul className="text-sm text-muted-foreground list-disc pl-5">
              {parseResult.clarifyingQuestions?.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
            <Textarea
              placeholder="Add more details to refine your segment..."
              value={refinement}
              onChange={(e) => setRefinement(e.target.value)}
              rows={2}
            />
          </div>
        )}

        <Button onClick={handleGenerate} disabled={!query || parseMutation.isPending}>
          <Sparkles className="h-4 w-4" />
          {parseMutation.isPending ? 'Processing job...' : 'Generate Segment'}
        </Button>

        {parseResult && !parseResult.ambiguous && (
          <div className="space-y-4 rounded-lg border border-border bg-accent/30 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Extracted Filters</p>
              <Badge variant="success">{parseResult.customerCount} customers</Badge>
            </div>
            <pre className="text-sm bg-background rounded p-3 overflow-x-auto">
              {JSON.stringify(parseResult.criteria, null, 2)}
            </pre>

            {parseResult.insights && (
              <div>
                <p className="text-sm font-medium mb-1">Segment Insights</p>
                <p className="text-sm text-muted-foreground">{parseResult.insights.summary}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Avg spend: {formatCurrency(parseResult.insights.avgSpend)}
                </p>
              </div>
            )}

            {parseResult.campaignRecommendations && parseResult.campaignRecommendations.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Campaign Recommendations</p>
                {parseResult.campaignRecommendations.map((rec, i) => (
                  <div key={i} className="text-sm border border-border rounded p-2 mb-2">
                    <Badge className="mb-1">{rec.channel}</Badge>
                    <p className="text-muted-foreground">{rec.reason}</p>
                  </div>
                ))}
              </div>
            )}

            <Input
              placeholder="Auto-generated segment name"
              value={segmentName}
              onChange={(e) => setSegmentName(e.target.value)}
            />

            <div className="flex gap-2">
              <Button onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending}>
                <CheckCircle className="h-4 w-4" />
                Approve Segment
              </Button>
              <Button variant="outline" onClick={resetBuilder}>
                <XCircle className="h-4 w-4" />
                Reject
              </Button>
            </div>

            {parseResult.customers?.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Preview</p>
                {parseResult.customers.slice(0, 5).map((c) => (
                  <div key={c._id} className="flex justify-between text-sm rounded border border-border p-2 mb-1">
                    <span>{c.name} — {c.city}</span>
                    <span className="text-muted-foreground">{formatCurrency(c.totalSpend)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
