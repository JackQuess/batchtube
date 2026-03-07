import React, { useMemo, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { PROVIDER_CATALOG, type ProviderCategory, type ProviderEntry } from '../../providerCatalog';
import { getProviderIcon } from '../../lib/providerDisplay';

interface SupportedSitesModalProps {
  onClose: () => void;
}

const categoryLabels: Record<ProviderCategory, string> = {
  video: 'Video',
  social: 'Social',
  audio: 'Audio',
  other: 'Other',
  direct: 'Direct link'
};

function getIcon(entry: ProviderEntry) {
  return getProviderIcon(entry.id);
}

export function SupportedSitesModal({ onClose }: SupportedSitesModalProps) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | ProviderCategory>('all');

  const filtered = useMemo(() => {
    const lower = query.trim().toLowerCase();
    return PROVIDER_CATALOG.filter((provider) => {
      if (activeCategory !== 'all' && provider.category !== activeCategory) return false;
      if (!lower) return true;
      return provider.name.toLowerCase().includes(lower) || provider.id.toLowerCase().includes(lower);
    });
  }, [activeCategory, query]);

  return (
    <div className="flex flex-col h-full max-h-[70vh]">
      <div className="p-6 overflow-y-auto">
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${activeCategory === 'all' ? 'border-app-primary text-app-primary' : 'border-app-border text-app-muted hover:border-white/20'}`}
          >
            All
          </button>
          {(Object.keys(categoryLabels) as ProviderCategory[]).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${activeCategory === cat ? 'border-app-primary text-app-primary' : 'border-app-border text-app-muted hover:border-white/20'}`}
            >
              {categoryLabels[cat]}
            </button>
          ))}
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search platforms..."
          className="w-full rounded-xl border border-app-border bg-white/5 px-3 py-2 text-sm text-white placeholder:text-app-muted outline-none focus:border-app-primary mb-4"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((provider) => {
            const Icon = getIcon(provider);
            return (
              <div
                key={provider.id}
                className="flex items-center gap-4 p-4 rounded-xl border border-app-border bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-black/50 flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform shrink-0">
                  <Icon className="w-6 h-6 text-app-primary" />
                </div>
                <div className="flex-1 flex flex-col min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-white group-hover:text-app-primary transition-colors truncate">
                      {provider.name}
                    </span>
                    {provider.tier === 'free' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full border border-app-primary/50 text-app-primary shrink-0">
                        Pro
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-app-muted mt-1">{categoryLabels[provider.category]}</span>
                </div>
              </div>
            );
          })}
        </div>
        {filtered.length === 0 && (
          <p className="text-sm text-app-muted py-4">No platforms match your search.</p>
        )}
      </div>

      <div className="mt-auto border-t border-app-border bg-black/40 p-4 flex items-center justify-between">
        <span className="text-sm text-app-muted">{filtered.length} of {PROVIDER_CATALOG.length} supported</span>
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
          Close
        </button>
      </div>
    </div>
  );
}
