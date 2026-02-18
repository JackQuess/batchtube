import React, { useState } from 'react';
import { Button } from '../components/Button';
import { ViewState } from '../types';

interface PricingScreenProps {
  onNavigate: (view: ViewState) => void;
}

const rows = [
  { label: 'Supported providers', free: 'Core set (YouTube, TikTok, X)', pro: 'All 30+ providers' },
  { label: 'Videos per batch', free: 'Up to 10', pro: 'Unlimited' },
  { label: 'Max quality', free: 'Up to 720p', pro: '1080p / 4K where available' },
  { label: 'Parallel downloads', free: '2 workers', pro: '10 workers' },
  { label: 'ZIP processing', free: 'Standard', pro: 'Priority speed' },
  { label: 'Retry support', free: 'Basic', pro: 'Advanced retries' },
  { label: 'Daily limits', free: 'Limited', pro: 'Higher limits' }
];

export const PricingScreen: React.FC<PricingScreenProps> = ({ onNavigate }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-10 md:py-14 animate-in fade-in duration-500">
      <section className="text-center max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
          Choose your <span className="text-primary">BatchTube plan</span>
        </h1>
        <p className="text-gray-400 mt-4 text-base md:text-lg">
          Built for creators, teams, and archivists that process media at scale.
        </p>

        <div className="mt-7 inline-flex items-center rounded-full border border-white/10 bg-white/5 p-1">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-colors ${billingCycle === 'monthly' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-colors ${billingCycle === 'yearly' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Yearly (save 20%)
          </button>
        </div>
      </section>

      <section className="mt-10 glass-card rounded-2xl border border-white/10 overflow-hidden">
        <div className="grid grid-cols-3 border-b border-white/10 bg-white/5">
          <div className="p-4 text-xs uppercase tracking-wider text-gray-500 font-semibold">Feature</div>
          <div className="p-4 text-center text-sm font-semibold text-gray-300">Free</div>
          <div className="p-4 text-center text-sm font-semibold text-primary">Pro</div>
        </div>

        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-3 border-b border-white/5 last:border-b-0">
            <div className="p-4 text-sm text-gray-200">{row.label}</div>
            <div className="p-4 text-sm text-center text-gray-400">{row.free}</div>
            <div className="p-4 text-sm text-center text-white">{row.pro}</div>
          </div>
        ))}
      </section>

      <section className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="glass-card rounded-2xl p-6 border border-white/10">
          <h3 className="text-white text-xl font-semibold">Free</h3>
          <p className="text-3xl font-bold text-white mt-2">$0</p>
          <p className="text-gray-500 text-sm mt-1">Great for trying the workflow.</p>
          <Button className="mt-6" fullWidth variant="secondary" onClick={() => onNavigate('signup')}>
            Get Started
          </Button>
        </div>

        <div className="glass-card rounded-2xl p-6 border border-primary/40 shadow-2xl shadow-primary/10">
          <h3 className="text-white text-xl font-semibold">Pro</h3>
          <p className="text-3xl font-bold text-white mt-2">{billingCycle === 'monthly' ? '$12' : '$10'}<span className="text-base text-gray-500"> / month</span></p>
          <p className="text-gray-400 text-sm mt-1">Priority queue, full providers, and faster delivery.</p>
          <Button className="mt-6" fullWidth onClick={() => onNavigate('signup')} icon="rocket_launch">
            Start Pro Trial
          </Button>
        </div>
      </section>

      <section className="mt-8 glass-card rounded-2xl p-5 border border-white/10">
        <p className="text-xs uppercase tracking-wide text-gray-500 mb-3">Get started in 4 steps</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {['Create account', 'Paste links', 'Select format', 'Download ZIP'].map((step, index) => (
            <div key={step} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-primary text-xs font-bold">Step {index + 1}</p>
              <p className="text-sm text-white mt-1">{step}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
