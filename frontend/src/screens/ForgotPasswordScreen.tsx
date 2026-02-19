import React, { useState } from 'react';
import { GlassInput } from '../components/GlassInput';
import { Button } from '../components/Button';
import { ViewState } from '../types';
import { sendResetForEmail } from '../lib/auth';

interface ForgotPasswordScreenProps {
  onNavigate: (view: ViewState) => void;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const exists = sendResetForEmail(email);
      if (!exists) {
        setError('Bu e-posta ile kayıtlı hesap bulunamadı.');
        return;
      }
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="w-full max-w-[440px] glass-card rounded-2xl p-8 sm:p-10 transform transition-all animate-in fade-in zoom-in duration-300 text-center">
        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-3xl">mark_email_read</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Reset ready</h1>
        <p className="text-gray-400 text-sm mb-8">
          <span className="text-white font-medium">{email}</span> için şifre sıfırlama isteği alındı. Şu an demo akışta mail göndermiyoruz.
        </p>
        <Button variant="secondary" fullWidth onClick={() => onNavigate('login')}>
          Back to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[440px] glass-card rounded-2xl p-8 sm:p-10 transform transition-all animate-in fade-in zoom-in duration-300">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Reset Password</h1>
        <p className="text-gray-400 text-sm">Enter your email to receive reset instructions.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <GlassInput
          id="email"
          label="Email Address"
          icon="mail"
          type="email"
          placeholder="name@company.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {error && <p className="text-xs text-red-400">{error}</p>}

        <Button type="submit" fullWidth icon="send" disabled={loading}>
          {loading ? 'Sending...' : 'Send Reset Link'}
        </Button>
      </form>

      <div className="mt-8 text-center">
        <button onClick={() => onNavigate('login')} className="text-sm text-gray-500 hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to Login
        </button>
      </div>
    </div>
  );
};
