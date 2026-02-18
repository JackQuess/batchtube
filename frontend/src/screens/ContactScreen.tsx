import React, { useState } from 'react';
import { ViewState } from '../types';
import { Button } from '../components/Button';
import { GlassInput } from '../components/GlassInput';

interface ContactScreenProps {
  onNavigate: (view: ViewState) => void;
}

export const ContactScreen: React.FC<ContactScreenProps> = ({ onNavigate }) => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="w-full max-w-lg mx-auto glass-card p-10 rounded-2xl text-center animate-in fade-in zoom-in duration-300 my-20 border border-white/10">
        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-5">
          <span className="material-symbols-outlined">send</span>
        </div>
        <h2 className="text-2xl font-bold text-white">Message sent</h2>
        <p className="text-gray-400 mt-2 mb-6">Thanks for contacting us. We usually reply within 24 hours.</p>
        <Button onClick={() => onNavigate('landing')} fullWidth>Back to Home</Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-10 animate-in fade-in duration-500">
      <div className="max-w-2xl mb-10">
        <h1 className="text-4xl font-bold text-white tracking-tight">Contact</h1>
        <p className="text-gray-400 mt-3">For support, billing, or enterprise requests, send us a message.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="space-y-4">
          {[
            { title: 'Email', value: 'support@batchtube.app', icon: 'mail' },
            { title: 'Live chat', value: 'Mon-Fri 09:00-17:00', icon: 'chat' },
            { title: 'Enterprise', value: 'sales@batchtube.app', icon: 'business_center' }
          ].map((item) => (
            <div key={item.title} className="glass-card rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{item.title}</p>
                  <p className="text-gray-400 text-xs">{item.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="lg:col-span-2 glass-card rounded-2xl p-6 border border-white/10 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <GlassInput label="First Name" placeholder="John" required />
            <GlassInput label="Last Name" placeholder="Doe" required />
          </div>
          <GlassInput label="Email" type="email" icon="mail" placeholder="john@company.com" required />
          <div className="space-y-1.5">
            <label className="block text-xs font-medium uppercase tracking-wider text-gray-500">Message</label>
            <textarea className="input-glass w-full rounded-lg min-h-[150px] p-4 text-sm text-white placeholder:text-gray-600 focus:outline-none" placeholder="How can we help?" required />
          </div>
          <Button type="submit" fullWidth icon="send">Send Message</Button>
        </form>
      </div>
    </div>
  );
};
