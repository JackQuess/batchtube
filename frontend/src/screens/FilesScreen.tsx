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
  { id: '4', name: 'Podcast_Audio_Track.mp3', type: 'MP3', size: '85 MB', date: 'Oct 22, 2026', provider: 'SoundCloud', batchId: 'B-1020' },
  { id: '5', name: 'Reference_Footage.mkv', type: 'MKV', size: '2.1 GB', date: 'Oct 20, 2026', provider: 'Vimeo', batchId: 'B-1019' },
];

export const FilesScreen: React.FC<FilesScreenProps> = ({ onNavigate }) => {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-white">File Manager</h1>
           <p className="text-gray-400 text-sm">Access and download your processed files.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="secondary" icon="delete_sweep" onClick={() => alert("Cleanup initiated: Removing old files...")}>Cleanup</Button>
           <Button icon="download" onClick={() => alert("Downloading selected files...")}>Download Selected</Button>
        </div>
      </div>

      <div className="glass-card rounded-xl overflow-hidden border border-white/5">
         <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-white/5 text-gray-200 uppercase text-xs font-medium border-b border-white/5">
               <tr>
                  <th className="px-6 py-4 w-10"><input type="checkbox" className="rounded border-gray-600 bg-transparent" /></th>
                  <th className="px-6 py-4">Filename</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Size</th>
                  <th className="px-6 py-4">Source</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Action</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
               {mockFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-white/5 transition-colors group">
                     <td className="px-6 py-4"><input type="checkbox" className="rounded border-gray-600 bg-transparent" /></td>
                     <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-gray-500 text-[20px]">
                           {file.type === 'ZIP' ? 'folder_zip' : file.type === 'MP3' ? 'audio_file' : 'movie'}
                        </span>
                        {file.name}
                     </td>
                     <td className="px-6 py-4"><span className="px-2 py-0.5 rounded bg-white/10 text-xs font-bold">{file.type}</span></td>
                     <td className="px-6 py-4 font-mono">{file.size}</td>
                     <td className="px-6 py-4">{file.provider}</td>
                     <td className="px-6 py-4">{file.date}</td>
                     <td className="px-6 py-4 text-right">
                        <button className="text-primary hover:text-white transition-colors" onClick={() => alert("Starting download for " + file.name)}>
                           <span className="material-symbols-outlined text-[20px]">download</span>
                        </button>
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>
    </div>
  );
};