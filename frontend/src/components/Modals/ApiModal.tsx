import React, { useCallback, useEffect, useState } from 'react';
import { Code, Copy, Check, Plus, Trash2, Loader2 } from 'lucide-react';
import { accountAPI } from '../../services/accountAPI';
import { apiKeysAPI, type ApiKeyRow, type CreateApiKeyResponse } from '../../services/apiKeysAPI';

interface ApiModalProps {
  onClose: () => void;
}

const STUDIO_PLANS = new Set(['archivist', 'enterprise']);

export function ApiModal({ onClose }: ApiModalProps) {
  const [plan, setPlan] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [newKey, setNewKey] = useState<CreateApiKeyResponse | null>(null);
  const [creating, setCreating] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const hasStudio = plan !== null && (STUDIO_PLANS.has(plan) || isAdmin);

  const loadPlan = useCallback(async () => {
    try {
      const usage = await accountAPI.getUsage();
      setPlan(usage.plan);
      setIsAdmin(usage.is_admin === true);
    } catch {
      setPlan('free');
      setIsAdmin(false);
    } finally {
      setLoadingPlan(false);
    }
  }, []);

  const loadKeys = useCallback(async () => {
    if (!hasStudio) return;
    setLoadingKeys(true);
    try {
      const data = await apiKeysAPI.list();
      setKeys(data);
    } catch {
      setKeys([]);
    } finally {
      setLoadingKeys(false);
    }
  }, [hasStudio]);

  useEffect(() => {
    void loadPlan();
  }, [loadPlan]);

  useEffect(() => {
    if (hasStudio) void loadKeys();
  }, [hasStudio, loadKeys]);

  const handleCreateKey = async () => {
    setCreating(true);
    setNewKey(null);
    try {
      const created = await apiKeysAPI.create('API Key');
      setNewKey(created);
      setKeys((prev) => [{ id: created.id, key_prefix: 'bt_live_…', name: 'API Key', created_at: created.created_at, last_used_at: null }, ...prev]);
    } catch {
      // error could be shown in UI
    } finally {
      setCreating(false);
    }
  };

  const handleCopyNewKey = () => {
    if (newKey?.key) {
      navigator.clipboard.writeText(newKey.key);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const handleRevoke = async (id: string) => {
    setRevokingId(id);
    try {
      await apiKeysAPI.revoke(id);
      setKeys((prev) => prev.filter((k) => k.id !== id));
      if (newKey?.id === id) setNewKey(null);
    } finally {
      setRevokingId(null);
    }
  };

  if (loadingPlan) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 text-app-primary animate-spin" />
      </div>
    );
  }

  if (!hasStudio) {
    return (
      <div className="flex flex-col h-full max-h-[80vh]">
        <div className="p-6 flex flex-col gap-6 overflow-y-auto">
          <div className="p-4 rounded-xl bg-app-primary/10 border border-app-primary/20 flex items-start gap-3">
            <Code className="w-5 h-5 text-app-primary shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <h4 className="text-sm font-medium text-app-primary">Developer API (Studio)</h4>
              <p className="text-xs text-app-primary/80 leading-relaxed">
                API keys are available on Archivist and Enterprise plans only. Upgrade to create keys and integrate with your apps.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-auto border-t border-app-border bg-black/40 p-4 flex justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium bg-app-primary hover:bg-app-primary-hover text-white rounded-lg">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-[80vh]">
      <div className="p-6 flex flex-col gap-6 overflow-y-auto">
        <div className="p-4 rounded-xl bg-app-primary/10 border border-app-primary/20 flex items-start gap-3">
          <Code className="w-5 h-5 text-app-primary shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <h4 className="text-sm font-medium text-app-primary">API Keys</h4>
            <p className="text-xs text-app-primary/80 leading-relaxed">
              Create keys to authenticate API requests. Keep your secret key private. You won't see the full key again after creation.
            </p>
          </div>
        </div>

        {newKey && (
          <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex flex-col gap-2">
            <p className="text-xs font-medium text-emerald-400">New key created — copy it now. You won't see it again.</p>
            <div className="flex gap-2">
              <input
                type="password"
                value={newKey.key}
                readOnly
                className="flex-1 bg-black/40 border border-app-border rounded-xl px-4 py-3 text-sm text-app-muted font-mono"
              />
              <button
                type="button"
                onClick={handleCopyNewKey}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-app-border rounded-xl text-sm font-medium text-white flex items-center gap-2"
              >
                {copiedKey ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                Copy
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-app-muted uppercase tracking-wider">Your keys</label>
            <button
              type="button"
              onClick={handleCreateKey}
              disabled={creating}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-app-primary/20 hover:bg-app-primary/30 text-app-primary text-sm font-medium disabled:opacity-50"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create key
            </button>
          </div>
          {loadingKeys ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-app-primary animate-spin" />
            </div>
          ) : keys.length === 0 ? (
            <p className="text-sm text-app-muted py-4">No API keys yet. Create one to get started.</p>
          ) : (
            <ul className="space-y-2">
              {keys.map((key) => (
                <li
                  key={key.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-app-border bg-white/5"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-white font-mono">{key.key_prefix}••••••••</span>
                    <span className="text-xs text-app-muted">
                      Created {new Date(key.created_at).toLocaleString()}
                      {key.last_used_at ? ` · Last used ${new Date(key.last_used_at).toLocaleString()}` : ''}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRevoke(key.id)}
                    disabled={revokingId === key.id}
                    className="p-2 rounded-lg text-red-400 hover:bg-red-500/20 disabled:opacity-50"
                    title="Revoke key"
                  >
                    {revokingId === key.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-1.5 pt-2 border-t border-app-border">
          <label className="text-xs font-medium text-app-muted uppercase tracking-wider">Webhook URL</label>
          <input
            type="url"
            placeholder="https://your-domain.com/webhook"
            readOnly
            className="w-full bg-black/40 border border-app-border rounded-xl px-4 py-3 text-sm text-app-muted placeholder:text-app-muted/50 cursor-not-allowed"
          />
          <p className="text-xs text-app-muted">
            Webhook URL configuration is not yet available. We'll send POST requests here when batches complete. (Coming soon.)
          </p>
        </div>
      </div>

      <div className="mt-auto border-t border-app-border bg-black/40 p-4 flex justify-end">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium bg-app-primary hover:bg-app-primary-hover text-white rounded-lg">
          Close
        </button>
      </div>
    </div>
  );
}
