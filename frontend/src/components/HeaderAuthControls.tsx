import React, { useState } from 'react';
import { AuthUser, Translations } from '../types';
import { AppLink } from '../lib/simpleRouter';

interface HeaderAuthControlsProps {
  user: AuthUser | null;
  t: Translations;
  onLogout: () => void;
}

export const HeaderAuthControls: React.FC<HeaderAuthControlsProps> = ({ user, t, onLogout }) => {
  const [open, setOpen] = useState(false);

  if (!user) {
    return (
      <div className="hidden sm:flex items-center gap-2">
        <AppLink
          to="/login"
          className="px-3 py-1.5 text-xs font-semibold rounded-full border border-white/10 text-neutral-200 hover:border-primary hover:text-white transition-colors"
        >
          {t.login}
        </AppLink>
        <AppLink
          to="/signup"
          className="px-3 py-1.5 text-xs font-semibold rounded-full bg-primary text-white hover:bg-red-600 transition-colors"
        >
          {t.getStarted}
        </AppLink>
      </div>
    );
  }

  const initial = user.email ? user.email[0].toUpperCase() : 'U';

  return (
    <div className="hidden sm:block relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-8 h-8 rounded-full bg-white/10 border border-white/15 text-sm font-bold text-white hover:border-primary transition-colors"
      >
        {initial}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 min-w-[180px] rounded-xl border border-white/10 bg-[#0b0b10] p-1.5 shadow-xl z-30">
          <AppLink
            to="/profile"
            className="block w-full px-3 py-2 rounded-lg text-sm text-neutral-200 hover:bg-white/5 transition-colors"
            onClick={() => setOpen(false)}
          >
            {t.profile}
          </AppLink>
          <AppLink
            to="/account"
            className="block w-full px-3 py-2 rounded-lg text-sm text-neutral-200 hover:bg-white/5 transition-colors"
            onClick={() => setOpen(false)}
          >
            {t.billing}
          </AppLink>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-neutral-300 hover:bg-white/5 transition-colors"
          >
            {t.logout}
          </button>
        </div>
      )}
    </div>
  );
};
