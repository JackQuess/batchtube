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
      <div className="w-full max-w-lg mx-auto glass-card p-10 rounded-2xl text-center animate-in fade-in zoom-in duration-300 my-20">
        <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
           <span className="material-symbols-outlined text-4xl">send</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Message Sent!</h2>
        <p className="text-gray-400 mb-8">
          Thank you for reaching out. Our support team typically responds within 24 hours.
        </p>
        <Button onClick={() => onNavigate('landing')} fullWidth>Back to Home</Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-white mb-4">Get in touch</h1>
        <p className="text-gray-400 max-w-xl mx-auto">
          Have a question about the service, pricing, or need enterprise support? We're here to help.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Contact Info */}
        <div className="space-y-8">
          <div className="glass-card p-6 rounded-xl border border-white/5">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-lg bg-primary/10 text-primary">
                <span className="material-symbols-outlined">mail</span>
              </div>
              <div>
                <h3 className="font-semibold text-white">Email Support</h3>
                <p className="text-sm text-gray-500">support@batchtube.app</p>
              </div>
            </div>
            <p className="text-sm text-gray-400">
              For general inquiries and technical support. We aim to reply within 24 hours.
            </p>
          </div>

          <div className="glass-card p-6 rounded-xl border border-white/5">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400">
                <span className="material-symbols-outlined">chat</span>
              </div>
              <div>
                <h3 className="font-semibold text-white">Live Chat</h3>
                <p className="text-sm text-gray-500">Available Mon-Fri</p>
              </div>
            </div>
            <p className="text-sm text-gray-400">
              Our agents are available from 9am to 5pm EST for real-time assistance.
            </p>
          </div>

          <div className="glass-card p-6 rounded-xl border border-white/5">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-lg bg-purple-500/10 text-purple-400">
                <span className="material-symbols-outlined">business_center</span>
              </div>
              <div>
                <h3 className="font-semibold text-white">Enterprise</h3>
                <p className="text-sm text-gray-500">Custom solutions</p>
              </div>
            </div>
            <p className="text-sm text-gray-400">
              Need API access with higher limits? Contact our sales team.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="glass-card p-8 rounded-2xl border border-white/5 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GlassInput label="First Name" placeholder="John" required />
              <GlassInput label="Last Name" placeholder="Doe" required />
            </div>
            
            <GlassInput label="Email Address" type="email" placeholder="john@company.com" required icon="email" />
            
            <div className="space-y-1.5">
              <label className="block text-xs font-medium uppercase tracking-wider text-gray-500">Subject</label>
              <select className="w-full bg-white/5 border border-white/10 rounded-lg text-white text-sm p-3 focus:border-primary focus:outline-none input-glass">
                <option className="bg-background-card">General Inquiry</option>
                <option className="bg-background-card">Billing Issue</option>
                <option className="bg-background-card">Technical Support</option>
                <option className="bg-background-card">Feature Request</option>
                <option className="bg-background-card">Enterprise Sales</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium uppercase tracking-wider text-gray-500">Message</label>
              <textarea 
                className="w-full bg-transparent border border-white/10 rounded-lg text-white text-sm p-4 focus:border-primary focus:outline-none input-glass min-h-[160px]"
                placeholder="How can we help you?"
                required
              ></textarea>
            </div>

            <Button type="submit" fullWidth icon="send">Send Message</Button>
          </form>
        </div>
      </div>
    </div>
  );
};