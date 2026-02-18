import React, { useState } from 'react';
import { Button } from '../components/Button';
import { ViewState } from '../types';

interface OnboardingScreenProps {
  onNavigate: (view: ViewState) => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onNavigate }) => {
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<'mp4' | 'mkv' | 'mp3' | null>('mp4');

  const handleContinue = () => {
    if (step === 1 && !selectedRole) return;
    if (step === 2 && !selectedFormat) return;

    if (step < 3) {
      setStep(step + 1);
    } else {
      onNavigate('dashboard');
    }
  };

  return (
    <div className="w-full max-w-[600px] glass-card rounded-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
      {/* Progress Bar */}
      <div className="h-1 bg-gray-800 w-full">
        <div 
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${(step / 3) * 100}%` }}
        ></div>
      </div>

      <div className="p-10 min-h-[400px] flex flex-col">
        {step === 1 && (
          <div className="flex-1 animate-in slide-in-from-right-8 fade-in duration-300">
            <h2 className="text-2xl font-bold text-white mb-2">How do you plan to use BatchTube?</h2>
            <p className="text-gray-400 mb-8">This helps us customize your default settings.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {['Content Creator', 'Video Editor', 'Archivist', 'Student', 'Developer', 'Other'].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRole(role)}
                  className={`p-4 rounded-xl text-left transition-all group ${
                    selectedRole === role
                      ? 'bg-primary/15 border border-primary/60 shadow-lg shadow-primary/15'
                      : 'bg-white/5 border border-white/5 hover:border-primary/50 hover:bg-white/10'
                  }`}
                >
                  <span className="font-medium text-white group-hover:text-primary transition-colors">{role}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex-1 animate-in slide-in-from-right-8 fade-in duration-300">
            <h2 className="text-2xl font-bold text-white mb-2">Preferred Output Format</h2>
            <p className="text-gray-400 mb-8">We can auto-convert everything to your liking.</p>
            
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setSelectedFormat('mp4')}
                className={`w-full flex items-center justify-between p-4 rounded-xl cursor-pointer text-left ${
                  selectedFormat === 'mp4'
                    ? 'bg-white/5 border border-primary/50'
                    : 'bg-white/5 border border-white/5 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/20 text-primary rounded-lg">
                    <span className="material-symbols-outlined">movie</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white">MP4 (H.264)</h4>
                    <p className="text-xs text-gray-400">Best compatibility, standard quality.</p>
                  </div>
                </div>
                <input type="radio" name="format" checked={selectedFormat === 'mp4'} readOnly className="accent-primary w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => setSelectedFormat('mkv')}
                className={`w-full flex items-center justify-between p-4 rounded-xl cursor-pointer text-left ${
                  selectedFormat === 'mkv'
                    ? 'bg-white/5 border border-primary/50'
                    : 'bg-white/5 border border-white/5 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-gray-800 text-gray-400 rounded-lg">
                    <span className="material-symbols-outlined">high_quality</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white">MKV (High Bitrate)</h4>
                    <p className="text-xs text-gray-400">Best for archiving, supports multiple streams.</p>
                  </div>
                </div>
                <input type="radio" name="format" checked={selectedFormat === 'mkv'} readOnly className="accent-primary w-5 h-5" />
              </button>

               <button
                type="button"
                onClick={() => setSelectedFormat('mp3')}
                className={`w-full flex items-center justify-between p-4 rounded-xl cursor-pointer text-left ${
                  selectedFormat === 'mp3'
                    ? 'bg-white/5 border border-primary/50'
                    : 'bg-white/5 border border-white/5 hover:bg-white/10'
                }`}
               >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-gray-800 text-gray-400 rounded-lg">
                    <span className="material-symbols-outlined">headphones</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white">MP3 (Audio Only)</h4>
                    <p className="text-xs text-gray-400">Extract audio automatically.</p>
                  </div>
                </div>
                <input type="radio" name="format" checked={selectedFormat === 'mp3'} readOnly className="accent-primary w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex-1 animate-in slide-in-from-right-8 fade-in duration-300 text-center flex flex-col items-center justify-center">
             <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-6 animate-pulse">
               <span className="material-symbols-outlined text-4xl">check</span>
             </div>
             <h2 className="text-2xl font-bold text-white mb-2">You're all set!</h2>
             <p className="text-gray-400 max-w-sm">
               Your workspace is ready. You have 50 free credits to start processing media today.
             </p>
          </div>
        )}

        <div className="mt-8 flex justify-between items-center">
          <button 
            onClick={() => step > 1 && setStep(step - 1)}
            className={`text-sm text-gray-500 hover:text-white transition-colors ${step === 1 ? 'invisible' : ''}`}
          >
            Back
          </button>
          <Button
            onClick={handleContinue}
            className="w-32"
            disabled={(step === 1 && !selectedRole) || (step === 2 && !selectedFormat)}
          >
            {step === 3 ? 'Launch' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
};
