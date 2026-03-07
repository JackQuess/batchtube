/**
 * Single source of truth for "How it Works" steps. Used by LandingPage and HowItWorks page.
 */

export interface HowItWorksStep {
  title: string;
  desc: string;
}

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    title: 'Search or paste a link',
    desc: 'Paste a YouTube (or supported) URL or type a search to see instant results.',
  },
  {
    title: 'Select videos and format',
    desc: 'Queue MP3 or MP4 in bulk and choose quality (e.g. 1080p, 4K, 320kbps).',
  },
  {
    title: 'Download your ZIP',
    desc: 'BatchTube processes in parallel and packs everything into one ZIP for fast download.',
  },
];
