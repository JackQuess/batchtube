import React from 'react';
import { Check } from 'lucide-react';

interface PricingModalProps {
  onClose: () => void;
}

const plans = [
  {
    name: 'Free',
    price: '$0',
    description: 'For casual users',
    features: ['100 credits monthly', 'Max 50 links per batch', 'Retention 6 hours', 'Standard queue'],
    buttonText: 'Current plan',
    buttonClass: 'bg-white/10 text-white cursor-default',
  },
  {
    name: 'Pro',
    price: '$9',
    period: '/mo',
    description: 'For power users',
    features: ['1000 credits monthly', 'Unlimited links per batch', 'Retention 24 hours', 'Priority queue'],
    buttonText: 'Upgrade to Pro',
    buttonClass: 'bg-app-primary hover:bg-app-primary-hover text-white shadow-[0_0_20px_rgba(225,29,72,0.3)]',
    popular: true,
  },
  {
    name: 'Studio',
    price: '$29',
    period: '/mo',
    description: 'For teams and automation',
    features: ['5000 credits monthly', 'Retention 7 days', 'Highest priority queue', 'API access', 'Webhooks'],
    buttonText: 'Upgrade to Studio',
    buttonClass: 'bg-white text-black hover:bg-white/90',
  },
];

export function PricingModal({ onClose }: PricingModalProps) {
  return (
    <div className="flex flex-col h-full max-h-[80vh]">
      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative flex flex-col p-6 rounded-2xl border ${plan.popular ? 'border-app-primary shadow-[0_0_30px_rgba(225,29,72,0.15)] bg-app-primary/5' : 'border-app-border bg-white/5'}`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-app-primary text-white text-[10px] font-bold uppercase tracking-wider py-1 px-3 rounded-full">
                Most Popular
              </div>
            )}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-white mb-1">{plan.name}</h3>
              <p className="text-sm text-app-muted">{plan.description}</p>
            </div>
            <div className="mb-6 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-white">{plan.price}</span>
              {plan.period && <span className="text-sm text-app-muted">{plan.period}</span>}
            </div>
            <div className="flex-1 flex flex-col gap-3 mb-8">
              {plan.features.map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-app-muted">{feature}</span>
                </div>
              ))}
            </div>
            <button className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${plan.buttonClass}`}>
              {plan.buttonText}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-auto border-t border-app-border bg-black/40 p-4 flex items-center justify-end">
        <button onClick={onClose} className="px-4 py-2 text-sm font-medium bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
          Close
        </button>
      </div>
    </div>
  );
}
