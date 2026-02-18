import React, { useState } from 'react';
import { GlassInput } from '../components/GlassInput';
import { Button } from '../components/Button';
import { ViewState } from '../types';

interface SignUpScreenProps {
  onNavigate: (view: ViewState) => void;
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || password !== confirmPassword) return;
    setTimeout(() => onNavigate('onboarding'), 300);
  };

  return (
    <div className="w-full max-w-[460px] glass-card rounded-2xl p-8 sm:p-10 border border-white/10 animate-in fade-in zoom-in duration-300">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white tracking-tight">Create your workspace</h1>
        <p className="text-sm text-gray-400 mt-2">Set up your account and start your first batch in minutes.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <GlassInput
          id="signup-email"
          label="Email"
          icon="mail"
          type="email"
          placeholder="name@company.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <GlassInput
          id="signup-password"
          label="Password"
          icon="lock"
          isPassword
          placeholder="Minimum 8 characters"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <GlassInput
          id="signup-confirm"
          label="Confirm Password"
          icon="lock_reset"
          isPassword
          placeholder="Confirm your password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <Button type="submit" fullWidth icon="arrow_forward">Create Account</Button>

        <div className="relative flex items-center py-1">
          <div className="flex-1 border-t border-white/10" />
          <span className="px-3 text-xs text-gray-500">Or continue with</span>
          <div className="flex-1 border-t border-white/10" />
        </div>

        <Button type="button" variant="google" fullWidth>Continue with Google</Button>
      </form>

      <div className="mt-7 text-center space-y-3">
        <p className="text-sm text-gray-400">
          Already have an account?{' '}
          <button onClick={() => onNavigate('login')} className="text-primary hover:text-red-400 font-medium transition-colors">
            Sign in
          </button>
        </p>
        <p className="text-xs text-gray-600">
          By continuing you agree to Terms and Privacy Policy.
        </p>
      </div>
    </div>
  );
};
