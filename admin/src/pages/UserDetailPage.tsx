import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiFetch } from '../lib/api';

interface UserDetail {
  user: {
    id: string;
    email: string;
    plan: 'starter' | 'power_user' | 'archivist' | 'enterprise';
    disabled: boolean;
    created_at: string;
    webhook_secret: string | null;
  };
  api_keys: Array<{
    id: string;
    name: string | null;
    key_prefix: string;
    last_used_at: string | null;
    created_at: string;
  }>;
  usage: {
    period_start: string;
    items_processed: number;
    bandwidth_bytes: number;
  };
  recent_batches: Array<{
    id: string;
    name: string | null;
    status: string;
    item_count: number;
    created_at: string;
    completed_at: string | null;
  }>;
}

export function UserDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState<UserDetail | null>(null);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [keyName, setKeyName] = useState('');

  const fetchData = () => {
    if (!id) return;
    apiFetch<UserDetail>(`/admin-api/users/${id}`).then(setData).catch(() => setData(null));
  };

  useEffect(fetchData, [id]);

  const plan = useMemo(() => data?.user.plan ?? 'starter', [data]);

  if (!id) return null;
  if (!data) return <div className="text-gray-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="glass rounded-xl p-4">
        <h1 className="text-xl font-semibold">{data.user.email}</h1>
        <p className="mt-1 text-sm text-gray-400">{data.user.id}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs text-gray-400">Plan</label>
            <select
              className="input"
              value={plan}
              onChange={async (e) => {
                await apiFetch(`/admin-api/users/${id}`, {
                  method: 'PATCH',
                  body: JSON.stringify({ plan: e.target.value })
                });
                fetchData();
              }}
            >
              <option value="starter">starter</option>
              <option value="power_user">power_user</option>
              <option value="archivist">archivist</option>
              <option value="enterprise">enterprise</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-400">Disabled</label>
            <button
              className={data.user.disabled ? 'btn-red w-full' : 'btn-muted w-full'}
              onClick={async () => {
                await apiFetch(`/admin-api/users/${id}`, {
                  method: 'PATCH',
                  body: JSON.stringify({ disabled: !data.user.disabled })
                });
                fetchData();
              }}
            >
              {data.user.disabled ? 'Disabled' : 'Enabled'}
            </button>
          </div>
          <div className="text-sm text-gray-300">
            <p className="text-xs text-gray-400">Created</p>
            <p>{new Date(data.user.created_at).toLocaleString()}</p>
          </div>
          <div className="text-sm text-gray-300">
            <p className="text-xs text-gray-400">Webhook Secret</p>
            <p className="truncate">{data.user.webhook_secret ?? '—'}</p>
          </div>
        </div>
      </div>

      <div className="glass rounded-xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">API Keys</h2>
          <div className="flex gap-2">
            <input className="input" placeholder="Key name (optional)" value={keyName} onChange={(e) => setKeyName(e.target.value)} />
            <button
              className="btn-red"
              onClick={async () => {
                const result = await apiFetch<{ id: string; name: string; key: string; created_at: string }>(`/admin-api/users/${id}/api-keys`, {
                  method: 'POST',
                  body: JSON.stringify({ name: keyName || undefined })
                });
                setNewKey(result.key);
                setKeyName('');
                fetchData();
              }}
            >
              Create key
            </button>
          </div>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Prefix</th>
                <th>Last used</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.api_keys.map((k) => (
                <tr key={k.id}>
                  <td>{k.name ?? '—'}</td>
                  <td>{k.key_prefix}</td>
                  <td>{k.last_used_at ? new Date(k.last_used_at).toLocaleString() : '—'}</td>
                  <td>{new Date(k.created_at).toLocaleString()}</td>
                  <td>
                    <button
                      className="btn-muted"
                      onClick={async () => {
                        await apiFetch(`/admin-api/api-keys/${k.id}`, { method: 'DELETE' });
                        fetchData();
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass rounded-xl p-4">
          <h2 className="text-lg font-semibold">Usage</h2>
          <p className="mt-2 text-sm text-gray-300">Period: {data.usage.period_start}</p>
          <p className="text-sm text-gray-300">Items processed: {data.usage.items_processed}</p>
          <p className="text-sm text-gray-300">Bandwidth bytes: {data.usage.bandwidth_bytes}</p>
        </div>

        <div className="glass rounded-xl p-4">
          <h2 className="text-lg font-semibold">Recent Batches</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {data.recent_batches.map((b) => (
              <li key={b.id} className="rounded-md border border-white/10 bg-white/5 p-2">
                <p className="font-medium">{b.name ?? 'Untitled batch'} ({b.status})</p>
                <p className="text-gray-400">{b.item_count} items • {new Date(b.created_at).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {newKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="glass w-full max-w-xl rounded-xl p-5">
            <h3 className="text-lg font-semibold">API key created</h3>
            <p className="mt-1 text-sm text-gray-400">This key is shown only once.</p>
            <pre className="mt-3 overflow-auto rounded-md border border-white/10 bg-black/50 p-3 text-xs text-red-300">{newKey}</pre>
            <button className="btn-red mt-4" onClick={() => setNewKey(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
