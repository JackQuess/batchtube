import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Webhook, Copy, CheckCircle2 } from 'lucide-react';
import { applySeoMeta } from '../lib/seo';
import { PublicLayout } from '../components/PublicLayout';

export function WebhooksPage() {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    applySeoMeta({ title: 'Webhooks | BatchTube', description: 'Real-time notifications for batch processing jobs.' });
  }, []);

  const copyCode = () => {
    navigator.clipboard.writeText('{\n  "event": "batch.completed",\n  "batchId": "bt_batch_987654321",\n  "status": "success",\n  "items": 1,\n  "downloadUrl": "https://api.batchtube.com/v1/download/bt_batch_987654321"\n}');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <PublicLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
            <Webhook className="w-6 h-6 text-purple-400" />
          </div>
          <h1 className="text-4xl font-bold text-white">Webhooks</h1>
        </div>
        <p className="text-app-muted text-lg mb-12">Receive real-time notifications when your batch processing jobs complete.</p>

        <div className="space-y-12">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Overview</h2>
            <p className="text-app-muted mb-4">
              Webhooks allow you to build or set up integrations which subscribe to certain events on BatchTube. When one of those events is triggered, we&apos;ll send a HTTP POST payload to the webhook&apos;s configured URL.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Events</h2>
            <ul className="list-disc pl-6 space-y-2 text-app-muted">
              <li><code className="bg-white/10 px-1.5 py-0.5 rounded text-white font-mono text-sm">batch.created</code> - Fired when a new batch job is created.</li>
              <li><code className="bg-white/10 px-1.5 py-0.5 rounded text-white font-mono text-sm">batch.processing</code> - Fired when a batch job starts processing.</li>
              <li><code className="bg-white/10 px-1.5 py-0.5 rounded text-white font-mono text-sm">batch.completed</code> - Fired when a batch job successfully completes.</li>
              <li><code className="bg-white/10 px-1.5 py-0.5 rounded text-white font-mono text-sm">batch.failed</code> - Fired when a batch job fails.</li>
            </ul>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Payload Example</h2>
            <p className="text-app-muted mb-4">
              Here is an example of the payload sent for the <code className="bg-white/10 px-1.5 py-0.5 rounded text-white font-mono text-sm">batch.completed</code> event.
            </p>
            <div className="glass-panel p-4 rounded-xl border border-white/5 bg-black/50 relative group">
              <button type="button" onClick={copyCode} className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors opacity-0 group-hover:opacity-100">
                {copied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
              <pre className="text-sm font-mono text-app-muted overflow-x-auto">
                <code className="text-pink-400">{'{'}</code>
                <code className="text-white">  &quot;event&quot;</code>: <code className="text-green-400">&quot;batch.completed&quot;</code>,
                <code className="text-white">  &quot;batchId&quot;</code>: <code className="text-green-400">&quot;bt_batch_987654321&quot;</code>,
                <code className="text-white">  &quot;status&quot;</code>: <code className="text-green-400">&quot;success&quot;</code>,
                <code className="text-white">  &quot;items&quot;</code>: <code className="text-orange-400">1</code>,
                <code className="text-white">  &quot;downloadUrl&quot;</code>: <code className="text-green-400">&quot;https://api.batchtube.com/v1/download/bt_batch_987654321&quot;</code>
                <code className="text-pink-400">{'}'}</code>
              </pre>
            </div>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Security</h2>
            <p className="text-app-muted mb-4">
              To verify that the webhook request originated from BatchTube, we include a <code className="bg-white/10 px-1.5 py-0.5 rounded text-white font-mono text-sm">X-BatchTube-Signature</code> header with each request. You should use your webhook secret to compute an HMAC SHA256 signature of the payload and compare it to the header value.
            </p>
          </section>
        </div>
      </motion.div>
    </PublicLayout>
  );
}
