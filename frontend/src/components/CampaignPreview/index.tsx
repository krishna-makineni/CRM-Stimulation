import { CopilotSession } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CampaignPreviewProps {
  preview: NonNullable<CopilotSession['campaignPreview']>;
}

export function CampaignPreview({ preview }: CampaignPreviewProps) {
  const sentPreview = preview.sentPreview ?? preview.message;

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="text-lg">Campaign Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="space-y-2">
          <div>
            <p className="text-xs text-muted-foreground">Campaign</p>
            <p className="font-medium">{preview.name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Audience</p>
            <p>{preview.customerCount} customers from "{preview.segmentQuery}"</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge>{preview.channel}</Badge>
          {preview.tone && <Badge variant="outline">{preview.tone}</Badge>}
          {preview.offer && <Badge variant="outline">{preview.offer}</Badge>}
          {preview.sampleCustomerName && (
            <span className="text-xs text-muted-foreground">Sample: {preview.sampleCustomerName}</span>
          )}
        </div>

        <div className="space-y-2">
          <p className="font-medium">AI-generated message</p>
          <div className="rounded-md border border-border bg-background p-3 leading-relaxed whitespace-pre-wrap">
            {preview.message}
          </div>
        </div>

        <div className="space-y-2">
          <p className="font-medium">How it will be sent</p>
          <div className="rounded-md border border-primary/30 bg-primary/10 p-3 leading-relaxed whitespace-pre-wrap">
            {sentPreview}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
