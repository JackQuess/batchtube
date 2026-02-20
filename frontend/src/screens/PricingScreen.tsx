import React from 'react';
import { Button } from '../components/Button';
import { ViewState, PricingPlan } from '../types';

interface PricingScreenProps {
  onNavigate: (view: ViewState) => void;
}

export const PricingScreen: React.FC<PricingScreenProps> = ({ onNavigate }) => {
  const plans: PricingPlan[] = [
    {
      name: 'Free',
      price: 'Free',
      period: 'monthly',
      description: 'Start with core workflows.',
      features: [
        { text: '100 monthly credits', included: true },
        { text: 'Max 10 links per batch', included: true },
        { text: 'Retention: 6 hours', included: true },
        { text: 'Priority processing', included: false },
        { text: 'API access (coming soon)', included: false }
      ]
    },
    {
      name: 'Pro',
      price: '$12',
      period: 'per month',
      description: 'For creators and teams with frequent runs.',
      highlight: true,
      features: [
        { text: '1000 monthly credits', included: true },
        { text: 'Max 50 links per batch', included: true },
        { text: 'Retention: 24 hours', included: true },
        { text: 'Priority processing', included: true },
        { text: 'API access (coming soon)', included: false }
      ]
    },
    {
      name: 'Studio',
      price: '$49',
      period: 'per month',
      description: 'High-volume archival and operations.',
      features: [
        { text: '5000 monthly credits', included: true },
        { text: 'Max 50 links per batch', included: true },
        { text: 'Retention: 7 days', included: true },
        { text: 'Higher queue priority', included: true },
        { text: 'API access (coming soon)', included: true }
      ]
    }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
          Plans based on <span className="text-primary">monthly credits</span>
        </h1>
        <p className="text-gray-400 text-lg">Each processed URL costs 1 credit. Choose the limit that matches your volume.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan, idx) => (
          <div
            key={idx}
            className={`glass-card rounded-2xl p-8 flex flex-col relative ${plan.highlight ? 'border-primary/50 shadow-2xl shadow-primary/10' : 'border-white/5'}`}
          >
            {plan.highlight && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Best Value
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-xl font-bold text-white">{plan.name}</h3>
              <p className="text-gray-400 text-sm mt-2 min-h-[40px]">{plan.description}</p>
            </div>

            <div className="mb-8">
              <span className="text-4xl font-bold text-white">{plan.price}</span>
              <span className="text-gray-500 text-sm ml-2">{plan.period}</span>
            </div>

            <Button variant={plan.highlight ? 'primary' : 'secondary'} fullWidth onClick={() => onNavigate('signup')}>
              {plan.price === 'Free' ? 'Get Started' : 'Upgrade'}
            </Button>

            <ul className="mt-8 space-y-4 flex-1">
              {plan.features.map((feature, fIdx) => (
                <li key={fIdx} className="flex items-start gap-3 text-sm">
                  <span className={`material-symbols-outlined text-[18px] ${feature.included ? 'text-emerald-400' : 'text-gray-700'}`}>
                    {feature.included ? 'check_circle' : 'cancel'}
                  </span>
                  <span className={feature.included ? 'text-gray-300' : 'text-gray-600'}>{feature.text}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};
