import React, { useState } from 'react';
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
import { supabaseAuth } from './lib/supabaseClient';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(() => (supabaseAuth.getUser() ? 'dashboard' : 'landing'));

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

  return (
    <Layout activeView={currentView} onNavigate={setCurrentView}>
      <div key={currentView} className="view-transition">
        {renderView()}
      </div>
    </Layout>
  );
};

export default App;
