import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { applySeoMeta } from '../lib/seo';
import { PublicLayout } from '../components/PublicLayout';

export function ChangelogPage() {
  useEffect(() => {
    applySeoMeta({ title: 'Changelog | BatchTube', description: 'All the latest updates, improvements, and fixes to BatchTube.' });
  }, []);

  return (
    <PublicLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-4xl font-bold text-white mb-4">Changelog</h1>
        <p className="text-app-muted text-lg mb-12">All the latest updates, improvements, and fixes to BatchTube.</p>

        <div className="space-y-12">
          <div className="relative pl-8 border-l border-white/10">
            <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-app-primary shadow-[0_0_10px_rgba(225,29,72,0.5)]" />
            <h2 className="text-2xl font-semibold text-white mb-2">v2.0.0 - The Smart Update</h2>
            <p className="text-sm text-app-muted mb-4">March 7, 2026</p>
            <div className="space-y-4">
              <div className="glass-panel p-4 rounded-xl border border-white/5">
                <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-xs">New</span>
                  Smart Command Bar
                </h3>
                <p className="text-sm text-app-muted">Completely redesigned the main input to dynamically detect links, channels, and commands. No more modals for basic actions.</p>
              </div>
              <div className="glass-panel p-4 rounded-xl border border-white/5">
                <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-xs">New</span>
                  Floating Processing Panel
                </h3>
                <p className="text-sm text-app-muted">Downloads now happen in a non-blocking floating panel at the bottom right of your screen.</p>
              </div>
              <div className="glass-panel p-4 rounded-xl border border-white/5">
                <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-xs">Improved</span>
                  Bento Grid Landing Page
                </h3>
                <p className="text-sm text-app-muted">A brand new, high-performance landing page showcasing the power of BatchTube.</p>
              </div>
            </div>
          </div>

          <div className="relative pl-8 border-l border-white/10">
            <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-white/20" />
            <h2 className="text-2xl font-semibold text-white mb-2">v1.5.0 - API Access</h2>
            <p className="text-sm text-app-muted mb-4">February 15, 2026</p>
            <div className="space-y-4">
              <div className="glass-panel p-4 rounded-xl border border-white/5">
                <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-xs">New</span>
                  Public REST API
                </h3>
                <p className="text-sm text-app-muted">Developers can now integrate BatchTube directly into their applications using our new REST API.</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </PublicLayout>
  );
}
