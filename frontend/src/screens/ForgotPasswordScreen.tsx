import React, { useState } from 'react';
import { GlassInput } from '../components/GlassInput';
import { Button } from '../components/Button';
import { ViewState } from '../types';

interface ForgotPasswordScreenProps {
  onNavigate: (view: ViewState) => void;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  if (sent) {
    return (
      <div className="w-full max-w-[460px] glass-card rounded-2xl p-8 sm:p-10 border border-white/10 text-center animate-in fade-in duration-300">
        <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined">mark_email_read</span>
        </div>
        <h1 className="mt-5 text-2xl font-bold text-white">Reset link sent</h1>
        <p className="mt-2 text-sm text-gray-400">We sent password reset instructions to <span className="text-white">{email}</span>.</p>
        <Button className="mt-6" variant="secondary" fullWidth onClick={() => onNavigate('login')}>Back to Login</Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[460px] glass-card rounded-2xl p-8 sm:p-10 border border-white/10 animate-in fade-in duration-300">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white tracking-tight">Forgot password</h1>
        <p className="text-sm text-gray-400 mt-2">Enter your account email and we will send a secure reset link.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <GlassInput
          id="reset-email"
          label="Email"
          icon="mail"
          type="email"
          placeholder="name@company.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Button type="submit" fullWidth icon="send">Send reset link</Button>
      </form>

      <button onClick={() => onNavigate('login')} className="mt-7 text-sm text-gray-500 hover:text-white transition-colors inline-flex items-center gap-1.5">
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Back to Login
      </button>
    </div>
  );
};
