import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Zap, Shield, Layers, Globe, Code2, Headphones } from 'lucide-react';
import { applySeoMeta } from '../lib/seo';
import { PublicLayout } from '../components/PublicLayout';

const FEATURES = [
  { icon: <Zap className="w-6 h-6 text-yellow-400" />, title: 'Lightning Fast Downloads', description: 'Optimized infrastructure ensures your files are ready in seconds, not minutes.' },
  { icon: <Layers className="w-6 h-6 text-blue-400" />, title: 'Batch Processing', description: 'Paste multiple links or entire playlists and let BatchTube handle the rest concurrently.' },
  { icon: <Headphones className="w-6 h-6 text-purple-400" />, title: 'High-Fidelity Audio', description: 'Extract pristine audio from any video source with customizable bitrates and formats.' },
  { icon: <Globe className="w-6 h-6 text-green-400" />, title: 'Universal Support', description: 'Works seamlessly with YouTube, Vimeo, Twitter, TikTok, and hundreds of other platforms.' },
  { icon: <Code2 className="w-6 h-6 text-app-primary" />, title: 'Developer API', description: 'Integrate our powerful extraction engine directly into your own applications.' },
  { icon: <Shield className="w-6 h-6 text-emerald-400" />, title: 'Secure & Private', description: 'Your data is encrypted in transit and at rest. We never store your downloaded files.' },
];

export function FeaturesPage() {
  useEffect(() => {
    applySeoMeta({ title: 'Features | BatchTube', description: 'BatchTube features: speed, efficiency, and power for creators and developers.' });
  }, []);

  return (
    <PublicLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Everything you need to manage media</h1>
          <p className="text-xl text-app-muted max-w-2xl mx-auto">
            BatchTube is built for speed, efficiency, and power. Discover the features that make it the ultimate tool for creators and developers.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="glass-panel p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-app-muted text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </PublicLayout>
  );
}
