import React, { useEffect, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { batchesAPI } from '../../services/batchesAPI';
import { batchAPI } from '../../services/batchAPI';
import { filesAPI } from '../../services/filesAPI';
import { getProviderIcon, getProviderName } from '../../lib/providerDisplay';

interface FileRow {
  fileId: string;
  batchId: string;
  title: string;
  provider: string;
}

interface FilesModalProps {
  onClose: () => void;
}

export function FilesModal({ onClose }: FilesModalProps) {
  const [files, setFiles] = useState<FileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const { data: batches } = await batchesAPI.list({ status: 'completed', limit: 20 });
        const rows: FileRow[] = [];
        for (const batch of batches) {
          try {
            const status = await batchAPI.getStatus(batch.id);
            const results = status.result?.results ?? [];
            for (const r of results) {
              if (r.status === 'success' && r.file_id) {
                rows.push({
                  fileId: r.file_id,
                  batchId: batch.id,
                  title: status.result?.items?.find((i) => i.id === r.id)?.title ?? `Item ${r.id}`,
                  provider: r.provider ?? 'generic'
                });
              }
            }
          } catch {
            // skip batch
          }
        }
        if (mounted) setFiles(rows);
      } catch {
        if (mounted) setFiles([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const handleDownload = async (fileId: string) => {
    setDownloadingId(fileId);
    try {
      const url = await filesAPI.getDownloadUrl(fileId);
      window.open(url, '_blank');
    } finally {
      setDownloadingId(null);
    }
  };

  const IconComponent = getProviderIcon;

  return (
    <div className="flex flex-col h-full max-h-[70vh]">
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto">
        {loading && (
          <div className="col-span-full flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-app-primary animate-spin" />
          </div>
        )}
        {!loading && files.length === 0 && (
          <p className="col-span-full text-sm text-app-muted py-4">No files yet. Complete a batch to see downloads here.</p>
        )}
        {!loading && files.map((file) => {
          const Icon = IconComponent(file.provider);
          return (
          <div
            key={file.fileId}
            className="flex flex-col gap-3 p-4 rounded-xl border border-app-border bg-white/5 hover:bg-white/10 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-black/50 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-white truncate block">{file.title}</span>
                <span className="text-xs text-app-muted">{getProviderName(file.provider)}</span>
              </div>
            </div>
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => handleDownload(file.fileId)}
                disabled={downloadingId === file.fileId}
                className="p-2 rounded-lg bg-app-primary/20 hover:bg-app-primary/30 text-app-primary transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {downloadingId === file.fileId ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Download
              </button>
            </div>
          </div>
          );
        })}
      </div>

      <div className="mt-auto border-t border-app-border bg-black/40 p-4 flex items-center justify-between">
        <span className="text-sm text-app-muted">{files.length} files</span>
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
          Close
        </button>
      </div>
    </div>
  );
}
