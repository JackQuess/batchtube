import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DiscussionReply } from '@/types/domain';

export function DiscussionReplyList({ items }: { items: DiscussionReply[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Replies</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((reply) => (
          <div key={reply.id} className="rounded-md border border-border p-3">
            <p className="text-sm text-white">{reply.content}</p>
            <p className="mt-1 text-xs text-muted-foreground">@{reply.author_name}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
