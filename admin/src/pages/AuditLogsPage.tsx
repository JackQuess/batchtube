import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

interface AuditRow {
  id: string;
  user_id: string | null;
  action: string;
  resource_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface AuditResponse {
  data: AuditRow[];
  meta: { page: number; limit: number; total: number };
}

export function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [action, setAction] = useState('');
  const [userId, setUserId] = useState('');
  const [rows, setRows] = useState<AuditResponse | null>(null);

  const fetchLogs = () => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (action) params.set('action', action);
    if (userId) params.set('user_id', userId);

    apiFetch<AuditResponse>(`/admin-api/audit-logs?${params.toString()}`)
      .then(setRows)
      .catch(() => setRows(null));
  };

  useEffect(fetchLogs, [page]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Audit Logs</h1>
        <div className="flex gap-2">
          <input className="input" placeholder="action" value={action} onChange={(e) => setAction(e.target.value)} />
          <input className="input" placeholder="user_id" value={userId} onChange={(e) => setUserId(e.target.value)} />
          <button className="btn-red" onClick={() => { setPage(1); fetchLogs(); }}>Filter</button>
        </div>
      </div>

      <div className="table-wrap glass">
        <table className="table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Action</th>
              <th>User</th>
              <th>Resource</th>
              <th>IP</th>
              <th>User Agent</th>
            </tr>
          </thead>
          <tbody>
            {rows?.data.map((r) => (
              <tr key={r.id}>
                <td>{new Date(r.created_at).toLocaleString()}</td>
                <td>{r.action}</td>
                <td>{r.user_id ?? '—'}</td>
                <td>{r.resource_id ?? '—'}</td>
                <td>{r.ip_address ?? '—'}</td>
                <td className="max-w-xs truncate">{r.user_agent ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button className="btn-muted" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
        <span className="text-sm text-gray-400">Page {page}</span>
        <button className="btn-muted" onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>
    </div>
  );
}
