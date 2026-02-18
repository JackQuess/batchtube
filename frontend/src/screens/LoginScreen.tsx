import React, { useState } from 'react';
import { GlassInput } from '../components/GlassInput';
import { Button } from '../components/Button';
import { ViewState } from '../types';

interface LoginScreenProps {
  onNavigate: (view: ViewState) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate('dashboard');
  };

  return (
    <div className="w-full max-w-[460px] glass-card rounded-2xl p-8 sm:p-10 border border-white/10 animate-in fade-in zoom-in duration-300">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white tracking-tight">Sign in to BatchTube</h1>
        <p className="text-sm text-gray-400 mt-2">Continue to your queue, files, and account settings.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <GlassInput
          id="email"
          label="Email"
          icon="mail"
          type="email"
          placeholder="name@company.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div>
          <GlassInput id="password" label="Password" icon="lock" isPassword required placeholder="Your password" />
          <div className="mt-2 flex justify-end">
            <button type="button" onClick={() => onNavigate('forgot-password')} className="text-xs text-gray-500 hover:text-primary transition-colors">
              Forgot password?
            </button>
          </div>
        </div>

        <Button type="submit" fullWidth icon="login">Sign In</Button>

        <div className="relative flex items-center py-1">
          <div className="flex-1 border-t border-white/10" />
          <span className="px-3 text-xs text-gray-500">Or continue with</span>
          <div className="flex-1 border-t border-white/10" />
        </div>

        <Button type="button" variant="google" fullWidth>Continue with Google</Button>
      </form>

      <p className="text-sm text-gray-400 mt-7 text-center">
        New here?{' '}
        <button onClick={() => onNavigate('signup')} className="text-primary hover:text-red-400 font-medium transition-colors">
          Create account
        </button>
      </p>
    </div>
  );
};
