import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Play, Command, Zap, ArrowRight, Video, List, Code2, Cpu, Sparkles, Terminal, ChevronRight, Youtube, Instagram, Twitter } from 'lucide-react';
import { BatchTubeLogo } from '../components/BatchTubeLogo';
import { API_BASE_URL } from '../config/api';

export interface LandingPageProps {
  onNavigateToLogin?: () => void;
  onNavigateToSignUp?: () => void;
  onNavigateToApp?: () => void;
  onNavigate?: (path: string) => void;
}

const TypewriterText = ({ text, delay = 0 }: { text: string; delay?: number }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let i = 0;
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setDisplayedText(text.substring(0, i + 1));
        i++;
        if (i === text.length) clearInterval(interval);
      }, 50);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timer);
  }, [text, delay]);

  return <span>{displayedText}<span className="animate-pulse">|</span></span>;
};

const NPM_CMD = 'npm install @batchtube/cli';

function CliComingSoon() {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const copy = async () => {
    setFailed(false);
    try {
      await navigator.clipboard.writeText(NPM_CMD);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setFailed(true);
      setTimeout(() => setFailed(false), 2000);
    }
  };
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium mb-1">
        CLI coming soon
      </div>
      <button
        type="button"
        onClick={copy}
        className="flex items-center gap-3 text-sm text-app-muted px-6 py-4 rounded-xl glass-panel border border-white/5 bg-white/5 backdrop-blur-md hover:border-white/10 hover:text-white transition-colors w-full sm:w-auto justify-center"
      >
        <Command className="w-4 h-4 shrink-0" />
        <span className="font-mono">{NPM_CMD}</span>
        {copied && <span className="text-xs text-green-400">Copied!</span>}
        {failed && <span className="text-xs text-amber-400">Copy failed</span>}
      </button>
      <p className="text-xs text-app-muted">Package not published yet — use the web app or API for now.</p>
    </div>
  );
}

export function LandingPage({ onNavigateToLogin, onNavigateToSignUp, onNavigateToApp, onNavigate }: LandingPageProps) {
  const goToAuth = () => onNavigateToLogin?.();
  const goToApp = () => onNavigateToApp?.();
  const go = (path: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    onNavigate?.(path);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-app-text relative overflow-x-hidden selection:bg-app-primary/30">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[#050505]" />
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-app-primary/20 rounded-full blur-[150px] mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-900/20 rounded-full blur-[150px] mix-blend-screen animate-pulse" style={{ animationDuration: '12s' }} />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wNSkiLz48L3N2Zz4=')] opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/80 to-[#050505]" />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={onNavigate ? () => onNavigate('/') : undefined}
            onKeyDown={onNavigate ? (e) => e.key === 'Enter' && onNavigate('/') : undefined}
            role={onNavigate ? 'button' : undefined}
            tabIndex={onNavigate ? 0 : undefined}
          >
            <BatchTubeLogo size="md" />
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-app-muted">
              {onNavigate ? (
                <a href="/features" onClick={go('/features')} className="hover:text-white transition-colors">Features</a>
              ) : (
                <a href="#features" className="hover:text-white transition-colors">Features</a>
              )}
              {onNavigate ? (
                <a href="/api-docs" onClick={go('/api-docs')} className="hover:text-white transition-colors">API</a>
              ) : (
                <a href="#api" className="hover:text-white transition-colors">API</a>
              )}
              {onNavigate ? (
                <a href="/pricing" onClick={go('/pricing')} className="hover:text-white transition-colors">Pricing</a>
              ) : (
                <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
              )}
            </div>
            <div className="h-4 w-px bg-white/10 hidden md:block" />
            <button
              type="button"
              onClick={goToAuth}
              className="text-sm font-medium text-app-muted hover:text-white transition-colors"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={goToApp}
              className="text-sm font-medium bg-white text-black hover:bg-white/90 px-4 py-2 rounded-lg transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-32 pb-24">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 flex flex-col items-center text-center pt-12 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-app-primary/10 border border-app-primary/20 text-app-primary text-xs font-medium mb-8 backdrop-blur-md"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>BatchTube 2.0 is now live</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold text-white tracking-tighter leading-[1.1] max-w-5xl mb-6"
          >
            Command your media <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-app-primary via-red-500 to-orange-500">
              at lightspeed.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-app-muted max-w-2xl mb-10 leading-relaxed font-light"
          >
            Not a dashboard. A powerful, command-driven engine that understands links, detects providers, and automates downloads instantly.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
          >
            <button
              type="button"
              onClick={goToApp}
              className="w-full sm:w-auto bg-white text-black hover:bg-white/90 px-8 py-4 rounded-xl font-semibold text-base transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] flex items-center justify-center gap-2 group"
            >
              Start Processing
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <CliComingSoon />
          </motion.div>

          {/* Interactive Hero Visual */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="w-full max-w-4xl mt-20 relative perspective-1000"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-app-primary/40 via-red-500/20 to-transparent rounded-3xl blur-2xl opacity-50" />

            <div className="relative glass-panel rounded-2xl border border-white/10 shadow-2xl bg-[#0A0A0A]/80 backdrop-blur-2xl overflow-hidden transform rotate-x-12 scale-100 hover:scale-[1.02] transition-transform duration-500">
              {/* Fake Window Header */}
              <div className="h-10 border-b border-white/5 flex items-center px-4 gap-2 bg-white/[0.02]">
                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/50" />
                <div className="ml-4 text-xs font-mono text-app-muted/50 flex items-center gap-2">
                  <Terminal className="w-3 h-3" /> batchtube-core
                </div>
              </div>

              {/* Fake SmartBar */}
              <div className="p-6">
                <div className="flex items-center gap-4 bg-black/50 border border-white/10 rounded-xl p-4 shadow-inner">
                  <Command className="w-5 h-5 text-app-primary" />
                  <span className="text-lg font-mono text-white">
                    <TypewriterText text="archive youtube.com/@fireship" delay={1000} />
                  </span>
                </div>

                {/* Fake Detection Result */}
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ delay: 3.5, duration: 0.5 }}
                  className="mt-4 border border-white/5 rounded-xl bg-white/[0.02] overflow-hidden"
                >
                  <div className="p-4 flex items-center gap-4 border-b border-white/5">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                      FS
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Channel detected</h3>
                      <p className="text-sm text-app-muted">Ready to archive</p>
                    </div>
                    <div className="ml-auto flex gap-2">
                      <div className="px-3 py-1.5 rounded-lg bg-app-primary/20 text-app-primary text-xs font-medium animate-pulse">Archiving...</div>
                    </div>
                  </div>
                  <div className="p-4 flex gap-2">
                    <div className="h-1.5 flex-1 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: '0%' }}
                        animate={{ width: '45%' }}
                        transition={{ delay: 4, duration: 2, ease: 'linear' }}
                        className="h-full bg-app-primary rounded-full shadow-[0_0_10px_rgba(165,0,52,0.5)]"
                      />
                    </div>
                    <span className="text-xs font-mono text-app-muted w-12 text-right">45%</span>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Logo Cloud */}
        <section className="py-10 border-y border-white/5 bg-white/[0.02] overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 flex flex-col items-center">
            <p className="text-xs font-semibold text-app-muted uppercase tracking-widest mb-6">Supported Platforms</p>
            <div className="flex items-center justify-center gap-8 md:gap-16 flex-wrap opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
              <div className="flex items-center gap-2"><Youtube className="w-6 h-6" /><span className="font-bold text-lg tracking-tighter">YouTube</span></div>
              <div className="flex items-center gap-2"><Video className="w-6 h-6" /><span className="font-bold text-lg tracking-tighter">TikTok</span></div>
              <div className="flex items-center gap-2"><Instagram className="w-6 h-6" /><span className="font-bold text-lg tracking-tighter">Instagram</span></div>
              <div className="flex items-center gap-2"><Twitter className="w-6 h-6" /><span className="font-bold text-lg tracking-tighter">X (Twitter)</span></div>
              <div className="flex items-center gap-2"><Video className="w-6 h-6" /><span className="font-bold text-lg tracking-tighter">Vimeo</span></div>
            </div>
          </div>
        </section>

        {/* Bento Grid Features */}
        <section id="features" className="max-w-7xl mx-auto px-6 py-32">
          <div className="mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-4">Built for speed.<br />Designed for power.</h2>
            <p className="text-app-muted text-lg max-w-xl">Everything you need to manage massive media downloads, packed into a frictionless, keyboard-first interface.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
            {/* Feature 1: Large */}
            <div className="md:col-span-2 glass-panel rounded-3xl p-8 border border-white/5 relative overflow-hidden group hover:border-app-primary/30 transition-colors">
              <div className="absolute top-0 right-0 w-64 h-64 bg-app-primary/10 rounded-full blur-[80px] group-hover:bg-app-primary/20 transition-colors" />
              <div className="relative z-10 h-full flex flex-col">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-auto border border-white/10">
                  <Cpu className="w-6 h-6 text-app-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Smart Context Engine</h3>
                  <p className="text-app-muted max-w-md">Paste a single video, a comma-separated list, or an entire channel URL. The SmartBar instantly adapts its UI to give you the right tools for the job.</p>
                </div>
              </div>
            </div>

            {/* Feature 2: Small */}
            <div className="glass-panel rounded-3xl p-8 border border-white/5 relative overflow-hidden group hover:border-white/10 transition-colors">
              <div className="relative z-10 h-full flex flex-col">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-auto border border-white/10">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Zero Latency</h3>
                  <p className="text-app-muted text-sm">Built on a custom Rust backend to ensure downloads start the millisecond you hit enter.</p>
                </div>
              </div>
            </div>

            {/* Feature 3: Small */}
            <div className="glass-panel rounded-3xl p-8 border border-white/5 relative overflow-hidden group hover:border-white/10 transition-colors">
              <div className="relative z-10 h-full flex flex-col">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-auto border border-white/10">
                  <List className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Infinite Batching</h3>
                  <p className="text-app-muted text-sm">Queue up 10 or 10,000 links. Our distributed workers handle the load automatically.</p>
                </div>
              </div>
            </div>

            {/* Feature 4: Medium/Wide API */}
            <div id="api" className="md:col-span-2 glass-panel rounded-3xl p-0 border border-white/5 relative overflow-hidden group hover:border-white/10 transition-colors flex flex-col md:flex-row">
              <div className="p-8 flex flex-col justify-center flex-1 z-10">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                  <Code2 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Developer First API</h3>
                <p className="text-app-muted">Integrate BatchTube into your own apps with our REST API and real-time Webhooks. Full documentation available.</p>
              </div>
              <div className="flex-1 bg-[#0A0A0A] border-l border-white/5 p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-app-primary/5 pointer-events-none" />
                <pre className="text-xs font-mono text-app-muted/80 leading-relaxed">
                  <code className="text-pink-400">const</code> response = <code className="text-pink-400">await</code> fetch(<code className="text-green-400">&apos;{API_BASE_URL.replace(/\/+$/, '')}/v1/batch&apos;</code>, {'{\n'}
                  {'  '}method: <code className="text-green-400">&apos;POST&apos;</code>,{'\n'}
                  {'  '}headers: {'{\n'}
                  {'    '}<code className="text-green-400">&apos;Authorization&apos;</code>: <code className="text-green-400">&apos;Bearer sk_live_...&apos;</code>{'\n'}
                  {'  }'},{'\n'}
                  {'  '}body: JSON.stringify({'{\n'}
                  {'    '}urls: [<code className="text-green-400">&apos;youtube.com/@mrbeast&apos;</code>],{'\n'}
                  {'    '}extractAudio: <code className="text-orange-400">true</code>{'\n'}
                  {'  }'}){'\n'}
                  {'}'});
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="pricing" className="max-w-4xl mx-auto px-6 py-24 text-center">
          <div className="glass-panel rounded-3xl p-12 border border-white/10 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-app-primary/20 to-transparent opacity-50" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-6">Ready to upgrade your workflow?</h2>
              <p className="text-app-muted text-lg mb-8 max-w-xl mx-auto">Join thousands of creators and developers who use BatchTube to automate their media pipelines.</p>
              <button
                type="button"
                onClick={goToApp}
                className="bg-white text-black hover:bg-white/90 px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] inline-flex items-center gap-2"
              >
                Get Started for Free
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 bg-[#050505] pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div
                className="flex items-center gap-2 mb-4 cursor-pointer"
                onClick={onNavigate ? () => onNavigate('/') : undefined}
                onKeyDown={onNavigate ? (e) => e.key === 'Enter' && onNavigate('/') : undefined}
                role={onNavigate ? 'button' : undefined}
                tabIndex={onNavigate ? 0 : undefined}
              >
                <BatchTubeLogo size="sm" textClassName="text-base" />
              </div>
              <p className="text-sm text-app-muted max-w-xs">The intelligent command center for media downloads and processing.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-app-muted">
                <li>
                  {onNavigate ? <a href="/features" onClick={go('/features')} className="hover:text-white transition-colors">Features</a> : <a href="#features" className="hover:text-white transition-colors">Features</a>}
                </li>
                <li>
                  {onNavigate ? <a href="/pricing" onClick={go('/pricing')} className="hover:text-white transition-colors">Pricing</a> : <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>}
                </li>
                <li><a href="/changelog" onClick={onNavigate ? go('/changelog') : undefined} className="hover:text-white transition-colors">Changelog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Developers</h4>
              <ul className="space-y-2 text-sm text-app-muted">
                <li><a href="/api-docs" onClick={onNavigate ? go('/api-docs') : undefined} className="hover:text-white transition-colors">API Documentation</a></li>
                <li><a href="/webhooks" onClick={onNavigate ? go('/webhooks') : undefined} className="hover:text-white transition-colors">Webhooks</a></li>
                <li><a href="/status" onClick={onNavigate ? go('/status') : undefined} className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-app-muted">
                <li><a href="/privacy" onClick={onNavigate ? go('/privacy') : undefined} className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="/terms" onClick={onNavigate ? go('/terms') : undefined} className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-app-muted">
              © 2026 BatchTube. A Curvens product. All rights reserved.
            </div>
            <div className="flex items-center gap-4 text-app-muted">
              <Twitter className="w-4 h-4 hover:text-white cursor-pointer transition-colors" />
              <Youtube className="w-4 h-4 hover:text-white cursor-pointer transition-colors" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
