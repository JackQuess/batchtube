import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, List, Search, Loader2, CheckSquare, Square } from 'lucide-react';
import { fetchSourceItems, type SourceItem } from '../lib/sourceItemsAdapter';

export interface SourceSelectionModalProps {
  sourceUrl: string;
  sourceType: 'channel' | 'playlist' | 'profile';
  provider: string;
  onDownloadSelected: (urls: string[]) => void;
  onAddToBatch: (urls: string[]) => void;
  onCancel: () => void;
}

export function SourceSelectionModal({
  sourceUrl,
  sourceType,
  provider,
  onDownloadSelected,
  onAddToBatch,
  onCancel
}: SourceSelectionModalProps) {
  const [items, setItems] = useState<SourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  useEffect(() => {
    let mounted = true;
    fetchSourceItems(sourceUrl, sourceType, { page: 1, limit: 100 })
      .then((res) => {
        if (mounted) setItems(res.data);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [sourceUrl, sourceType]);

  const filtered = search.trim()
    ? items.filter((i) => i.title.toLowerCase().includes(search.trim().toLowerCase()))
    : items;

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((i) => i.id)));
    }
  };

  const selectedUrls = items.filter((i) => selectedIds.has(i.id)).map((i) => i.url);

  const handleDownloadSelected = () => {
    if (selectedUrls.length > 0) {
      onDownloadSelected(selectedUrls);
    }
  };

  const handleAddToBatch = () => {
    if (selectedUrls.length > 0) {
      onAddToBatch(selectedUrls);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[80vh]">
      <div className="p-4 border-b border-app-border flex items-center justify-between gap-4">
        <h3 className="text-sm font-semibold text-white">
          Select items
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={selectAll}
            className="text-xs font-medium text-app-primary hover:text-app-primary-hover flex items-center gap-1"
          >
            {selectedIds.size === filtered.length ? (
              <CheckSquare className="w-4 h-4" />
            ) : (
              <Square className="w-4 h-4" />
            )}
            {selectedIds.size === filtered.length ? 'Clear all' : 'Select all'}
          </button>
        </div>
      </div>

      {items.length > 10 && (
        <div className="px-4 py-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-app-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-app-border text-sm text-white placeholder:text-app-muted"
            />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-app-primary animate-spin" />
          </div>
        )}
        {!loading && items.length === 0 && (
          <div className="rounded-xl border border-app-border bg-white/5 p-6 text-center">
            <p className="text-sm text-app-muted">
              Source listing is not available yet. Backend support for listing channel/playlist items is required.
            </p>
            <p className="text-xs text-app-muted mt-2">
              Use &quot;Download latest&quot; or &quot;Download all&quot; from the SmartBar instead.
            </p>
          </div>
        )}
        {!loading && items.length > 0 && filtered.length === 0 && (
          <p className="text-sm text-app-muted py-4">No items match your search.</p>
        )}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((item, index) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: index * 0.02 }}
                  onClick={() => toggle(item.id)}
                  className={`flex gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedIds.has(item.id)
                      ? 'border-app-primary bg-app-primary/10'
                      : 'border-app-border bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="w-20 h-12 rounded-lg bg-black/50 shrink-0 overflow-hidden flex items-center justify-center">
                    {item.thumbnail ? (
                      <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-white/5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <p className="text-sm font-medium text-white line-clamp-2">{item.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-app-muted">
                      {item.duration && <span>{item.duration}</span>}
                      {item.publishedAt && <span>{item.publishedAt}</span>}
                    </div>
                  </div>
                  <div className="shrink-0 self-center">
                    {selectedIds.has(item.id) ? (
                      <CheckSquare className="w-5 h-5 text-app-primary" />
                    ) : (
                      <Square className="w-5 h-5 text-app-muted" />
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="border-t border-app-border bg-black/40 p-4 flex items-center justify-between gap-4">
        <span className="text-sm text-app-muted">
          {selectedIds.size} selected
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-app-muted hover:text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDownloadSelected}
            disabled={selectedUrls.length === 0}
            className="px-4 py-2 text-sm font-medium bg-app-primary hover:bg-app-primary-hover text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Download selected
          </button>
          <button
            type="button"
            onClick={handleAddToBatch}
            disabled={selectedUrls.length === 0}
            className="px-4 py-2 text-sm font-medium bg-white/10 hover:bg-white/20 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
          >
            <List className="w-4 h-4" /> Add to batch
          </button>
        </div>
      </div>
    </div>
  );
}
