import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';

export function SearchResultCard({ href, type, title, summary }: { href: string; type: string; title: string; summary?: string }) {
  return (
    <Link href={href}>
      <Card className="hover:border-primary/50">
        <CardContent className="py-3">
          <p className="text-xs uppercase text-muted-foreground">{type}</p>
          <p className="text-sm font-medium text-white">{title}</p>
          {summary ? <p className="mt-1 text-xs text-muted-foreground">{summary}</p> : null}
        </CardContent>
      </Card>
    </Link>
  );
}
