import React, { useState } from 'react';
import { ViewState } from '../types';

interface LegalScreenProps {
  onNavigate: (view: ViewState) => void;
}

type DocType = 'terms' | 'privacy' | 'cookie' | 'refund';

export const LegalScreen: React.FC<LegalScreenProps> = ({ onNavigate }) => {
  const [activeDoc, setActiveDoc] = useState<DocType>('terms');

  const docs: Record<DocType, { title: string; content: React.ReactNode }> = {
    terms: {
      title: 'Terms of Service',
      content: (
        <div className="space-y-6">
           <p>
              Welcome to BatchTube. By accessing our website, you agree to be bound by these Terms of Service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws.
           </p>
           
           <h3 className="text-lg font-bold text-white mt-8 mb-2">1. Use License</h3>
           <p>
              Permission is granted to temporarily download one copy of the materials (information or software) on BatchTube's website for personal, non-commercial transitory viewing only.
           </p>
           
           <h3 className="text-lg font-bold text-white mt-8 mb-2">2. User Responsibilities</h3>
           <p>
              You acknowledge that you are solely responsible for the content you download using our services. BatchTube does not host any copyrighted content on its servers and acts solely as a technical processing agent.
           </p>
           
           <h3 className="text-lg font-bold text-white mt-8 mb-2">3. Disclaimer</h3>
           <p>
              The materials on BatchTube's website are provided on an 'as is' basis. BatchTube makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability.
           </p>
        </div>
      )
    },
    privacy: {
      title: 'Privacy Policy',
      content: (
        <div className="space-y-6">
           <p>
              Your privacy is important to us. It is BatchTube's policy to respect your privacy regarding any information we may collect from you across our website.
           </p>
           
           <h3 className="text-lg font-bold text-white mt-8 mb-2">1. Information We Collect</h3>
           <p>
              We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we’re collecting it and how it will be used.
           </p>
           
           <h3 className="text-lg font-bold text-white mt-8 mb-2">2. Log Data</h3>
           <p>
              When you visit our website, our servers may automatically log the standard data provided by your web browser. This data is considered "non-identifying information", as it does not personally identify you on its own.
           </p>
           
           <h3 className="text-lg font-bold text-white mt-8 mb-2">3. Processing Data</h3>
           <p>
              We do not store the media files you process on our servers for longer than the duration required to complete the batch job and allow you to download the result (typically 24 hours).
           </p>
        </div>
      )
    },
    cookie: {
      title: 'Cookie Policy',
      content: (
        <div className="space-y-6">
           <p>
              This is the Cookie Policy for BatchTube, accessible from batchtube.app.
           </p>
           
           <h3 className="text-lg font-bold text-white mt-8 mb-2">1. What Are Cookies</h3>
           <p>
              As is common practice with almost all professional websites this site uses cookies, which are tiny files that are downloaded to your computer, to improve your experience.
           </p>
           
           <h3 className="text-lg font-bold text-white mt-8 mb-2">2. How We Use Cookies</h3>
           <p>
              We use cookies for a variety of reasons detailed below. Unfortunately is in most cases there are no industry standard options for disabling cookies without completely disabling the functionality and features they add to this site.
           </p>
           
           <h3 className="text-lg font-bold text-white mt-8 mb-2">3. Authentication</h3>
           <p>
              We use cookies to verify your account and determine when you're logged in so we can make it easier for you to access the BatchTube services and show you the appropriate experience and features.
           </p>
        </div>
      )
    },
    refund: {
      title: 'Refund Policy',
      content: (
        <div className="space-y-6">
           <p>
              We want you to be satisfied with BatchTube. If you are not satisfied with your purchase, we are here to help.
           </p>
           
           <h3 className="text-lg font-bold text-white mt-8 mb-2">1. 14-Day Money Back Guarantee</h3>
           <p>
              If you are not completely satisfied with our Pro plan, you can request a full refund within 14 days of your initial purchase.
           </p>
           
           <h3 className="text-lg font-bold text-white mt-8 mb-2">2. How to Request</h3>
           <p>
              To request a refund, please contact our support team with your order details and the reason for your request. We process refunds within 5-10 business days.
           </p>
           
           <h3 className="text-lg font-bold text-white mt-8 mb-2">3. Exceptions</h3>
           <p>
              Refunds are not granted for accounts that have been banned due to violation of our Terms of Service (e.g., abuse of the API or platform).
           </p>
        </div>
      )
    }
  };

  const navItems: { id: DocType; label: string }[] = [
    { id: 'terms', label: 'Terms of Service' },
    { id: 'privacy', label: 'Privacy Policy' },
    { id: 'cookie', label: 'Cookie Policy' },
    { id: 'refund', label: 'Refund Policy' },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-12 animate-in fade-in duration-500">
       <div className="flex flex-col md:flex-row gap-12">
          
          {/* Sidebar */}
          <div className="w-full md:w-64 flex-shrink-0">
             <h3 className="text-white font-bold mb-6 px-4">Legal Center</h3>
             <ul className="space-y-1">
                {navItems.map((item) => (
                   <li key={item.id}>
                      <button 
                        onClick={() => setActiveDoc(item.id)}
                        className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors ${
                          activeDoc === item.id 
                            ? 'bg-primary/10 text-primary border border-primary/20 font-medium' 
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                         {item.label}
                      </button>
                   </li>
                ))}
             </ul>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-8 text-gray-300 leading-relaxed text-sm min-h-[500px]">
             <div className="animate-in fade-in slide-in-from-right-4 duration-300" key={activeDoc}>
                <h1 className="text-3xl font-bold text-white mb-6">{docs[activeDoc].title}</h1>
                <p className="text-xs text-gray-500 mb-8">Last updated: October 2026</p>
                {docs[activeDoc].content}
             </div>
          </div>
       </div>
    </div>
  );
};