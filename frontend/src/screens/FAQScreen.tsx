import React, { useState } from 'react';
import { ViewState } from '../types';

interface FAQScreenProps {
  onNavigate: (view: ViewState) => void;
}

const faqs = [
  { q: 'Is BatchTube legal to use?', a: 'BatchTube is for personal archiving and fair-use workflows. Users are responsible for rights and compliance.' },
  { q: 'What happens if a download fails?', a: 'Failed items are retried automatically, and you can manually retry from Queue screen.' },
  { q: 'Is there a file-size limit?', a: 'Limits depend on your plan tier and provider constraints.' },
  { q: 'Can I cancel anytime?', a: 'Yes. You can manage or cancel from your Billing page.' },
  { q: 'Do you support playlist downloads?', a: 'Yes. Playlist URLs are parsed into individual queue items.' }
];

export const FAQScreen: React.FC<FAQScreenProps> = ({ onNavigate }) => {
  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-10 animate-in fade-in duration-500">
      <div className="max-w-2xl mb-10">
        <h1 className="text-4xl font-bold text-white tracking-tight">Frequently asked questions</h1>
        <p className="text-gray-400 mt-3">Quick answers about usage, plans, and platform limits.</p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq) => (
          <AccordionItem key={faq.q} question={faq.q} answer={faq.a} />
        ))}
      </div>
    </div>
  );
};

const AccordionItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="glass-card rounded-xl overflow-hidden border border-white/10">
      <button onClick={() => setIsOpen((v) => !v)} className="w-full px-5 py-4 flex justify-between items-center text-left hover:bg-white/5 transition-colors">
        <span className="font-semibold text-white">{question}</span>
        <span className={`material-symbols-outlined text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}>expand_more</span>
      </button>
      <div className={`${isOpen ? 'max-h-44 py-4 border-t border-white/10' : 'max-h-0 py-0'} px-5 overflow-hidden transition-all duration-300 text-sm text-gray-400`}>
        {answer}
      </div>
    </div>
  );
};
