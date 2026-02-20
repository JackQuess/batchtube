import React, { useEffect, useMemo, useState } from 'react';
import { ViewState } from '../types';
import { Button } from '../components/Button';
import { batchAPI } from '../services/batchAPI';
import { listTrackedJobs } from '../lib/trackedJobs';

interface FilesScreenProps {
  onNavigate: (view: ViewState) => void;
}

interface FileRow {
  id: string;
  name: string;
  type: string;
  size: string;
  date: string;
  batchId: string;
}

export const FilesScreen: React.FC<FilesScreenProps> = () => {
  const [rows, setRows] = useState<FileRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFiles = async () => {
    const tracked = listTrackedJobs();
    const fileRows: FileRow[] = [];

    for (const job of tracked) {
      try {
        const status = await batchAPI.getStatus(job.jobId);
        if (status.state !== 'completed') continue;

        const bytes = status.result?.results?.reduce((sum, item) => sum + Number(item.bytes || 0), 0) || 0;

        fileRows.push({
          id: job.jobId,
          name: `${job.name}.zip`,
          type: 'ZIP',
          size: bytes > 0 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : '-',
          date: new Date(job.createdAt).toLocaleString(),
          batchId: job.jobId
        });
      } catch {
        // skip jobs that cannot be fetched
      }
    }

    setRows(fileRows);
    setLoading(false);
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const totalSize = useMemo(() => rows.length, [rows.length]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">File Manager</h1>
          <p className="text-gray-400 text-sm">Tamamlanan batch ZIP dosyalarını indir.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon="folder" onClick={loadFiles}>
            Refresh
          </Button>
        </div>
      </div>

      <p className="text-sm text-gray-500">{totalSize} dosya hazır.</p>

      <div className="glass-card rounded-xl overflow-hidden border border-white/5">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="bg-white/5 text-gray-200 uppercase text-xs font-medium border-b border-white/5">
            <tr>
              <th className="px-6 py-4">Filename</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Size</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td className="px-6 py-8 text-sm text-gray-500" colSpan={5}>
                  Dosyalar yükleniyor...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-6 py-8 text-sm text-gray-500" colSpan={5}>
                  Henüz indirilebilir dosya yok.
                </td>
              </tr>
            ) : (
              rows.map((file) => (
                <tr key={file.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-gray-500 text-[20px]">folder_zip</span>
                    {file.name}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 rounded bg-white/10 text-xs font-bold">{file.type}</span>
                  </td>
                  <td className="px-6 py-4 font-mono">{file.size}</td>
                  <td className="px-6 py-4">{file.date}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      className="text-primary hover:text-white transition-colors"
                      onClick={async () => {
                        try {
                          const url = await batchAPI.getSignedDownloadUrl(file.batchId);
                          window.open(url, '_blank', 'noopener,noreferrer');
                        } catch {
                          // ignored
                        }
                      }}
                    >
                      <span className="material-symbols-outlined text-[20px]">download</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
