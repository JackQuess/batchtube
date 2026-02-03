import React from 'react';
import { Link } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { Navbar } from '../components/Navbar';
import { INFO_TEXTS, LEGAL_TEXTS, TRANSLATIONS } from '../constants';
import { InfoPageType, LegalDocType, PolicyPageType } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface PolicyPageProps {
  type: PolicyPageType;
}

const isLegalType = (type: PolicyPageType): type is LegalDocType => {
  return type === 'terms' || type === 'privacy' || type === 'cookies' || type === 'legal';
};

const getTitle = (type: PolicyPageType, t: ReturnType<typeof getTranslations>) => {
  switch (type) {
    case 'terms':
      return t.terms;
    case 'privacy':
      return t.privacy;
    case 'cookies':
      return t.cookies;
    case 'legal':
      return t.legal;
    case 'howItWorks':
      return t.howItWorks;
    case 'faq':
      return t.faq;
    case 'supportedSites':
      return t.supportedSites;
    default:
      return t.metadataUnavailable;
  }
};

const getTranslations = (lang: string) => TRANSLATIONS[lang as keyof typeof TRANSLATIONS];

export const PolicyPage: React.FC<PolicyPageProps> = ({ type }) => {
  const { lang, setLang } = useLanguage();
  const t = getTranslations(lang);

  const content = isLegalType(type)
    ? LEGAL_TEXTS[lang]?.[type as LegalDocType] || LEGAL_TEXTS.en[type as LegalDocType]
    : INFO_TEXTS[lang]?.[type as InfoPageType] || INFO_TEXTS.en[type as InfoPageType];

  return (
    <div className="min-h-screen flex flex-col bg-[#050509] text-white font-sans selection:bg-primary/30">
      <Navbar lang={lang} setLang={setLang} />

      <main className="flex-grow pt-20 sm:pt-24 pb-16 w-full max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{getTitle(type, t)}</h1>
          <Link
            to="/"
            className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors"
          >
            {t.backToSearch}
          </Link>
        </div>

        <div className="bg-[#0b0b10] border border-white/10 rounded-2xl shadow-xl p-5 sm:p-6">
          <div className="text-gray-300 leading-relaxed whitespace-pre-wrap font-light text-sm sm:text-base">
            {content || t.metadataUnavailable}
          </div>
        </div>
      </main>

      <Footer t={t} />
    </div>
  );
};
