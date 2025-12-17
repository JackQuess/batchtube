import React, { useEffect } from 'react';
import { AppLink } from '../lib/simpleRouter';
import { applySeoMeta } from '../lib/seo';

export const HowItWorks: React.FC = () => {
  useEffect(() => {
    applySeoMeta({
      title: 'How BatchTube Works | Search, Select, Batch Download',
      description:
        'Learn how BatchTube searches videos, builds a batch queue, and generates a single ZIP for fast downloads — with privacy-first defaults and clear limitations.'
    });
  }, []);

  return (
    <div className="max-w-3xl mx-auto w-full px-4 sm:px-6">
      <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6 sm:p-8 shadow-2xl shadow-black/20">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">How BatchTube Works</h1>
        <p className="mt-3 text-sm sm:text-base text-neutral-300 leading-relaxed">
          BatchTube is designed to feel like a premium “search → select → download” workflow, while keeping the
          experience lightweight and privacy-conscious. This page explains what happens at each step, what you can
          expect in terms of speed and output formats, and why certain limitations exist.
        </p>

        <h2 className="mt-8 text-xl font-semibold">1) Search or Paste a Link</h2>
        <p className="mt-2 text-neutral-300 leading-relaxed">
          On the home screen, you can either search by keywords or paste a direct link. BatchTube sends your query to
          the backend, which resolves the input into a list of real video items (title, thumbnail, duration when
          available, and an identifier). The UI then renders a results grid with real thumbnails and titles so you can
          quickly verify you’re selecting the right content.
        </p>
        <p className="mt-3 text-neutral-300 leading-relaxed">
          Tip: pasting a valid URL often triggers an immediate lookup. This is useful when you already know the exact
          page you want, and it reduces the need to scroll through unrelated results.
        </p>

        <h2 className="mt-8 text-xl font-semibold">2) Build a Batch Queue (Selection)</h2>
        <p className="mt-2 text-neutral-300 leading-relaxed">
          Each result card lets you select an item for batch processing. Your selection is kept on the client and can be
          adjusted at any time. You can mix and match items without downloading immediately, which is helpful when you’re
          collecting content for offline listening, study material, or archiving.
        </p>
        <p className="mt-3 text-neutral-300 leading-relaxed">
          You can also choose output format and quality. For example, audio-only (MP3) is smaller and faster for large
          batches, while MP4 preserves the original video stream (subject to source availability).
        </p>

        <h2 className="mt-8 text-xl font-semibold">3) Batch Processing and ZIP Output</h2>
        <p className="mt-2 text-neutral-300 leading-relaxed">
          When you start a batch download, the backend creates a job and processes items in parallel (with a safe
          concurrency limit). Parallelism helps overall throughput, especially when a batch contains a mix of short and
          long items.
        </p>
        <p className="mt-3 text-neutral-300 leading-relaxed">
          As items complete, BatchTube packages them into a single ZIP so you don’t have to download dozens of files one
          by one. The progress modal shows what’s happening and provides a final “Save file” action when the ZIP is ready.
        </p>

        <h2 className="mt-8 text-xl font-semibold">4) Formats and Quality (What “Quality” Means)</h2>
        <p className="mt-2 text-neutral-300 leading-relaxed">
          Output options are intentionally simple so you can make a quick choice without memorizing a long list of codecs
          or containers. In most cases, audio downloads are produced as MP3, and video downloads are produced as MP4.
          Behind the scenes, the backend chooses compatible streams and (when necessary) converts them into the selected
          format.
        </p>
        <p className="mt-3 text-neutral-300 leading-relaxed">
          For video, quality usually maps to resolution (for example 1080p). For audio, quality typically maps to bitrate
          (for example 320 kbps). The options you see can vary depending on what the source platform provides. If the
          original video doesn’t offer a higher quality stream, selecting a higher option won’t magically create more
          detail — it will simply fall back to the best available source.
        </p>

        <h2 className="mt-8 text-xl font-semibold">4) Privacy-First Defaults</h2>
        <p className="mt-2 text-neutral-300 leading-relaxed">
          BatchTube is built with a “minimum necessary data” mindset. It aims to avoid keeping personal data and stores
          only what is required to complete a download job. Temporary artifacts are cleaned up automatically. If you’re
          privacy-sensitive, you can also choose not to grant optional cookie consent — the core download functionality
          remains available.
        </p>

        <h2 className="mt-8 text-xl font-semibold">5) Tips for Fast, Reliable Batches</h2>
        <ul className="mt-2 space-y-2 text-neutral-300 leading-relaxed list-disc pl-5">
          <li>
            Start with a small batch (3–5 items) when testing a new platform or a new kind of content. Once you confirm it
            works, scale up.
          </li>
          <li>
            Prefer direct URLs for exact matches. Keyword results can include similarly named uploads and remixes.
          </li>
          <li>
            Avoid mixing extremely long items with many short items if you’re in a hurry — long items can dominate the
            total time even with parallel processing.
          </li>
          <li>
            If a single item fails, don’t discard the whole batch: remove the failing item and rerun the remainder.
          </li>
        </ul>

        <h2 className="mt-8 text-xl font-semibold">5) Important Limitations (What BatchTube Will Not Do)</h2>
        <ul className="mt-2 space-y-2 text-neutral-300 leading-relaxed list-disc pl-5">
          <li>
            It won’t bypass paywalls, DRM, private content, or restricted streams. If the source doesn’t allow extraction,
            the job may fail.
          </li>
          <li>
            Availability and formats depend on the original site and what it exposes. Some sources offer limited quality
            options.
          </li>
          <li>
            Large batches may take time. Network speed, source throttling, and file size all affect completion time.
          </li>
        </ul>

        <h2 className="mt-8 text-xl font-semibold">6) Troubleshooting</h2>
        <p className="mt-2 text-neutral-300 leading-relaxed">
          If a search succeeds but downloads fail, the most common cause is platform-side restriction or throttling. Try
          again later, try a different quality, or switch to a smaller batch size. If results are empty, try pasting the
          exact URL of a known public video. Some platforms return limited results for very generic keywords.
        </p>
        <p className="mt-3 text-neutral-300 leading-relaxed">
          If you run into repeated failures across multiple platforms, it may indicate a temporary backend outage or a
          platform-wide change. Checking the FAQ can help identify whether the issue is likely to be on the client side
          (browser limitations) or the server side (extraction failures).
        </p>

        <h2 className="mt-8 text-xl font-semibold">Next: FAQs and Supported Sites</h2>
        <p className="mt-2 text-neutral-300 leading-relaxed">
          If you want quick answers to common issues (failed items, ZIP creation, quality choices), visit the FAQ. If
          you’re wondering whether a specific platform is supported, check the supported sites page.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <AppLink
            to="/faq"
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 transition-colors text-sm"
          >
            Read the FAQ
          </AppLink>
          <AppLink
            to="/supported-sites"
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 transition-colors text-sm"
          >
            Supported Sites
          </AppLink>
          <AppLink
            to="/"
            className="px-4 py-2 rounded-full bg-primary hover:bg-red-600 transition-colors text-sm font-semibold"
          >
            Go to Search
          </AppLink>
        </div>
      </div>
    </div>
  );
};
