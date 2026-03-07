/**
 * Single source of truth for FAQ content. Used by LandingPage, Faq page, and FAQScreen.
 */

export interface FaqItem {
  q: string;
  a: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    q: 'Is BatchTube free?',
    a: 'Yes, BatchTube is free to use. Premium performance comes built-in.',
  },
  {
    q: 'Does BatchTube store my files?',
    a: 'No. Downloads are streamed directly and cleaned automatically. We do not keep your files.',
  },
  {
    q: 'Is it safe?',
    a: 'All jobs are sandboxed. Nothing sensitive is saved or sold. We respect your privacy.',
  },
  {
    q: 'Does ZIP downloading work on mobile?',
    a: 'Absolutely. The queue and ZIP flow are optimized for touch and work on all devices.',
  },
  {
    q: 'Do I need to create an account?',
    a: 'No accounts or friction for basic use. Open, search, and start downloading. Sign in for history and more.',
  },
  {
    q: 'Do you support playlist and channel downloads?',
    a: 'Yes. Paste a playlist or channel URL and our engine will detect and list all contained videos for you to select.',
  },
  {
    q: 'What happens if a download fails?',
    a: 'Our system automatically retries failed downloads. If it persists, check that the link is public and supported.',
  },
  {
    q: 'Which sites are supported?',
    a: 'YouTube (videos and Shorts), youtu.be links, and more. See the Supported Sites page for the full list.',
  },
];
