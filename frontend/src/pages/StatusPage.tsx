import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { applySeoMeta } from '../lib/seo';
import { PublicLayout } from '../components/PublicLayout';

export function StatusPage() {
  useEffect(() => {
    applySeoMeta({ title: 'Status | BatchTube', description: 'BatchTube system status and service health.' });
  }, []);

  return (
    <PublicLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center gap-4 mb-8">
          <h1 className="text-4xl font-bold text-white">System Status</h1>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm font-medium text-green-400">All Systems Operational</span>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-white/5 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">API</h3>
              <p className="text-sm text-app-muted">api.batchtube.com</p>
            </div>
            <CheckCircle2 className="w-6 h-6 text-green-400" />
          </div>
          <div className="glass-panel p-6 rounded-2xl border border-white/5 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Web Application</h3>
              <p className="text-sm text-app-muted">app.batchtube.com</p>
            </div>
            <CheckCircle2 className="w-6 h-6 text-green-400" />
          </div>
          <div className="glass-panel p-6 rounded-2xl border border-white/5 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Processing Engine</h3>
              <p className="text-sm text-app-muted">Worker nodes</p>
            </div>
            <CheckCircle2 className="w-6 h-6 text-green-400" />
          </div>
          <div className="glass-panel p-6 rounded-2xl border border-white/5 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Storage</h3>
              <p className="text-sm text-app-muted">Temporary file storage</p>
            </div>
            <CheckCircle2 className="w-6 h-6 text-green-400" />
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-semibold text-white mb-6">Past Incidents</h2>
          <div className="space-y-4">
            <div className="glass-panel p-6 rounded-2xl border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-yellow-400" />
                <h3 className="text-lg font-semibold text-white">Degraded Performance on YouTube Downloads</h3>
              </div>
              <p className="text-sm text-app-muted mb-2">March 1, 2026</p>
              <p className="text-app-muted">We experienced slower than usual download speeds for YouTube links due to an API change. The issue was resolved within 2 hours.</p>
            </div>
          </div>
        </div>
      </motion.div>
    </PublicLayout>
  );
}
