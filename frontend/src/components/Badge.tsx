import React from 'react';
import { BatchJob, QueueItem } from '../types';

type BadgeStatus = BatchJob['status'] | QueueItem['status'];

export const Badge: React.FC<{ status: BadgeStatus }> = ({ status }) => {
  const styleMap: Record<BadgeStatus, string> = {
    processing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    downloading: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    failed: 'bg-red-500/10 text-red-400 border-red-500/20',
    queued: 'bg-gray-500/10 text-gray-400 border-gray-500/20'
  };

  const iconMap: Record<BadgeStatus, string> = {
    processing: 'sync',
    downloading: 'download',
    completed: 'check_circle',
    failed: 'error',
    queued: 'schedule'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${styleMap[status]}`}>
      <span className={`material-symbols-outlined text-[14px] ${status === 'processing' || status === 'downloading' ? 'animate-spin' : ''}`}>
        {iconMap[status]}
      </span>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};
