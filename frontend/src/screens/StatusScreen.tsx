import React from 'react';
import { Button } from '../components/Button';
import { ViewState } from '../types';

interface StatusScreenProps {
  onNavigate: (view: ViewState) => void;
}

const systems = [
  { name: 'API Gateway', status: 'Operational', uptime: '99.99%' },
  { name: 'Web Interface', status: 'Operational', uptime: '100%' },
  { name: 'Worker Pool', status: 'Operational', uptime: '99.8%' },
  { name: 'Object Storage', status: 'Operational', uptime: '100%' },
  { name: 'Authentication', status: 'Degraded', uptime: '98.5%' }
] as const;

export const StatusScreen: React.FC<StatusScreenProps> = ({ onNavigate }) => {
  return (
    <div className="w-full max-w-5xl mx-auto px-6 py-10 space-y-6 animate-in fade-in duration-500">
      <section className="glass-card rounded-2xl p-6 border border-emerald-500/30 bg-emerald-500/5">
        <h1 className="text-2xl font-bold text-white">Platform status</h1>
        <p className="text-emerald-400 mt-2 text-sm">All core systems operational</p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {systems.map((system) => (
          <div key={system.name} className="glass-card rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between">
              <p className="text-white font-medium">{system.name}</p>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${system.status === 'Operational' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 'text-yellow-300 border-yellow-500/30 bg-yellow-500/10'}`}>
                {system.status}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">Uptime: {system.uptime}</p>
          </div>
        ))}
      </section>

      <section className="glass-card rounded-2xl p-6 border border-white/10">
        <h2 className="text-white font-semibold">Recent incidents</h2>
        <div className="mt-3 space-y-2 text-sm text-gray-300">
          <p>Oct 22, 2026 - Increased latency on Instagram provider (resolved)</p>
          <p>Sep 15, 2026 - Scheduled maintenance completed</p>
          <p>Aug 04, 2026 - API timeout spike (resolved)</p>
        </div>
      </section>

      <Button variant="secondary" onClick={() => onNavigate('contact')}>Report an issue</Button>
    </div>
  );
};
