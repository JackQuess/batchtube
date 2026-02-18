import React from 'react';
import { Button } from '../components/Button';
import { ViewState } from '../types';

interface NotFoundScreenProps {
  onNavigate: (view: ViewState) => void;
}

export const NotFoundScreen: React.FC<NotFoundScreenProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-[65vh] w-full flex items-center justify-center px-6 animate-in fade-in duration-300">
      <div className="glass-card rounded-2xl p-10 border border-white/10 text-center max-w-md w-full">
        <p className="text-6xl font-bold text-white tracking-tight">404</p>
        <p className="text-xl font-semibold text-white mt-4">Page not found</p>
        <p className="text-sm text-gray-400 mt-2">The page you requested doesn&apos;t exist in this workspace.</p>
        <Button className="mt-6" fullWidth icon="home" onClick={() => onNavigate('landing')}>Back to Home</Button>
      </div>
    </div>
  );
};
