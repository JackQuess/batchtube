import React from 'react';
import { ViewState, FileItem } from '../types';
import { Button } from '../components/Button';

interface FilesScreenProps {
  onNavigate: (view: ViewState) => void;
}

const mockFiles: FileItem[] = [
  { id: '1', name: 'Nature_Doc_Clip_01.mp4', type: 'MP4', size: '1.2 GB', date: 'Oct 24, 2026', provider: 'YouTube', batchId: 'B-1023' },
  { id: '2', name: 'TikTok_Dance_Comp.zip', type: 'ZIP', size: '450 MB', date: 'Oct 24, 2026', provider: 'TikTok', batchId: 'B-1023' },
  { id: '3', name: 'Insta_Stories_Backup.zip', type: 'ZIP', size: '12 MB', date: 'Oct 23, 2026', provider: 'Instagram', batchId: 'B-1022' },
  { id: '4', name: 'Podcast_Audio_Track.mp3', type: 'MP3', size: '85 MB', date: 'Oct 22, 2026', provider: 'SoundCloud', batchId: 'B-1020' }
];

export const FilesScreen: React.FC<FilesScreenProps> = ({ onNavigate }) => {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Files</h1>
          <p className="text-sm text-gray-400 mt-1">Download and manage generated outputs.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="h-10 px-4">Cleanup</Button>
          <Button className="h-10 px-4" icon="download">Download Selected</Button>
        </div>
      </div>

      <section className="glass-card rounded-2xl border border-white/10 overflow-hidden">
        <div className="p-5 border-b border-white/10 bg-white/5 flex items-center justify-between">
          <h2 className="text-white font-semibold">Recent files</h2>
          <button onClick={() => onNavigate('history')} className="text-sm text-primary hover:text-red-400">Open history</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-3">Filename</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Size</th>
                <th className="px-5 py-3">Provider</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {mockFiles.map((file) => (
                <tr key={file.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-5 py-4 text-white font-medium">{file.name}</td>
                  <td className="px-5 py-4"><span className="px-2 py-1 rounded bg-white/10 text-xs text-gray-200">{file.type}</span></td>
                  <td className="px-5 py-4 text-gray-300">{file.size}</td>
                  <td className="px-5 py-4 text-gray-300">{file.provider}</td>
                  <td className="px-5 py-4 text-gray-400">{file.date}</td>
                  <td className="px-5 py-4 text-right">
                    <button className="text-primary hover:text-red-400 transition-colors">Download</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
