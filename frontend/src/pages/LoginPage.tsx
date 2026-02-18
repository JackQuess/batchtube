import React, { useState } from 'react';
import { AppLink, navigate } from '../lib/simpleRouter';
import { Translations } from '../types';
import { supabaseAuth } from '../lib/supabaseClient';

interface LoginPageProps {
  t: Translations;
  returnUrl?: string;
  onAuthChanged: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ t, returnUrl, onAuthChanged }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const finishAuth = () => {
    onAuthChanged();
    navigate(returnUrl || '/account', { replace: true });
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      await supabaseAuth.signInWithPassword(email.trim(), password);
      finishAuth();
    } catch (err: any) {
      setError(err?.message || t.error);
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const redirectTo = `${window.location.origin}/login`;
      await supabaseAuth.sendMagicLink(email.trim(), redirectTo);
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
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t.loginTitle}</h1>
        <p className="mt-2 text-sm text-neutral-300">{t.loginSubtitle}</p>

        <form onSubmit={handlePasswordLogin} className="mt-6 space-y-4">
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

          <label className="block">
            <span className="text-xs text-neutral-400">{t.passwordLabel}</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            {loading ? t.preparing : t.continueButton}
          </button>

          <button
            type="button"
            disabled={loading || !email.trim()}
            onClick={handleMagicLink}
            className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-semibold transition-colors disabled:opacity-60"
          >
            {t.authContinueWithMagicLink}
          </button>
        </form>

        <div className="mt-4 text-xs text-neutral-400 flex items-center justify-between gap-3">
          <AppLink to="/forgot-password" className="text-primary hover:text-red-300 transition-colors">
            {t.forgotPassword}
          </AppLink>
          <div>
            {t.noAccountYet}{' '}
            <AppLink to="/signup" className="text-primary hover:text-red-300 transition-colors">
              {t.signup}
            </AppLink>
          </div>
        </div>
      </div>
    </div>
  );
};
