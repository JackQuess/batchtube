import React from 'react';
import { BatchJob } from '../types';

export const Badge: React.FC<{ status: BatchJob['status'] }> = ({ status }) => {
  const styles = {
    processing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    failed: 'bg-red-500/10 text-red-400 border-red-500/20',
    queued: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  };

  const icons = {
    processing: 'sync',
    completed: 'check',
    failed: 'error',
    queued: 'hourglass_empty'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
      <span className={`material-symbols-outlined text-[14px] ${status === 'processing' ? 'animate-spin' : ''}`}>
        {icons[status]}
      </span>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};