import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import type { UserRow } from '../lib/types';

interface UsersResponse {
  data: UserRow[];
  meta: { page: number; limit: number; total: number };
}

export function UsersPage() {
  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page') ?? '1');
  const limit = Number(params.get('limit') ?? '20');
  const search = params.get('search') ?? '';

  const [q, setQ] = useState(search);
  const [res, setRes] = useState<UsersResponse | null>(null);

  useEffect(() => {
    apiFetch<UsersResponse>(`/admin-api/users?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`)
      .then(setRes)
      .catch(() => setRes(null));
  }, [page, limit, search]);

  const totalPages = res ? Math.max(1, Math.ceil(res.meta.total / res.meta.limit)) : 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Users</h1>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setParams({ page: '1', limit: String(limit), search: q });
          }}
        >
          <input className="input w-64" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search email or exact id" />
          <button className="btn-red">Search</button>
        </form>
      </div>

      <div className="table-wrap glass">
        <table className="table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Plan</th>
              <th>Disabled</th>
              <th>Last Used</th>
              <th>Month Items</th>
              <th>Month Bandwidth</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {res?.data.map((u) => (
              <tr key={u.id}>
                <td>
                  <Link className="text-red-400 hover:underline" to={`/users/${u.id}`}>{u.email}</Link>
                </td>
                <td>{u.plan}</td>
                <td>{u.disabled ? 'yes' : 'no'}</td>
                <td>{u.last_used_at ? new Date(u.last_used_at).toLocaleString() : '—'}</td>
                <td>{u.month_items_processed}</td>
                <td>{u.month_bandwidth_bytes}</td>
                <td>{new Date(u.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          className="btn-muted"
          disabled={page <= 1}
          onClick={() => setParams({ page: String(page - 1), limit: String(limit), search })}
        >
          Prev
        </button>
        <span className="text-sm text-gray-400">{page} / {totalPages}</span>
        <button
          className="btn-muted"
          disabled={page >= totalPages}
          onClick={() => setParams({ page: String(page + 1), limit: String(limit), search })}
        >
          Next
        </button>
      </div>
    </div>
  );
}
