import React, { useEffect } from 'react';
import { AppLink } from '../lib/simpleRouter';
import { applySeoMeta } from '../lib/seo';

export const SupportedSites: React.FC = () => {
  useEffect(() => {
    applySeoMeta({
      title: 'Supported Sites | BatchTube',
      description:
        'Platforms BatchTube can typically process (via extraction tooling) and what to expect when a site is restricted, rate-limited, or protected.'
    });
  }, []);

  return (
    <div className="max-w-3xl mx-auto w-full px-4 sm:px-6">
      <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6 sm:p-8 shadow-2xl shadow-black/20">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Supported Sites</h1>
        <p className="mt-3 text-neutral-300 leading-relaxed">
          BatchTube relies on robust media extraction tooling on the backend. In practice, this means it can often handle
          a wide range of public video pages — but support varies by platform, region, and the specific content type.
        </p>

        <h2 className="mt-8 text-xl font-semibold">Typically Works Well</h2>
        <ul className="mt-2 space-y-2 text-neutral-300 leading-relaxed list-disc pl-5">
          <li>Public video pages with standard playback (clear streams, no DRM).</li>
          <li>Platforms that provide stable metadata (title/thumbnail) and consistent media endpoints.</li>
          <li>Single videos and many common playlists/collections (depending on source structure).</li>
        </ul>

        <h2 className="mt-8 text-xl font-semibold">Common Examples</h2>
        <p className="mt-2 text-neutral-300 leading-relaxed">
          The following are common platforms that are frequently compatible in a general sense. Availability can change
          at any time:
        </p>
        <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-neutral-300">
          <li className="rounded-xl border border-white/10 bg-black/20 px-4 py-2">YouTube (public videos)</li>
          <li className="rounded-xl border border-white/10 bg-black/20 px-4 py-2">Vimeo (public videos)</li>
          <li className="rounded-xl border border-white/10 bg-black/20 px-4 py-2">Dailymotion (public videos)</li>
          <li className="rounded-xl border border-white/10 bg-black/20 px-4 py-2">SoundCloud (public tracks)</li>
        </ul>

        <h2 className="mt-8 text-xl font-semibold">May Not Work (By Design)</h2>
        <ul className="mt-2 space-y-2 text-neutral-300 leading-relaxed list-disc pl-5">
          <li>DRM-protected streams, paywalled content, or subscription-only libraries.</li>
          <li>Private videos, age-restricted media, or content requiring authentication.</li>
          <li>Websites that aggressively rate-limit or frequently change their delivery URLs.</li>
        </ul>

        <h2 className="mt-8 text-xl font-semibold">Best Practices</h2>
        <ul className="mt-2 space-y-2 text-neutral-300 leading-relaxed list-disc pl-5">
          <li>Prefer direct URLs when you already know the exact video.</li>
          <li>Try smaller batches first to confirm compatibility for a platform.</li>
          <li>If an item fails, retry later — some sources temporarily throttle requests.</li>
        </ul>

        <div className="mt-8 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-neutral-300">
          Looking for step-by-step guidance? Read{' '}
          <AppLink to="/how-it-works" className="text-primary hover:underline">
            How it works
          </AppLink>{' '}
          or check the{' '}
          <AppLink to="/faq" className="text-primary hover:underline">
            FAQ
          </AppLink>
          .
        </div>

        <div className="mt-6">
          <AppLink
            to="/"
            className="inline-flex px-4 py-2 rounded-full bg-primary hover:bg-red-600 transition-colors text-sm font-semibold"
          >
            Back to Search
          </AppLink>
        </div>
      </div>
    </div>
  );
};

