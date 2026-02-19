import React, { useState } from 'react';
import { GlassInput } from '../components/GlassInput';
import { Button } from '../components/Button';
import { Logo } from '../components/Logo';
import { ViewState } from '../types';
import { registerWithEmail } from '../lib/auth';

interface SignUpScreenProps {
  onNavigate: (view: ViewState) => void;
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalı.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await registerWithEmail(email, password);
      onNavigate('onboarding');
    } catch (err: any) {
      setError(err?.message || 'Kayıt başarısız.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[440px] glass-card rounded-2xl p-8 sm:p-10 transform transition-all animate-in fade-in zoom-in duration-300 border border-white/10 shadow-2xl shadow-black/50">
      <div className="mb-6 flex items-center justify-center gap-2">
        <Logo className="size-6" />
        <span className="text-lg font-semibold tracking-tight text-white">BatchTube</span>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Create your account</h1>
        <p className="text-gray-400 text-sm">Start your professional workflow today.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <GlassInput
          id="email"
          label="Email Address"
          icon="mail"
          type="email"
          placeholder="name@company.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <GlassInput
          id="password"
          label="Password"
          icon="lock"
          isPassword
          placeholder="Minimum 6 characters"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <GlassInput
          id="confirm-password"
          label="Confirm Password"
          icon="lock_reset"
          isPassword
          placeholder="Confirm your password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        {error && <p className="text-xs text-red-400">{error}</p>}

        <Button type="submit" fullWidth icon="arrow_forward" disabled={loading}>
          {loading ? 'Creating...' : 'Create Account'}
        </Button>
      </form>

      <div className="mt-8 text-center space-y-4">
        <p className="text-sm text-gray-400">
          Already have an account?{' '}
          <button onClick={() => onNavigate('login')} className="text-primary hover:text-red-400 font-medium transition-colors">
            Log in
          </button>
        </p>
        <p className="text-xs text-gray-600 leading-relaxed px-4">
          By clicking create account, you agree to our{' '}
          <button onClick={() => onNavigate('legal')} className="hover:text-gray-400 underline decoration-gray-700">
            Terms
          </button>{' '}
          and{' '}
          <button onClick={() => onNavigate('legal')} className="hover:text-gray-400 underline decoration-gray-700">
            Privacy Policy
          </button>
          .
        </p>
      </div>
    </div>
  );
};
