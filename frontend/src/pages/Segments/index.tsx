import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { segmentationApi } from '@/services/segmentationApi';
import { SegmentBuilder } from '@/components/SegmentBuilder';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function Segments() {
  const queryClient = useQueryClient();

  const { data: segments } = useQuery({
    queryKey: ['segments'],
    queryFn: () => segmentationApi.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => segmentationApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['segments'] }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Segments</h1>
        <p className="text-muted-foreground mt-1">Phase 2: AI-powered segmentation with approval workflow</p>
      </div>

      <SegmentBuilder onApproved={() => queryClient.invalidateQueries({ queryKey: ['segments'] })} />

      <Card>
        <CardHeader>
          <CardTitle>Approved Segments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {segments?.map((segment) => (
              <div key={segment._id} className="rounded-lg border border-border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{segment.name}</p>
                      <Badge variant={segment.status === 'approved' ? 'success' : 'secondary'}>
                        {segment.status || 'draft'}
                      </Badge>
                    </div>
                    {segment.naturalLanguageQuery && (
                      <p className="text-sm text-muted-foreground mt-1">{segment.naturalLanguageQuery}</p>
                    )}
                    <Badge variant="outline" className="mt-2">{segment.customerCount} customers</Badge>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(segment._id)}>
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
