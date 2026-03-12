import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { FeedbackComment } from '@/types/domain';

export function FeedbackCommentList({ items }: { items: FeedbackComment[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Comments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((comment) => (
          <div key={comment.id} className="rounded-md border border-border p-3">
            <p className="text-sm text-white">{comment.content}</p>
            <p className="mt-1 text-xs text-muted-foreground">@{comment.author_name}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
