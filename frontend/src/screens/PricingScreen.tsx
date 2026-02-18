import React, { useState } from 'react';
import { Button } from '../components/Button';
import { ViewState, PricingPlan } from '../types';

interface PricingScreenProps {
  onNavigate: (view: ViewState) => void;
}

export const PricingScreen: React.FC<PricingScreenProps> = ({ onNavigate }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const plans: PricingPlan[] = [
    {
      name: 'Starter',
      price: 'Free',
      period: 'forever',
      description: 'For casual batch downloading.',
      features: [
        { text: 'Core Providers (YouTube, TikTok)', included: true },
        { text: 'Max 10 items per batch', included: true },
        { text: '2 Parallel Downloads', included: true },
        { text: 'Auto-ZIP Archiving', included: false },
        { text: 'No Daily Limits', included: false },
      ]
    },
    {
      name: 'Power User',
      price: billingCycle === 'monthly' ? '$12' : '$10',
      period: 'per month',
      description: 'Unlock all 30+ providers and speed.',
      highlight: true,
      features: [
        { text: 'All 30+ Providers', included: true },
        { text: 'Unlimited items per batch', included: true },
        { text: '10 Parallel Downloads', included: true },
        { text: 'One-Click ZIP', included: true },
        { text: 'Retry & Resume', included: true },
      ]
    },
    {
      name: 'Archivist',
      price: billingCycle === 'monthly' ? '$49' : '$39',
      period: 'per month',
      description: 'Massive throughput for data hoarders.',
      features: [
        { text: 'Everything in Power User', included: true },
        { text: 'Priority Queue (Skip the line)', included: true },
        { text: '50 Parallel Downloads', included: true },
        { text: 'API Access', included: true },
        { text: 'Dedicated Bandwidth', included: true },
      ]
    }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
          Simple pricing for <span className="text-primary">heavy downloading</span>.
        </h1>
        <p className="text-gray-400 text-lg">
          Choose the plan that fits your volume. Cancel anytime.
        </p>
        
        {/* Toggle */}
        <div className="flex items-center justify-center mt-8 gap-4">
          <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-white' : 'text-gray-500'}`}>Monthly</span>
          <button 
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
            className="w-14 h-8 bg-white/10 rounded-full relative transition-colors hover:bg-white/20"
          >
            <div className={`absolute top-1 w-6 h-6 bg-primary rounded-full shadow-lg transition-all duration-300 ${billingCycle === 'monthly' ? 'left-1' : 'left-7'}`}></div>
          </button>
          <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-white' : 'text-gray-500'}`}>Yearly <span className="text-emerald-400 text-xs ml-1 font-bold">-20%</span></span>
        </div>
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

            <Button 
              variant={plan.highlight ? 'primary' : 'secondary'} 
              fullWidth
              onClick={() => onNavigate('signup')}
            >
              {plan.price === 'Free' ? 'Get Started' : 'Start Trial'}
            </Button>

            <ul className="mt-8 space-y-4 flex-1">
              {plan.features.map((feature, fIdx) => (
                <li key={fIdx} className="flex items-start gap-3 text-sm">
                  <span className={`material-symbols-outlined text-[18px] ${feature.included ? 'text-emerald-400' : 'text-gray-700'}`}>
                    {feature.included ? 'check_circle' : 'cancel'}
                  </span>
                  <span className={feature.included ? 'text-gray-300' : 'text-gray-600'}>
                    {feature.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};