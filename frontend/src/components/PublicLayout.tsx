import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { navigate } from '../lib/simpleRouter';
import { BatchTubeLogo } from './BatchTubeLogo';

interface PublicLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function PublicLayout({ children, title }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-[#050505] text-app-text relative overflow-x-hidden">
      <div className="fixed inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-app-primary/10 rounded-full blur-[150px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/90 to-[#050505]" />
      </div>

      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-3 hover:opacity-90 transition-opacity"
          >
            <BatchTubeLogo size="md" />
          </button>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-sm font-medium text-app-muted hover:text-white transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              Back to Home
            </button>
            <button type="button" onClick={() => navigate('/login')} className="text-sm font-medium text-app-muted hover:text-white transition-colors">
              Sign In
            </button>
            <button type="button" onClick={() => navigate('/app')} className="text-sm font-medium bg-white text-black hover:bg-white/90 px-4 py-2 rounded-lg transition-all">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-32 pb-24 max-w-4xl mx-auto px-6">
        {title && (
          <div className="max-w-4xl mx-auto mb-8">
            <h1 className="text-2xl font-bold text-white">{title}</h1>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
