import React from 'react';
import { ViewState } from '../types';
import { Button } from '../components/Button';

interface StatusScreenProps {
  onNavigate: (view: ViewState) => void;
}

export const StatusScreen: React.FC<StatusScreenProps> = ({ onNavigate }) => {
  const systems = [
    { name: 'API Gateway', status: 'operational', uptime: '99.99%' },
    { name: 'Web Interface', status: 'operational', uptime: '100%' },
    { name: 'YouTube Worker Pool', status: 'operational', uptime: '99.8%' },
    { name: 'TikTok/Instagram Workers', status: 'degraded', uptime: '98.5%' },
    { name: 'Storage Systems (S3)', status: 'operational', uptime: '100%' },
    { name: 'Authentication', status: 'operational', uptime: '100%' },
  ];

  const incidents = [
    { date: 'Oct 22, 2026', title: 'Increased latency on TikTok downloads', status: 'Resolved' },
    { date: 'Sep 15, 2026', title: 'Scheduled Maintenance: Database Upgrade', status: 'Completed' },
    { date: 'Aug 04, 2026', title: 'API Gateway Timeout Issues', status: 'Resolved' },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Overall Status */}
      <div className="glass-card p-8 rounded-2xl border-l-4 border-emerald-500 mb-12 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">All Systems Operational</h1>
          <p className="text-gray-400">Last updated: Just now</p>
        </div>
        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 animate-pulse">
          <span className="material-symbols-outlined text-4xl">check_circle</span>
        </div>
      </div>

      {/* System Grid */}
      <h2 className="text-xl font-bold text-white mb-6">System Metrics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        {systems.map((sys, idx) => (
          <div key={idx} className="glass-card p-5 rounded-xl border border-white/5 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-white">{sys.name}</span>
              {sys.status === 'operational' ? (
                <span className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase border border-emerald-500/20">Operational</span>
              ) : (
                <span className="px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-xs font-bold uppercase border border-yellow-500/20">Degraded Perf</span>
              )}
            </div>
            
            {/* Fake Uptime Bars */}
            <div className="flex gap-1 h-8 items-end">
              {[...Array(30)].map((_, i) => (
                <div 
                  key={i} 
                  className={`flex-1 rounded-sm ${
                    sys.status === 'degraded' && i > 25 ? 'bg-yellow-500/50 h-3/4' : 'bg-emerald-500/40 h-full'
                  }`}
                ></div>
              ))}
            </div>
            
            <div className="flex justify-between text-xs text-gray-500">
              <span>90 days ago</span>
              <span className="text-white font-mono">{sys.uptime}</span>
              <span>Today</span>
            </div>
          </div>
        ))}
      </div>

      {/* Incidents */}
      <h2 className="text-xl font-bold text-white mb-6">Past Incidents</h2>
      <div className="space-y-4">
        {incidents.map((inc, idx) => (
          <div key={idx} className="glass-card p-6 rounded-xl border border-white/5">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                   <h3 className="font-bold text-white">{inc.title}</h3>
                   <p className="text-sm text-gray-400">{inc.date}</p>
                </div>
                <span className="px-3 py-1 rounded bg-white/5 text-gray-300 text-xs font-medium border border-white/10 w-fit">
                   {inc.status}
                </span>
             </div>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Button variant="secondary" onClick={() => onNavigate('contact')}>Report an Issue</Button>
      </div>
    </div>
  );
};