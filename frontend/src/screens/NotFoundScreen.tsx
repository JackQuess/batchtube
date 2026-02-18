import React from 'react';
import { ViewState } from '../types';
import { Button } from '../components/Button';

interface NotFoundScreenProps {
  onNavigate: (view: ViewState) => void;
}

export const NotFoundScreen: React.FC<NotFoundScreenProps> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6 animate-in fade-in zoom-in duration-300">
      <h1 className="text-6xl md:text-8xl font-bold text-white tracking-tighter mb-4">
        404
      </h1>
      <div className="h-1 w-24 bg-primary rounded-full mb-8"></div>
      <h2 className="text-2xl font-bold text-white mb-2">Page not found</h2>
      <p className="text-gray-400 mb-8 max-w-md">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Button onClick={() => onNavigate('dashboard')} icon="home" className="px-8">
        Back to home
      </Button>
    </div>
  );
};