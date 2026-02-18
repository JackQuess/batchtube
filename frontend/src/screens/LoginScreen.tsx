import React, { useState } from 'react';
import { GlassInput } from '../components/GlassInput';
import { Button } from '../components/Button';
import { Logo } from '../components/Logo';
import { ViewState } from '../types';
import { supabaseAuth } from '../lib/supabaseClient';

interface LoginScreenProps {
  onNavigate: (view: ViewState) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      await supabaseAuth.signInWithPassword(email.trim(), password);
      onNavigate('dashboard');
    } catch (err: any) {
      setError(err?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      await supabaseAuth.sendMagicLink(email.trim(), `${window.location.origin}/login`);
      setInfo('Magic link sent. Check your inbox.');
    } catch (err: any) {
      setError(err?.message || 'Failed to send magic link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[440px] glass-card rounded-2xl p-8 sm:p-10 transform transition-all animate-in fade-in zoom-in duration-300">
      <div className="mb-6 flex items-center justify-center gap-2">
        <Logo className="size-6" />
        <span className="text-lg font-semibold tracking-tight text-white">BatchTube</span>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Welcome back</h1>
        <p className="text-gray-400 text-sm">Enter your credentials to access your workspace.</p>
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
        
        <div>
          <GlassInput 
            id="password"
            label="Password"
            icon="lock"
            isPassword
            placeholder="Enter your password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="flex justify-end mt-2">
            <button
              type="button"
              onClick={() => onNavigate('forgot-password')}
              className="text-xs text-gray-500 hover:text-primary transition-colors"
            >
              Forgot password?
            </button>
          </div>
        </div>

        {(error || info) && (
          <p className={`text-xs ${error ? 'text-red-400' : 'text-emerald-400'}`}>
            {error || info}
          </p>
        )}

        <Button type="submit" fullWidth icon="login" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-white/10"></div>
          <span className="flex-shrink-0 mx-4 text-gray-500 text-xs">Or continue with</span>
          <div className="flex-grow border-t border-white/10"></div>
        </div>

        <Button
          type="button"
          variant="secondary"
          fullWidth
          disabled={loading || !email.trim()}
          onClick={handleMagicLink}
        >
          Send Magic Link
        </Button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-400">
          Don't have an account?{' '}
          <button 
            onClick={() => onNavigate('signup')} 
            className="text-primary hover:text-red-400 font-medium transition-colors"
          >
            Create account
          </button>
        </p>
      </div>
    </div>
  );
};
