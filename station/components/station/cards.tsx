import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/station/status-badge';
import { TagPill } from '@/components/station/tag-pill';
import type { ChangelogEntry, Discussion, FeedbackPost, Incident, KnownIssue, ProviderStatus, RoadmapItem, TemplatePreset } from '@/types/domain';

export function ProviderStatusCard({ item }: { item: ProviderStatus }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="capitalize">{item.provider_key}</CardTitle>
          <StatusBadge value={item.status} />
        </div>
        <CardDescription>{item.summary}</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <div>Success: {item.success_rate ?? '-'}%</div>
        <div>Recovery: {item.retry_recovery_rate ?? '-'}%</div>
      </CardContent>
    </Card>
  );
}

export function IncidentCard({ item }: { item: Incident }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm"><Link href={`/status/${item.provider_key}`}>{item.title}</Link></CardTitle>
          <StatusBadge value={item.status} />
        </div>
        <CardDescription>{item.summary}</CardDescription>
      </CardHeader>
    </Card>
  );
}

export function IssueCard({ item }: { item: KnownIssue }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm"><Link href={`/issues/${item.slug}`}>{item.title}</Link></CardTitle>
          <StatusBadge value={item.state} />
        </div>
        <CardDescription>{item.summary}</CardDescription>
      </CardHeader>
    </Card>
  );
}

export function FeedbackCard({ item }: { item: FeedbackPost }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm"><Link href={`/feedback/${item.slug}`}>{item.title}</Link></CardTitle>
          <StatusBadge value={item.status} />
        </div>
        <CardDescription>{item.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex gap-2 text-xs text-muted-foreground">
        <span>{item.votes_count} votes</span>
        <span>{item.comments_count} comments</span>
      </CardContent>
    </Card>
  );
}

export function RoadmapCard({ item }: { item: RoadmapItem }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm"><Link href={`/roadmap/${item.slug}`}>{item.title}</Link></CardTitle>
          <StatusBadge value={item.status} />
        </div>
        <CardDescription>{item.summary}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">{item.tags.map((t) => <TagPill key={t} tag={t} />)}</CardContent>
    </Card>
  );
}

export function TemplateCard({ item }: { item: TemplatePreset }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm"><Link href={`/templates/${item.slug}`}>{item.title}</Link></CardTitle>
        <CardDescription>{item.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <TagPill tag={item.provider} />
        <TagPill tag={item.format} />
        <span>{item.usage_count} uses</span>
      </CardContent>
    </Card>
  );
}

export function ChangelogCard({ item }: { item: ChangelogEntry }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm"><Link href={`/changelog/${item.slug}`}>{item.title}</Link></CardTitle>
        <CardDescription>{item.summary}</CardDescription>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground">{item.category}</CardContent>
    </Card>
  );
}

export function DiscussionCard({ item }: { item: Discussion }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          {item.pinned ? <TagPill tag="pinned" /> : null}
          {item.locked ? <TagPill tag="locked" /> : null}
        </div>
        <CardTitle className="text-sm"><Link href={`/discussions/${item.slug}`}>{item.title}</Link></CardTitle>
        <CardDescription>{item.content}</CardDescription>
      </CardHeader>
      <CardContent className="flex gap-2 text-xs text-muted-foreground">
        <span>{item.replies_count} replies</span>
        <span>{item.views_count} views</span>
      </CardContent>
    </Card>
  );
}
