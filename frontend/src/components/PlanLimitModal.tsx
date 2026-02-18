import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Translations } from '../types';

interface PlanLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  t: Translations;
}

export const PlanLimitModal: React.FC<PlanLimitModalProps> = ({ isOpen, onClose, t }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md bg-[#111118] border border-white/5 rounded-2xl shadow-xl p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
          <h2 className="text-lg sm:text-xl font-bold text-white">{t.failed}</h2>
        </div>
        <p className="text-sm text-gray-400 mb-6">{t.freeBatchLimitMessage}</p>
        <button
          onClick={onClose}
          className="w-full py-2.5 sm:py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold text-sm transition-colors"
        >
          {t.close}
        </button>
      </div>
    </div>
  );
};
