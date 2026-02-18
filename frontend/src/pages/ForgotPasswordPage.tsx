import React, { useState } from 'react';
import { AppLink } from '../lib/simpleRouter';
import { Translations } from '../types';
import { supabaseAuth } from '../lib/supabaseClient';

interface ForgotPasswordPageProps {
  t: Translations;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ t }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const redirectTo = `${window.location.origin}/login`;
      await supabaseAuth.sendPasswordReset(email.trim(), redirectTo);
      setInfo(t.authCheckEmail);
    } catch (err: any) {
      setError(err?.message || t.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto w-full px-4 sm:px-6">
      <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6 sm:p-8 shadow-2xl shadow-black/20">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t.forgotPasswordTitle}</h1>
        <p className="mt-2 text-sm text-neutral-300">{t.forgotPasswordSubtitle}</p>

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

          {error && <div className="text-xs text-red-300">{error}</div>}
          {info && <div className="text-xs text-emerald-300">{info}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-primary hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-60"
          >
            {loading ? t.preparing : t.sendResetLink}
          </button>
        </form>

        <div className="mt-5 text-xs text-neutral-400">
          <AppLink to="/login" className="text-primary hover:text-red-300 transition-colors">
            {t.login}
          </AppLink>
        </div>
      </div>
    </div>
  );
};
