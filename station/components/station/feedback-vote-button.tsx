'use client';

import { useTransition } from 'react';
import { ArrowBigUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { voteFeedback, unvoteFeedback } from '@/lib/data/actions';

export function FeedbackVoteButton({ postId, voted = false }: { postId: string; voted?: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant={voted ? 'default' : 'secondary'}
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          if (voted) await unvoteFeedback(postId);
          else await voteFeedback(postId);
        })
      }
    >
      <ArrowBigUp className="mr-1 h-4 w-4" /> {voted ? 'Voted' : 'Vote'}
    </Button>
  );
}
