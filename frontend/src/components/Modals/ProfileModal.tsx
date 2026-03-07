import React from 'react';

interface ProfileModalProps {
  onClose: () => void;
  user?: { email?: string } | null;
}

export function ProfileModal({ onClose, user }: ProfileModalProps) {
  const email = user?.email ?? '';
  const name = email ? email.split('@')[0] : '';
  const initials = name ? name.slice(0, 2).toUpperCase() : '—';

  return (
    <div className="flex flex-col h-full max-h-[80vh]">
      <div className="p-6 flex flex-col gap-8 overflow-y-auto">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-app-primary/20 flex items-center justify-center text-app-primary text-2xl font-medium border border-app-primary/30">
            {initials}
          </div>
          <div className="flex flex-col">
            <h3 className="text-xl font-medium text-white">{name || 'Account'}</h3>
            <p className="text-sm text-app-muted">{email || '—'}</p>
            <button type="button" className="text-xs font-medium text-app-primary hover:text-app-primary-hover transition-colors mt-2 w-fit">
              Change Avatar
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-app-muted uppercase tracking-wider">Full Name</label>
            <input
              type="text"
              defaultValue={name}
              className="w-full bg-black/40 border border-app-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-app-primary/50 text-white transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-app-muted uppercase tracking-wider">Email Address</label>
            <input
              type="email"
              defaultValue={email}
              className="w-full bg-black/40 border border-app-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-app-primary/50 text-white transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-app-muted uppercase tracking-wider">Password</label>
            <button type="button" className="w-full bg-white/5 hover:bg-white/10 border border-app-border rounded-xl px-4 py-3 text-sm text-left text-white transition-colors">
              Change Password...
            </button>
          </div>
        </div>
      </div>

      <div className="mt-auto border-t border-app-border bg-black/40 p-4 flex items-center justify-end gap-3">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-app-muted hover:text-white transition-colors">
          Cancel
        </button>
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium bg-app-primary hover:bg-app-primary-hover text-white rounded-lg transition-all hover:shadow-[0_0_15px_rgba(225,29,72,0.4)]">
          Save Changes
        </button>
      </div>
    </div>
  );
}
