import React, { useEffect } from 'react';
import { AppLink } from '../lib/simpleRouter';
import { applySeoMeta } from '../lib/seo';

const FAQ: Array<{ q: string; a: React.ReactNode }> = [
  {
    q: 'What is BatchTube?',
    a: 'BatchTube is a search-and-batch downloader that helps you collect multiple items, process them in parallel, and download a single ZIP.'
  },
  {
    q: 'Do I need an account?',
    a: 'No. BatchTube does not require an account to use the core features.'
  },
  {
    q: 'Why do some links fail?',
    a: 'Failures usually happen when the source restricts access (private videos, region blocks, DRM/paywalls) or when the platform changes its page structure.'
  },
  {
    q: 'Is BatchTube affiliated with YouTube or Google?',
    a: 'No. BatchTube is an independent tool and is not affiliated with YouTube or Google.'
  },
  {
    q: 'Can BatchTube bypass paywalls or DRM?',
    a: 'No. If content is protected by DRM or behind a paywall, BatchTube will not bypass those restrictions.'
  },
  {
    q: 'What formats are supported?',
    a: 'BatchTube typically offers MP3 (audio) and MP4 (video). Actual availability depends on the source media.'
  },
  {
    q: 'Why is MP3 “quality” different from video quality?',
    a: 'Audio and video use different quality measures. Audio is usually bitrate-based, while video uses resolution (720p/1080p/4K).'
  },
  {
    q: 'Can I mix MP3 and MP4 in one ZIP?',
    a: 'Batch jobs are created with a single output format per job. Create separate batches if you need both.'
  },
  {
    q: 'What happens when I select items?',
    a: 'Selected items are stored in your session (client-side). You can review and remove items before starting the batch.'
  },
  {
    q: 'Why do I get a ZIP instead of separate files?',
    a: 'A ZIP is faster and simpler to download (one click) and prevents the browser from opening multiple download dialogs.'
  },
  {
    q: 'How many items can I download at once?',
    a: 'There may be practical limits depending on server capacity, file size, and platform restrictions. Very large batches can take longer.'
  },
  {
    q: 'Why does the progress modal show “processing” for a while?',
    a: 'Processing includes downloading each item, converting (if needed), and packaging everything into a ZIP.'
  },
  {
    q: 'I see thumbnails, but downloads fail—why?',
    a: 'Thumbnails/titles come from search results. Downloading requires extraction of media streams, which can be blocked or throttled by the source.'
  },
  {
    q: 'Are my downloads stored permanently?',
    a: 'No. BatchTube is designed to use temporary storage and clean up artifacts automatically after completion.'
  },
  {
    q: 'Does BatchTube track me?',
    a: 'BatchTube aims to be privacy-first. Optional cookie consent can affect whether third-party scripts load.'
  },
  {
    q: 'Why do I not see ads sometimes?',
    a: 'Ads (if enabled) are intentionally restricted to avoid showing them on low-value or utility-only screens. They only appear when a results grid has enough real items.'
  },
  {
    q: 'What should I do if results are empty?',
    a: (
      <>
        Try a different keyword, paste a direct URL, or check your spelling. You can also review{' '}
        <AppLink to="/supported-sites" className="text-primary hover:underline">
          supported sites
        </AppLink>{' '}
        to confirm the platform is compatible.
      </>
    )
  },
  {
    q: 'Does BatchTube work on mobile?',
    a: 'Yes. The UI is responsive. Large downloads may be constrained by browser limits and available storage on the device.'
  },
  {
    q: 'Can I resume a failed batch?',
    a: 'If a batch fails mid-way, start a new batch with the remaining items. Some failures are temporary and may succeed later.'
  },
  {
    q: 'Where can I learn the workflow quickly?',
    a: (
      <>
        Visit{' '}
        <AppLink to="/how-it-works" className="text-primary hover:underline">
          How it works
        </AppLink>{' '}
        for a step-by-step explanation.
      </>
    )
  }
];

export const Faq: React.FC = () => {
  useEffect(() => {
    applySeoMeta({
      title: 'FAQ | BatchTube',
      description:
        'Frequently asked questions about BatchTube: formats, batch downloads, ZIP output, failures, privacy, and supported sites.'
    });
  }, []);

  return (
    <div className="max-w-3xl mx-auto w-full px-4 sm:px-6">
      <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6 sm:p-8 shadow-2xl shadow-black/20">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">FAQ</h1>
        <p className="mt-3 text-neutral-300 leading-relaxed">
          Answers to the most common questions about searching, selecting, batching, and downloading.
        </p>

        <div className="mt-6 space-y-3">
          {FAQ.map((item) => (
            <details
              key={item.q}
              className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 open:bg-black/30 transition-colors"
            >
              <summary className="cursor-pointer font-semibold text-white">{item.q}</summary>
              <div className="mt-2 text-sm text-neutral-300 leading-relaxed">{item.a}</div>
            </details>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <AppLink
            to="/"
            className="px-4 py-2 rounded-full bg-primary hover:bg-red-600 transition-colors text-sm font-semibold"
          >
            Back to Search
          </AppLink>
          <AppLink
            to="/how-it-works"
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 transition-colors text-sm"
          >
            How it works
          </AppLink>
          <AppLink
            to="/supported-sites"
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 transition-colors text-sm"
          >
            Supported sites
          </AppLink>
        </div>
      </div>
    </div>
  );
};

