import React, { useState } from 'react';
import { GlassInput } from '../components/GlassInput';
import { Button } from '../components/Button';
import { ViewState } from '../types';

interface LoginScreenProps {
  onNavigate: (view: ViewState) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate('dashboard');
  };

  return (
    <div className="w-full max-w-[440px] glass-card rounded-2xl p-8 sm:p-10 transform transition-all animate-in fade-in zoom-in duration-300">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Welcome back</h1>
        <p className="text-gray-400 text-sm">Enter your credentials to access your workspace.</p>
      </div>

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
        
        <div>
          <GlassInput 
            id="password"
            label="Password"
            icon="lock"
            isPassword
            placeholder="Enter your password"
            required
          />
          <div className="flex justify-end mt-2">
            <a href="#" className="text-xs text-gray-500 hover:text-primary transition-colors">Forgot password?</a>
          </div>
        </div>

        <Button type="submit" fullWidth icon="login">
          Sign In
        </Button>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-white/10"></div>
          <span className="flex-shrink-0 mx-4 text-gray-500 text-xs">Or continue with</span>
          <div className="flex-grow border-t border-white/10"></div>
        </div>

        <Button type="button" variant="google" fullWidth>
          Log in with Google
        </Button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-400">
          Don't have an account?{' '}
          <button 
            onClick={() => onNavigate('signup')} 
            className="text-primary hover:text-red-400 font-medium transition-colors"
          >
            Create account
          </button>
        </p>
      </div>
    </div>
  );
};