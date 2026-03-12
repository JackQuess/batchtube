import { Badge } from '@/components/ui/badge';

export function TagPill({ tag }: { tag: string }) {
  return <Badge>#{tag}</Badge>;
}
