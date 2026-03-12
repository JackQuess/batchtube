import { FilterBar } from '@/components/station/filter-bar';
import { PageHeader } from '@/components/station/page-header';
import { TemplateCard } from '@/components/station/cards';
import { getTemplates } from '@/lib/data/queries';
import { getString } from '@/lib/utils/query';

export default async function TemplatesPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const provider = getString(searchParams.provider, 'all');
  const format = getString(searchParams.format, 'all');
  const sort = getString(searchParams.sort, 'popular');
  const q = getString(searchParams.q);
  const items = await getTemplates({ provider, format, sort, q });

  return (
    <div className="space-y-6">
      <PageHeader title="Templates" description="Preset workflows for fast and reliable downloads." />
      <FilterBar
        queryValue={q}
        selects={[
          { key: 'provider', value: provider, options: [{ label: 'All providers', value: 'all' }, { label: 'YouTube', value: 'youtube' }, { label: 'Instagram', value: 'instagram' }, { label: 'TikTok', value: 'tiktok' }, { label: 'Vimeo', value: 'vimeo' }, { label: 'Direct', value: 'generic' }] },
          { key: 'format', value: format, options: [{ label: 'All formats', value: 'all' }, { label: 'MP4', value: 'mp4' }, { label: 'MP3', value: 'mp3' }, { label: 'MKV', value: 'mkv' }] },
          { key: 'sort', value: sort, options: [{ label: 'Popular', value: 'popular' }, { label: 'Recent', value: 'recent' }] }
        ]}
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => <TemplateCard key={item.id} item={item} />)}
      </div>
    </div>
  );
}
