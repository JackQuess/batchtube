import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Github } from 'lucide-react';
import { BatchTubeLogo } from './BatchTubeLogo';
import { loginWithGitHub } from '../lib/auth';
import { hasSupabaseConfig } from '../lib/supabaseClient';

interface AuthScreenProps {
  onLogin: () => void;
  onNavigateToLanding?: () => void;
  onNavigateToSignUp?: () => void;
  onNavigateToForgot?: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  isLoading?: boolean;
  error: string | null;
  clearError: () => void;
}

export function AuthScreen({
  onLogin,
  onNavigateToLanding,
  onNavigateToSignUp,
  onNavigateToForgot,
  signIn,
  signUp,
  isLoading = false,
  error,
  clearError,
}: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubError, setGithubError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setGithubError(null);
    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      onLogin();
    } catch (err) {
      // Error is passed from parent and displayed below
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative z-10 p-6">
      {/* Background: grid + glow */}
      <div
        className="absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.08, 0.14, 0.08],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-app-primary rounded-full blur-[120px] pointer-events-none"
      />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[420px] rounded-3xl border border-white/10 bg-[#0c0c0c]/95 backdrop-blur-2xl shadow-2xl shadow-black/40 p-8 sm:p-10 flex flex-col gap-8 relative overflow-hidden"
      >
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-app-primary/5 to-transparent pointer-events-none" />

        <div className="flex flex-col items-center gap-5 relative">
          {onNavigateToLanding && (
            <button
              type="button"
              onClick={onNavigateToLanding}
              className="absolute -top-1 left-0 text-xs text-app-muted hover:text-white transition-colors flex items-center gap-1.5"
            >
              ← Back
            </button>
          )}
          <div className="flex items-center justify-center gap-3">
            <BatchTubeLogo size="lg" textClassName="text-xl" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold tracking-tight text-white mb-1">Welcome to BatchTube</h1>
            <p className="text-sm text-app-muted">The fastest way to download content</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 relative">
          {(error || githubError) && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
              {error || githubError}
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-app-muted uppercase tracking-widest ml-1">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-app-primary/60 focus:ring-1 focus:ring-app-primary/30 transition-colors text-white placeholder-app-muted/50"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-app-muted uppercase tracking-widest ml-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-app-primary/60 focus:ring-1 focus:ring-app-primary/30 transition-colors text-white placeholder-app-muted/50"
            />
          </div>
          {onNavigateToForgot && isLogin && (
            <button
              type="button"
              onClick={onNavigateToForgot}
              className="text-xs text-app-muted hover:text-app-primary transition-colors text-left -mt-0.5"
            >
              Forgot password?
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-white text-black hover:bg-white/95 font-semibold rounded-xl py-3.5 text-sm transition-all hover:shadow-[0_0_24px_rgba(255,255,255,0.25)] flex items-center justify-center gap-2 group disabled:opacity-50 mt-1"
          >
            {isLoading ? 'Please wait...' : isLogin ? 'Sign in' : 'Create account'}
            <ArrowRight className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
          </button>
        </form>

        <div className="relative flex items-center py-1">
          <div className="flex-grow border-t border-white/10" />
          <span className="flex-shrink-0 mx-4 text-[11px] text-app-muted uppercase tracking-widest">Or</span>
          <div className="flex-grow border-t border-white/10" />
        </div>

        <button
          type="button"
          onClick={async () => {
            if (hasSupabaseConfig) {
              setGithubLoading(true);
              clearError();
              setGithubError(null);
              try {
                await loginWithGitHub();
                // redirect to GitHub happens; no need to navigate
              } catch (e: any) {
                setGithubError(e?.message ?? 'GitHub ile giriş başarısız.');
              } finally {
                setGithubLoading(false);
              }
            } else {
              onLogin();
            }
          }}
          disabled={githubLoading}
          className="w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/15 text-white font-medium rounded-xl py-3.5 text-sm transition-all flex items-center justify-center gap-2.5 disabled:opacity-60"
        >
          <Github className="w-4 h-4 shrink-0" />
          {hasSupabaseConfig ? (githubLoading ? 'Redirecting to GitHub…' : 'Continue with GitHub') : 'Continue with GitHub (demo)'}
        </button>

        <div className="flex flex-col gap-2 relative">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              clearError();
              setGithubError(null);
              if (!isLogin && onNavigateToSignUp) onNavigateToSignUp();
            }}
            className="w-full text-app-muted hover:text-white text-sm transition-colors py-1"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
          {onNavigateToLanding && (
            <button
              type="button"
              onClick={onNavigateToLanding}
              className="w-full text-app-muted/80 hover:text-app-muted text-xs transition-colors py-0.5"
            >
              ← Ana sayfaya dön
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
