import React, { useState } from 'react';
import { AppLink, navigate } from '../lib/simpleRouter';
import { Translations } from '../types';

interface LoginPageProps {
  t: Translations;
  onLogin: (email: string) => void;
  returnUrl?: string;
}

export const LoginPage: React.FC<LoginPageProps> = ({ t, onLogin, returnUrl }) => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = email.trim();
    if (!clean) return;
    onLogin(clean);
    navigate(returnUrl || '/account', { replace: true });
  };

  return (
    <div className="max-w-md mx-auto w-full px-4 sm:px-6">
      <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6 sm:p-8 shadow-2xl shadow-black/20">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t.loginTitle}</h1>
        <p className="mt-2 text-sm text-neutral-300">{t.loginSubtitle}</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-xs text-neutral-400">{t.emailLabel}</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-primary"
            />
          </label>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-primary hover:bg-red-600 text-white text-sm font-semibold transition-colors"
          >
            {t.continueButton}
          </button>
        </form>

        <div className="mt-5 text-xs text-neutral-400">
          {t.noAccountYet}{' '}
          <AppLink to="/signup" className="text-primary hover:text-red-300 transition-colors">
            {t.signup}
          </AppLink>
        </div>
      </div>
    </div>
  );
};
