import React, { useState } from 'react';
import { GlassInput } from '../components/GlassInput';
import { Button } from '../components/Button';
import { ViewState } from '../types';

interface SignUpScreenProps {
  onNavigate: (view: ViewState) => void;
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTimeout(() => onNavigate('onboarding'), 500);
  };

  return (
    <div className="w-full max-w-[440px] glass-card rounded-2xl p-8 sm:p-10 transform transition-all animate-in fade-in zoom-in duration-300 border border-white/10 shadow-2xl shadow-black/50">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Create your account</h1>
        <p className="text-gray-400 text-sm">Start your professional workflow today.</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        
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

        <div className="space-y-1.5">
          <GlassInput 
            id="password"
            label="Password"
            icon="lock"
            isPassword
            placeholder="Minimum 8 characters"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <GlassInput 
            id="confirm-password"
            label="Confirm Password"
            icon="lock_reset"
            isPassword
            placeholder="Confirm your password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <Button type="submit" fullWidth icon="arrow_forward">
          Create Account
        </Button>

        {/* Divider */}
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-white/10"></div>
          <span className="flex-shrink-0 mx-4 text-gray-500 text-xs">Or continue with</span>
          <div className="flex-grow border-t border-white/10"></div>
        </div>

        <Button type="button" variant="google" fullWidth>
          Continue with Google
        </Button>
      </form>

      {/* Footer Links */}
      <div className="mt-8 text-center space-y-4">
        <p className="text-sm text-gray-400">
          Already have an account?{' '}
          <button 
            onClick={() => onNavigate('login')} 
            className="text-primary hover:text-red-400 font-medium transition-colors"
          >
            Log in
          </button>
        </p>
        <p className="text-xs text-gray-600 leading-relaxed px-4">
          By clicking create account, you agree to our{' '}
          <button onClick={() => onNavigate('legal')} className="hover:text-gray-400 underline decoration-gray-700">Terms</button> and{' '}
          <button onClick={() => onNavigate('legal')} className="hover:text-gray-400 underline decoration-gray-700">Privacy Policy</button>.
        </p>
      </div>
    </div>
  );
};