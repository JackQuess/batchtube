import React, { useEffect, useState } from 'react';
import { Layout } from './components/Layout';
import { SignUpScreen } from './screens/SignUpScreen';
import { LoginScreen } from './screens/LoginScreen';
import { ForgotPasswordScreen } from './screens/ForgotPasswordScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { LandingScreen } from './screens/LandingScreen';
import { PricingScreen } from './screens/PricingScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { NewBatchScreen } from './screens/NewBatchScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { AccountScreen } from './screens/AccountScreen';
import { BillingScreen } from './screens/BillingScreen';
import { SupportedSitesScreen } from './screens/SupportedSitesScreen';
import { FAQScreen } from './screens/FAQScreen';
import { LegalScreen } from './screens/LegalScreen';
import { ContactScreen } from './screens/ContactScreen';
import { StatusScreen } from './screens/StatusScreen';
import { NotFoundScreen } from './screens/NotFoundScreen';
import { QueueScreen } from './screens/QueueScreen';
import { FilesScreen } from './screens/FilesScreen';
import { ViewState } from './types';
import { AUTH_CHANGE_EVENT, getStoredUser, initializeAuth } from './lib/auth';
import { hasSupabaseConfig } from './lib/supabaseClient';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(() => (getStoredUser() ? 'dashboard' : 'landing'));

  useEffect(() => {
    void initializeAuth().then((user) => {
      if (user && currentView === 'landing') {
        setCurrentView('dashboard');
      }
    });

    const handler = () => {
      if (!getStoredUser()) {
        setCurrentView((current) => {
          const protectedViews: ViewState[] = ['dashboard', 'new-batch', 'queue', 'history', 'files', 'account', 'billing', 'settings'];
          return protectedViews.includes(current) ? 'landing' : current;
        });
      }
    };

    window.addEventListener(AUTH_CHANGE_EVENT, handler);
    return () => window.removeEventListener(AUTH_CHANGE_EVENT, handler);
  }, []);

  const renderView = () => {
    switch (currentView) {
      case 'landing':
        return <LandingScreen onNavigate={setCurrentView} />;
      case 'pricing':
        return <PricingScreen onNavigate={setCurrentView} />;
      case 'supported-sites':
        return <SupportedSitesScreen onNavigate={setCurrentView} />;
      case 'faq':
        return <FAQScreen onNavigate={setCurrentView} />;
      case 'legal':
        return <LegalScreen onNavigate={setCurrentView} />;
      case 'contact':
        return <ContactScreen onNavigate={setCurrentView} />;
      case 'status':
        return <StatusScreen onNavigate={setCurrentView} />;
      case 'signup':
        return <SignUpScreen onNavigate={setCurrentView} />;
      case 'login':
        return <LoginScreen onNavigate={setCurrentView} />;
      case 'forgot-password':
        return <ForgotPasswordScreen onNavigate={setCurrentView} />;
      case 'onboarding':
        return <OnboardingScreen onNavigate={setCurrentView} />;
      case 'dashboard':
        return <DashboardScreen onNavigate={setCurrentView} />;
      case 'new-batch':
        return <NewBatchScreen onNavigate={setCurrentView} />;
      case 'queue':
        return <QueueScreen onNavigate={setCurrentView} />;
      case 'history':
        return <HistoryScreen onNavigate={setCurrentView} />;
      case 'files':
        return <FilesScreen onNavigate={setCurrentView} />;
      case 'settings':
        return <SettingsScreen onNavigate={setCurrentView} />;
      case 'account':
        return <AccountScreen onNavigate={setCurrentView} />;
      case 'billing':
        return <BillingScreen onNavigate={setCurrentView} />;
      case 'not-found':
        return <NotFoundScreen onNavigate={setCurrentView} />;
      default:
        return <NotFoundScreen onNavigate={setCurrentView} />;
    }
  };

  if (!hasSupabaseConfig) {
    return (
      <div className="min-h-screen bg-background-dark text-white flex items-center justify-center px-6">
        <div className="glass-card rounded-2xl border border-red-500/40 p-8 max-w-xl w-full text-center">
          <h1 className="text-2xl font-bold mb-3">Supabase yapılandırması eksik</h1>
          <p className="text-gray-300 text-sm leading-relaxed">
            Uygulama çalışması için <code>VITE_SUPABASE_URL</code> ve <code>VITE_SUPABASE_ANON_KEY</code> tanımlanmalı.
            Vercel ortam değişkenlerini güncelleyip yeniden deploy etmelisin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Layout activeView={currentView} onNavigate={setCurrentView}>
      <div key={currentView} className="view-transition">
        {renderView()}
      </div>
    </Layout>
  );
};

export default App;
