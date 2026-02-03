import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import App from './App';
import { PolicyPage } from './pages/PolicyPage';
import { LanguageProvider } from './context/LanguageContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/terms" element={<PolicyPage type="terms" />} />
          <Route path="/privacy" element={<PolicyPage type="privacy" />} />
          <Route path="/cookies" element={<PolicyPage type="cookies" />} />
          <Route path="/legal" element={<PolicyPage type="legal" />} />
          <Route path="/how-it-works" element={<PolicyPage type="howItWorks" />} />
          <Route path="/faq" element={<PolicyPage type="faq" />} />
          <Route path="/supported-sites" element={<PolicyPage type="supportedSites" />} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  </React.StrictMode>
);
