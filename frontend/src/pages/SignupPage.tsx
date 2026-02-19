import React, { useState } from 'react';
import { AppLink, navigate } from '../lib/simpleRouter';
import { Translations } from '../types';
import { registerWithEmail } from '../lib/auth';

interface SignupPageProps {
  t: Translations;
  onAuthChanged: () => void;
  returnUrl?: string;
}

export const SignupPage: React.FC<SignupPageProps> = ({ t, onAuthChanged, returnUrl }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) {
      setError(t.acceptTermsLabel);
      return;
    }
    if (password !== confirmPassword) {
      setError(`${t.confirmPasswordLabel} ${t.error.toLowerCase()}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      registerWithEmail(email.trim(), password);
      onAuthChanged();
      navigate(returnUrl || '/account', { replace: true });
    } catch (err: any) {
      setError(err?.message || t.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto w-full px-4 sm:px-6">
      <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6 sm:p-8 shadow-2xl shadow-black/20">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t.signupTitle}</h1>
        <p className="mt-2 text-sm text-neutral-300">{t.signupSubtitle}</p>

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

          <label className="block">
            <span className="text-xs text-neutral-400">{t.confirmPasswordLabel}</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-primary"
            />
          </label>

          <label className="flex items-start gap-2 text-xs text-neutral-300">
            <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="mt-0.5" />
            <span>{t.acceptTermsLabel}</span>
          </label>

          {error && <div className="text-xs text-red-300">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-primary hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-60"
          >
            {loading ? t.preparing : t.createAccountButton}
          </button>
        </form>

        <div className="mt-5 text-xs text-neutral-400">
          {t.alreadyHaveAccount}{' '}
          <AppLink to="/login" className="text-primary hover:text-red-300 transition-colors">
            {t.login}
          </AppLink>
        </div>
      </div>
    </div>
  );
};
