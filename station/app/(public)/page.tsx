import {
  BookOpen,
  Flag,
  ListChecks,
  MessageSquare,
  Newspaper,
  Radar,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { PageHeader } from '@/components/station/page-header';
import { SearchBar } from '@/components/station/search-bar';
import { SectionCard } from '@/components/station/section-card';
import { ChangelogCard, FeedbackCard, IncidentCard, IssueCard, ProviderStatusCard, TemplateCard } from '@/components/station/cards';
import { getHomeData } from '@/lib/data/queries';

const sections = [
  { href: '/docs', title: 'Docs', description: 'Guides, runbooks, and engineering notes.', icon: BookOpen },
  { href: '/feedback', title: 'Feedback', description: 'Vote and shape what ships next.', icon: Sparkles },
  { href: '/roadmap', title: 'Roadmap', description: 'Planned, in progress, and completed work.', icon: Radar },
  { href: '/templates', title: 'Templates', description: 'Battle-tested preset workflows.', icon: ListChecks },
  { href: '/status', title: 'Status', description: 'Provider health and incidents.', icon: ShieldCheck },
  { href: '/issues', title: 'Known Issues', description: 'Active and resolved issue registry.', icon: Flag },
  { href: '/discussions', title: 'Discussions', description: 'Community troubleshooting and ideas.', icon: MessageSquare },
  { href: '/changelog', title: 'Changelog', description: 'Transparent release notes and updates.', icon: Newspaper }
];

export default async function HomePage() {
  const data = await getHomeData();

  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-border bg-card/60 p-8">
        <PageHeader
          title="BatchTube Station"
          description="A public reliability and product intelligence hub for docs, roadmap, provider health, incidents, issues, templates, and community context."
        />
        <div className="mt-6 max-w-3xl">
          <SearchBar />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {sections.map((section) => (
          <SectionCard key={section.href} {...section} />
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Provider Snapshot</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {data.providers.map((item) => <ProviderStatusCard key={item.provider_key} item={item} />)}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Recent Incidents</h3>
          {data.incidents.map((item) => <IncidentCard key={item.id} item={item} />)}
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Popular Templates</h3>
          {data.templates.map((item) => <TemplateCard key={item.id} item={item} />)}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Top Feedback</h3>
          {data.feedback.map((item) => <FeedbackCard key={item.id} item={item} />)}
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Latest Changelog</h3>
          {data.changelog.map((item) => <ChangelogCard key={item.id} item={item} />)}
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Active Issues</h3>
          {data.issues.map((item) => <IssueCard key={item.id} item={item} />)}
        </div>
      </section>
    </div>
  );
}
