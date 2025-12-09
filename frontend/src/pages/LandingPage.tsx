import React from 'react';
import { ArrowRight, Zap, Music2, Box, Search, Shield, Smartphone } from 'lucide-react';

const features = [
  {
    title: 'Ultra Fast Batch Downloading',
    desc: 'Queue dozens of videos at once with a parallel engine built for speed.',
    icon: <Zap className="w-6 h-6 text-[#e5193e]" />,
  },
  {
    title: 'MP3 / MP4 High Quality Extraction',
    desc: 'Pick pristine audio or up to 4K video with one tap.',
    icon: <Music2 className="w-6 h-6 text-[#e5193e]" />,
  },
  {
    title: 'ZIP Auto-Packing (No Storage Needed)',
    desc: 'Automatic archiving keeps your downloads tidy and lightweight.',
    icon: <Box className="w-6 h-6 text-[#e5193e]" />,
  },
  {
    title: 'Instant HTML Search Engine (No API Needed)',
    desc: 'Lightning-fast HTML search means no quotas, no waiting.',
    icon: <Search className="w-6 h-6 text-[#e5193e]" />,
  },
];

const faqs = [
  { q: 'Is BatchTube free?', a: 'Yes, BatchTube is free to use. Premium performance comes built-in.' },
  { q: 'Does BatchTube store files?', a: 'No. Downloads are streamed directly and cleaned automatically.' },
  { q: 'Is it safe?', a: 'All jobs are sandboxed. Nothing sensitive is saved or sold.' },
  { q: 'Does ZIP downloading work on mobile?', a: 'Absolutely. The queue and ZIP flow are optimized for touch.' },
  { q: 'Does it require login?', a: 'No accounts or friction. Open, search, and start downloading.' },
];

const steps = [
  { title: 'Search anything', desc: 'Paste a link or type a title to see instant results.', icon: <Search className="w-5 h-5 text-white" /> },
  { title: 'Select videos', desc: 'Queue MP3 or MP4 in bulk with crisp quality controls.', icon: <Music2 className="w-5 h-5 text-white" /> },
  { title: 'Download instantly', desc: 'BatchTube zips everything and ships it to you—fast.', icon: <ArrowRight className="w-5 h-5 text-white" /> },
];

const CardGlow: React.FC = () => (
  <div className="absolute inset-0 rounded-[26px] bg-gradient-to-br from-[#e5193e]/30 via-transparent to-[#e5193e]/10 blur-3xl opacity-60" aria-hidden />
);

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0d0d0f] text-white relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 -left-10 h-64 w-64 bg-[#e5193e]/25 blur-[90px]" />
        <div className="absolute bottom-10 right-0 h-72 w-72 bg-[#e5193e]/20 blur-[110px]" />
      </div>

      <div className="relative z-10">
        <header className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20">
          <nav className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-[#e5193e] flex items-center justify-center shadow-[0_10px_40px_-12px_rgba(229,25,62,0.8)]">
                <span className="font-black text-lg">B</span>
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-white/60">BatchTube</p>
                <p className="font-semibold text-white">Premium Downloader</p>
              </div>
            </div>
            <a
              href="/app"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-2xl border border-white/10 bg-white/5 backdrop-blur hover:bg-white/10 transition-colors text-sm font-medium"
            >
              Open Web App
              <ArrowRight className="w-4 h-4" />
            </a>
          </nav>

          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 border border-white/10 text-xs uppercase tracking-[0.3em] text-white/70">
                Faster. Cleaner. Limitless.
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-[56px] leading-tight font-bold">
                Download YouTube Videos Faster Than Ever
              </h1>
              <p className="text-lg text-white/70 max-w-2xl">
                BatchTube lets you search, queue, and download unlimited MP3/MP4 files with one click. A minimal, Netflix-like experience tuned for raw speed.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="/app"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-[24px] bg-[#e5193e] text-white font-semibold shadow-[0_15px_50px_-12px_rgba(229,25,62,0.9)] hover:translate-y-[-1px] transition-transform"
                >
                  Start Downloading
                  <ArrowRight className="w-5 h-5" />
                </a>
              </div>
              <div className="relative mt-6">
                <CardGlow />
                <div className="relative rounded-[26px] border border-white/10 bg-white/5 backdrop-blur px-4 py-4 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.7)]">
                  <p className="text-xs text-white/60 mb-3">Mock search</p>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="flex-1 w-full rounded-2xl bg-[#0f0f12] border border-white/10 px-4 py-3 flex items-center gap-3">
                      <Search className="w-5 h-5 text-white/50" />
                      <input
                        disabled
                        value="Search or paste any YouTube link..."
                        className="bg-transparent w-full text-white/80 placeholder:text-white/40 outline-none cursor-default"
                        readOnly
                      />
                    </div>
                    <button className="w-full sm:w-auto inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#e5193e] font-semibold shadow-[0_12px_30px_-12px_rgba(229,25,62,0.9)]">
                      Search
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <CardGlow />
              <div className="relative rounded-[28px] border border-white/10 bg-gradient-to-br from-[#151519] to-[#0b0b0f] shadow-[0_25px_80px_-40px_rgba(0,0,0,0.8)] overflow-hidden">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/60">Batch queue</p>
                    <p className="text-xl font-semibold">Instant ZIP builder</p>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-white/5 text-white/70 text-xs border border-white/10">
                    Live
                  </div>
                </div>
                <div className="p-6 space-y-3">
                  {['4K Travel Vlog', 'Lo-fi Study Mix', 'Tech Review 2024'].map((item, idx) => (
                    <div
                      key={item}
                      className="flex items-center justify-between rounded-2xl bg-white/5 border border-white/5 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-14 rounded-xl bg-white/5 flex items-center justify-center text-white/70 text-sm border border-white/5">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-medium">{item}</p>
                          <p className="text-sm text-white/50">{idx === 0 ? 'MP4 · 1080p' : 'MP3 · 320kbps'}</p>
                        </div>
                      </div>
                      <div className="text-sm text-[#e5193e] font-semibold">Queued</div>
                    </div>
                  ))}
                </div>
                <div className="p-6 border-t border-white/5 flex items-center justify-between bg-white/5">
                  <div className="text-white/70 text-sm">ZIP ready in seconds</div>
                  <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#e5193e] font-semibold shadow-[0_12px_30px_-12px_rgba(229,25,62,0.9)]">
                    Download Zip
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="bg-[#0b0b0f]/60 border-t border-white/5">
          <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold">Built for binge downloaders</h2>
              <div className="hidden sm:flex items-center gap-2 text-sm text-white/60">
                <Shield className="w-4 h-4" />
                Private by design
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="relative rounded-[22px] border border-white/10 bg-[#111118] p-5 hover:-translate-y-1 transition-transform"
                >
                  <CardGlow />
                  <div className="relative space-y-3">
                    <div className="h-11 w-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                      {feature.icon}
                    </div>
                    <p className="font-semibold text-lg">{feature.title}</p>
                    <p className="text-sm text-white/60 leading-relaxed">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section id="how-it-works" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold">How it works</h2>
              <div className="text-sm text-white/60 flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                Mobile-ready flow
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {steps.map((step, index) => (
                <div
                  key={step.title}
                  className="relative rounded-[22px] border border-white/10 bg-[#111118] p-5 flex flex-col gap-3"
                >
                  <CardGlow />
                  <div className="relative flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-[#e5193e] flex items-center justify-center font-semibold">
                      {index + 1}
                    </div>
                    <div className="h-10 w-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                      {step.icon}
                    </div>
                  </div>
                  <p className="relative font-semibold text-lg">{step.title}</p>
                  <p className="relative text-sm text-white/60 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="showcase" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold">Showcase</h2>
              <p className="text-white/60 text-sm">Minimal dashboard preview</p>
            </div>
            <div className="relative">
              <div className="absolute inset-10 bg-[#e5193e]/20 blur-[120px]" aria-hidden />
              <div className="relative rounded-[28px] border border-white/10 bg-gradient-to-br from-[#151519] via-[#0f0f12] to-[#0b0b0f] p-6 shadow-[0_30px_100px_-50px_rgba(0,0,0,0.9)]">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-sm text-white/80">Batch queue</div>
                    <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-sm text-white/80">Live progress</div>
                    <div className="px-4 py-2 rounded-2xl bg-[#e5193e] text-sm font-semibold">ZIP ready</div>
                  </div>
                  <div className="grid md:grid-cols-[1.1fr_0.9fr] gap-4">
                    <div className="rounded-[22px] border border-white/10 bg-white/5 p-4 space-y-3">
                      <div className="flex items-center justify-between text-sm text-white/60">
                        <span>Queue</span>
                        <span>3 active</span>
                      </div>
                      {[68, 42, 18].map((progress, idx) => (
                        <div key={progress} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">Track #{idx + 1}</span>
                            <span className="text-white/60">{progress}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#e5193e] to-[#ff3f62]"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-[22px] border border-white/10 bg-white/5 p-4 space-y-3">
                      <div className="flex items-center justify-between text-sm text-white/60">
                        <span>Details</span>
                        <span>1080p / 320kbps</span>
                      </div>
                      <div className="rounded-2xl bg-[#0f0f12] border border-white/10 p-4 space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span>ZIP size</span>
                          <span className="font-semibold">124 MB</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Parallel threads</span>
                          <span className="font-semibold">3</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Auto-clean</span>
                          <span className="font-semibold text-[#e5193e]">Enabled</span>
                        </div>
                        <button className="w-full mt-2 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-[22px] bg-[#e5193e] font-semibold shadow-[0_15px_40px_-18px_rgba(229,25,62,0.9)]">
                          Open Web App
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="faq" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold">FAQ</h2>
              <p className="text-white/60 text-sm">Answers in one glance</p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {faqs.map((item) => (
                <div key={item.q} className="rounded-[22px] border border-white/10 bg-[#111118] p-5">
                  <p className="font-semibold mb-2">{item.q}</p>
                  <p className="text-sm text-white/60 leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </section>
        </main>

        <footer className="border-t border-white/5 bg-[#0d0d0f]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-white/50 text-sm">
            BatchTube — Private, fast, and obsession-level polished. Built for creators who refuse to wait.
          </div>
        </footer>
      </div>
    </div>
  );
};
