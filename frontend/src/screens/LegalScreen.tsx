import React, { useState } from 'react';
import { ViewState } from '../types';

interface LegalScreenProps {
  onNavigate: (view: ViewState) => void;
}

type DocType = 'terms' | 'privacy' | 'cookie' | 'refund';

const docs: Record<DocType, { title: string; sections: string[] }> = {
  terms: {
    title: 'Terms of Service',
    sections: [
      'BatchTube is provided as a media processing platform for lawful use cases.',
      'Users are responsible for rights and permissions on processed content.',
      'We may restrict abusive traffic to protect system reliability.'
    ]
  },
  privacy: {
    title: 'Privacy Policy',
    sections: [
      'We collect only the account and operational data required to provide service.',
      'Generated files are temporary and removed according to retention policy.',
      'You can contact us for data access or deletion requests.'
    ]
  },
  cookie: {
    title: 'Cookie Policy',
    sections: [
      'Cookies are used for session continuity and security controls.',
      'Essential cookies are required for authenticated account workflows.',
      'Analytics and optional cookies can be controlled through browser settings.'
    ]
  },
  refund: {
    title: 'Refund Policy',
    sections: [
      'New Pro subscriptions are eligible for refund requests within 14 days.',
      'Refunds are reviewed via support with billing details.',
      'Accounts suspended for abuse are not eligible for refund.'
    ]
  }
};

export const LegalScreen: React.FC<LegalScreenProps> = ({ onNavigate }) => {
  const [activeDoc, setActiveDoc] = useState<DocType>('terms');

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-10 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        <aside className="md:col-span-3 glass-card rounded-2xl p-4 border border-white/10 h-fit">
          <p className="text-xs uppercase tracking-wide text-gray-500 mb-3">Legal documents</p>
          <div className="space-y-1">
            {(Object.keys(docs) as DocType[]).map((doc) => (
              <button
                key={doc}
                onClick={() => setActiveDoc(doc)}
                className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-colors ${activeDoc === doc ? 'bg-primary/10 text-primary border border-primary/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              >
                {docs[doc].title}
              </button>
            ))}
          </div>
        </aside>

        <section className="md:col-span-9 glass-card rounded-2xl p-6 border border-white/10">
          <h1 className="text-3xl font-bold text-white tracking-tight">{docs[activeDoc].title}</h1>
          <p className="text-xs text-gray-500 mt-2">Last updated: February 2026</p>

          <div className="mt-6 space-y-4 text-sm text-gray-300 leading-relaxed">
            {docs[activeDoc].sections.map((section) => (
              <p key={section}>{section}</p>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
