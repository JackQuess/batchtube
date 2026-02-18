import React, { useState } from 'react';
import { Button } from '../components/Button';
import { ViewState } from '../types';

interface OnboardingScreenProps {
  onNavigate: (view: ViewState) => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onNavigate }) => {
  const [step, setStep] = useState(1);

  const handleContinue = () => {
    if (step < 3) setStep((s) => s + 1);
    else onNavigate('dashboard');
  };

  return (
    <div className="w-full max-w-[640px] glass-card rounded-2xl border border-white/10 overflow-hidden animate-in fade-in zoom-in duration-300">
      <div className="h-1 bg-white/10">
        <div className="h-full bg-primary transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }} />
      </div>

      <div className="p-8 md:p-10 min-h-[420px] flex flex-col">
        {step === 1 && (
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white">What best describes your use case?</h2>
            <p className="text-gray-400 mt-2">We will pre-configure your workspace defaults.</p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {['Content Creator', 'Video Editor', 'Archivist', 'Student', 'Developer', 'Other'].map((role) => (
                <button key={role} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-gray-200 hover:border-primary/40 hover:text-white transition-colors">
                  {role}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white">Select default format</h2>
            <p className="text-gray-400 mt-2">This can be changed any time from Settings.</p>
            <div className="mt-6 space-y-3">
              {['MP4 (Recommended)', 'MP3 (Audio only)', 'MKV (Archive quality)'].map((format, idx) => (
                <label key={format} className={`flex items-center justify-between rounded-xl border px-4 py-3 ${idx === 0 ? 'border-primary/50 bg-primary/10' : 'border-white/10 bg-white/5'}`}>
                  <span className="text-sm text-white">{format}</span>
                  <input type="radio" name="format" defaultChecked={idx === 0} className="accent-primary" />
                </label>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <span className="material-symbols-outlined">check</span>
            </div>
            <h2 className="text-2xl font-bold text-white mt-5">Workspace ready</h2>
            <p className="text-gray-400 mt-2 max-w-sm">You can now create your first batch and monitor all items in queue.</p>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">
          <button onClick={() => step > 1 && setStep((s) => s - 1)} className={`text-sm text-gray-500 hover:text-white ${step === 1 ? 'invisible' : ''}`}>Back</button>
          <Button onClick={handleContinue} className="w-32">{step === 3 ? 'Launch' : 'Continue'}</Button>
        </div>
      </div>
    </div>
  );
};
