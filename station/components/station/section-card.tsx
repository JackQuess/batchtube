import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function SectionCard({ href, title, description, icon: Icon }: { href: string; title: string; description: string; icon: LucideIcon }) {
  return (
    <Link href={href}>
      <Card className="h-full transition hover:border-primary/55 hover:bg-white/[0.04]">
        <CardHeader>
          <div className="mb-3 flex items-center justify-between">
            <Icon className="h-4 w-4 text-primary" />
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </Link>
  );
}
