import React, { useState } from 'react';
import { ViewState } from '../types';
import { FAQ_ITEMS } from '../content/faq';

interface FAQScreenProps {
  onNavigate: (view: ViewState) => void;
}

export const FAQScreen: React.FC<FAQScreenProps> = () => {
  return (
    <div className="w-full max-w-3xl mx-auto px-6 py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-white mb-4">Frequently Asked Questions</h1>
          <p className="text-gray-400">Everything you need to know about the platform.</p>
       </div>

       <div className="space-y-4">
          {FAQ_ITEMS.map((faq, idx) => (
             <AccordionItem key={idx} question={faq.q} answer={faq.a} />
          ))}
       </div>
    </div>
  );
};

const AccordionItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
   const [isOpen, setIsOpen] = useState(false);

   return (
      <div className="glass-card rounded-xl overflow-hidden border border-white/5">
         <button 
           onClick={() => setIsOpen(!isOpen)}
           className="w-full px-6 py-5 flex justify-between items-center text-left hover:bg-white/5 transition-colors"
         >
            <span className="font-semibold text-white">{question}</span>
            <span className={`material-symbols-outlined text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>expand_more</span>
         </button>
         <div className={`px-6 text-gray-400 text-sm leading-relaxed transition-all duration-300 ease-in-out ${isOpen ? 'max-h-48 py-5 border-t border-white/5' : 'max-h-0 py-0 overflow-hidden'}`}>
            {answer}
         </div>
      </div>
   );
};