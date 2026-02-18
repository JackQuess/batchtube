import React from 'react';
import { Translations } from '../types';

interface PlansSectionProps {
  t: Translations;
}

const FREE_FEATURES = [
  '3 videos per batch',
  '720p max',
  'Ads enabled',
  'Limited daily usage',
  'Standard queue'
];

const PRO_FEATURES = [
  '50 videos per batch',
  '1080p+',
  'No ads',
  'Priority queue',
  'Faster ZIP processing',
  'Retry support'
];

export const PlansSection: React.FC<PlansSectionProps> = ({ t }) => {
  return (
    <section className="mt-8 sm:mt-10 md:mt-12 animate-fadeIn">
      <div className="text-center mb-4 sm:mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">{t.plansTitle}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <article className="relative rounded-2xl border border-white/10 bg-[#0b0b10] p-5 sm:p-6 shadow-2xl shadow-black/20">
          <h3 className="text-lg sm:text-xl font-bold text-white">{t.freePlan.toUpperCase()}</h3>
          <ul className="mt-4 space-y-2 text-sm text-neutral-300">
            {FREE_FEATURES.map((feature) => (
              <li key={feature} className="leading-relaxed">• {feature}</li>
            ))}
          </ul>
          <button
            type="button"
            className="mt-5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 transition-colors text-sm font-semibold"
          >
            {t.currentPlan}
          </button>
        </article>

        <article className="relative rounded-2xl border border-primary/40 bg-[#0b0b10] p-5 sm:p-6 shadow-2xl shadow-black/20">
          <div className="pointer-events-none absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/20 to-secondary/20 blur-xl" />
          <div className="relative">
            <h3 className="text-lg sm:text-xl font-bold text-white">{`${t.proPlan.toUpperCase()} ($9/mo)`}</h3>
            <ul className="mt-4 space-y-2 text-sm text-neutral-300">
              {PRO_FEATURES.map((feature) => (
                <li key={feature} className="leading-relaxed">• {feature}</li>
              ))}
            </ul>
            <button
              type="button"
              className="mt-5 px-4 py-2 rounded-full bg-primary hover:bg-red-600 transition-colors text-sm font-semibold text-white"
            >
              {t.upgradeNow}
            </button>
          </div>
        </article>
      </div>
    </section>
  );
};
