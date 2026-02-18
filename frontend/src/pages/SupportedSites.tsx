import React, { useEffect } from 'react';
import { AppLink } from '../lib/simpleRouter';
import { applySeoMeta } from '../lib/seo';
import { SupportedLanguage, Translations } from '../types';

interface SupportedSitesProps {
  lang: SupportedLanguage;
  t: Translations;
}

export const SupportedSites: React.FC<SupportedSitesProps> = ({ lang, t }) => {
  const sections = [
    {
      title: 'Video Platforms',
      providers: ['youtube', 'vimeo', 'dailymotion', 'twitch', 'bilibili', 'rutube', 'okru']
    },
    {
      title: 'Social Platforms',
      providers: ['tiktok', 'instagram', 'twitter', 'facebook', 'reddit', 'tumblr', 'pinterest', 'linkedin', 'vk', '9gag']
    },
    {
      title: 'Audio Platforms',
      providers: ['soundcloud', 'mixcloud', 'bandcamp']
    },
    {
      title: 'Others',
      providers: ['streamable', 'coub', 'archive', 'loom', 'generic (direct link + m3u8)']
    }
  ];

  useEffect(() => {
    applySeoMeta({
      title: `${t.supportedPlatformsTitle} | BatchTube`,
      description: t.supportedPlatformsSubtitle
    });
  }, [t.supportedPlatformsSubtitle, t.supportedPlatformsTitle]);

  return (
    <div className="max-w-3xl mx-auto w-full px-4 sm:px-6">
      <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6 sm:p-8 shadow-2xl shadow-black/20">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t.supportedPlatformsTitle}</h1>
        <p className="mt-2 text-sm text-neutral-300">{t.supportedPlatformsSubtitle}</p>

        <div className="mt-6 space-y-5 rounded-xl border border-white/10 bg-black/20 p-4 sm:p-5">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-sm font-semibold text-neutral-200 mb-3">{section.title}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {section.providers.map((provider) => (
                  <div
                    key={`${section.title}-${provider}`}
                    className="rounded-lg border border-white/10 bg-white/[0.02] px-2.5 py-2 text-center text-xs text-neutral-300 transition-colors hover:border-primary"
                  >
                    {provider}
                  </div>
                ))}
              </div>
            </section>
          ))}

          <p className="pt-1 text-xs text-neutral-400">{t.availabilityNote}</p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <AppLink
            to="/"
            className="px-4 py-2 rounded-full bg-primary hover:bg-red-600 transition-colors text-sm font-semibold"
          >
            {t.backToSearch}
          </AppLink>
          <AppLink
            to="/how-it-works"
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 transition-colors text-sm"
          >
            {t.howItWorks}
          </AppLink>
          <AppLink
            to="/faq"
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 transition-colors text-sm"
          >
            {t.faq}
          </AppLink>
        </div>
      </div>
    </div>
  );
};
