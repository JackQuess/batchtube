import React, { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { accountAPI } from '../../services/accountAPI';
import { LEMON_CHECKOUT_PRO, LEMON_CHECKOUT_ULTRA } from '../../constants';

interface PricingModalProps {
  onClose: () => void;
}

type LogicalPlan = 'free' | 'pro' | 'ultra';

const plans = [
  {
    name: 'Free',
    price: '$0',
    description: 'For casual users',
    features: [
      '100 videos monthly',
      'Max 20 links per batch',
      'Up to 1080p quality',
      'Standard queue',
      'No CLI or API',
      'No automation/webhooks',
      'No 4K processing'
    ]
  },
  {
    name: 'Pro',
    price: '$20',
    period: '/mo',
    description: 'For power users',
    features: [
      '1000 videos monthly',
      'Large batch downloads',
      'CLI access',
      'Channel archive',
      'Up to 1080p quality',
      'Faster queue',
      'No API or automation/webhooks',
      'No 4K processing'
    ],
    buttonClass: 'bg-app-primary hover:bg-app-primary-hover text-white shadow-[0_0_20px_rgba(225,29,72,0.3)]',
    popular: true,
  },
  {
    name: 'Ultra',
    price: '$60',
    period: '/mo',
    description: 'For teams and automation',
    features: [
      'Unlimited videos',
      'Full channel archive',
      '4K processing & advanced features',
      'API access',
      'Automation & webhooks',
      'Highest priority queue'
    ],
    buttonClass: 'bg-white text-black hover:bg-white/90',
  },
];

export function PricingModal({ onClose }: PricingModalProps) {
  const [plan, setPlan] = useState<LogicalPlan>('free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const usage = await accountAPI.getUsage();
        const logical = usage.plan_logical ?? (usage.plan === 'pro' ? 'pro' : usage.plan === 'free' ? 'free' : 'ultra');
        if (mounted) setPlan(logical);
      } catch {
        if (mounted) setPlan('free');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const openCheckout = (target: LogicalPlan) => {
    if (target === 'pro' && LEMON_CHECKOUT_PRO) {
      window.location.href = LEMON_CHECKOUT_PRO;
    } else if (target === 'ultra' && LEMON_CHECKOUT_ULTRA) {
      window.location.href = LEMON_CHECKOUT_ULTRA;
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[80vh]">
      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto">
        {plans.map((p) => {
          const logical: LogicalPlan = p.name === 'Free' ? 'free' : p.name === 'Pro' ? 'pro' : 'ultra';
          const isCurrent = plan === logical;
          const isUpgradable = !isCurrent && logical !== 'free';
          let buttonLabel = 'Select plan';
          if (logical === 'free') {
            buttonLabel = plan === 'free' ? 'Current plan' : 'Included';
          } else if (logical === 'pro') {
            buttonLabel = isCurrent ? 'Current plan' : 'Upgrade to Pro';
          } else if (logical === 'ultra') {
            buttonLabel = isCurrent ? 'Current plan' : 'Upgrade to Ultra';
          }

          const handleClick = () => {
            if (loading || isCurrent) return;
            if (logical === 'pro' || logical === 'ultra') openCheckout(logical);
          };

          const disabled = loading || logical === 'free' || isCurrent || (logical === 'pro' && !LEMON_CHECKOUT_PRO) || (logical === 'ultra' && !LEMON_CHECKOUT_ULTRA);

          return (
          <div
            key={p.name}
            className={`relative flex flex-col p-6 rounded-2xl border ${p.popular ? 'border-app-primary shadow-[0_0_30px_rgba(225,29,72,0.15)] bg-app-primary/5' : 'border-app-border bg-white/5'}`}
          >
            {p.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-app-primary text-white text-[10px] font-bold uppercase tracking-wider py-1 px-3 rounded-full">
                Most Popular
              </div>
            )}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-white mb-1">{p.name}</h3>
              <p className="text-sm text-app-muted">{p.description}</p>
            </div>
            <div className="mb-6 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-white">{p.price}</span>
              {p.period && <span className="text-sm text-app-muted">{p.period}</span>}
            </div>
            <div className="flex-1 flex flex-col gap-3 mb-8">
              {p.features.map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-app-muted">{feature}</span>
                </div>
              ))}
            </div>
            <button
              className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${p.buttonClass} ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
              onClick={handleClick}
              disabled={disabled}
            >
              {loading && logical === plan ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                </span>
              ) : (
                buttonLabel
              )}
            </button>
          </div>
        );})}
      </div>

      <div className="mt-auto border-t border-app-border bg-black/40 p-4 flex items-center justify-end">
        <button onClick={onClose} className="px-4 py-2 text-sm font-medium bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
          Close
        </button>
      </div>
    </div>
  );
}
