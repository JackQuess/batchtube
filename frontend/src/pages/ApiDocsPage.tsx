import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Code2, Copy, CheckCircle2 } from 'lucide-react';
import { applySeoMeta } from '../lib/seo';
import { PublicLayout } from '../components/PublicLayout';

export function ApiDocsPage() {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    applySeoMeta({ title: 'API Documentation | BatchTube', description: 'Integrate BatchTube media processing into your applications.' });
  }, []);

  const copyCode = () => {
    navigator.clipboard.writeText('curl -X POST https://api.batchtube.com/v1/batch -H "Authorization: Bearer YOUR_API_KEY" -d \'{"urls": ["https://youtube.com/watch?v=123"]}\'');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <PublicLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-app-primary/20 flex items-center justify-center border border-app-primary/30">
            <Code2 className="w-6 h-6 text-app-primary" />
          </div>
          <h1 className="text-4xl font-bold text-white">API Documentation</h1>
        </div>
        <p className="text-app-muted text-lg mb-12">Integrate BatchTube&apos;s powerful media processing engine directly into your own applications.</p>

        <div className="space-y-12">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Authentication</h2>
            <p className="text-app-muted mb-4">
              All API requests require an API key to be included in the <code className="bg-white/10 px-1.5 py-0.5 rounded text-white font-mono text-sm">Authorization</code> header as a Bearer token.
            </p>
            <div className="glass-panel p-4 rounded-xl border border-white/5 bg-black/50">
              <pre className="text-sm font-mono text-app-muted overflow-x-auto">
                Authorization: Bearer sk_live_your_api_key_here
              </pre>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Endpoints</h2>
            <div className="glass-panel rounded-xl border border-white/5 overflow-hidden mb-6">
              <div className="bg-white/5 px-6 py-4 border-b border-white/5 flex items-center gap-4">
                <span className="px-2 py-1 bg-green-500/20 text-green-400 font-mono text-xs font-bold rounded">POST</span>
                <span className="font-mono text-white">/v1/batch</span>
              </div>
              <div className="p-6">
                <p className="text-app-muted mb-4">Create a new batch processing job for one or more URLs.</p>
                <h4 className="text-white font-medium mb-2 text-sm">Request Body</h4>
                <div className="glass-panel p-4 rounded-xl border border-white/5 bg-black/50 mb-6 relative group">
                  <button type="button" onClick={copyCode} className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors opacity-0 group-hover:opacity-100">
                    {copied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <pre className="text-sm font-mono text-app-muted overflow-x-auto">
                    <code className="text-pink-400">{'{'}</code>
                    <code className="text-white">  &quot;urls&quot;</code>: <code className="text-green-400">[&quot;https://youtube.com/watch?v=123&quot;]</code>,
                    <code className="text-white">  &quot;extractAudio&quot;</code>: <code className="text-orange-400">false</code>,
                    <code className="text-white">  &quot;quality&quot;</code>: <code className="text-green-400">&quot;1080p&quot;</code>
                    <code className="text-pink-400">{'}'}</code>
                  </pre>
                </div>
                <h4 className="text-white font-medium mb-2 text-sm">Response (200 OK)</h4>
                <div className="glass-panel p-4 rounded-xl border border-white/5 bg-black/50">
                  <pre className="text-sm font-mono text-app-muted overflow-x-auto">
                    <code className="text-pink-400">{'{'}</code>
                    <code className="text-white">  &quot;batchId&quot;</code>: <code className="text-green-400">&quot;bt_batch_987654321&quot;</code>,
                    <code className="text-white">  &quot;status&quot;</code>: <code className="text-green-400">&quot;processing&quot;</code>,
                    <code className="text-white">  &quot;items&quot;</code>: <code className="text-orange-400">1</code>
                    <code className="text-pink-400">{'}'}</code>
                  </pre>
                </div>
              </div>
            </div>
            <div className="glass-panel rounded-xl border border-white/5 overflow-hidden">
              <div className="bg-white/5 px-6 py-4 border-b border-white/5 flex items-center gap-4">
                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 font-mono text-xs font-bold rounded">GET</span>
                <span className="font-mono text-white">/v1/batch/:batchId</span>
              </div>
              <div className="p-6">
                <p className="text-app-muted">Retrieve the status and download links for a specific batch job.</p>
              </div>
            </div>
          </section>
        </div>
      </motion.div>
    </PublicLayout>
  );
}
