import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

interface Kpis {
  total_users: number;
  active_users_days: number;
  total_batches_days: number;
  total_items_days: number;
  bandwidth_days_bytes: number;
}

export function DashboardPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Kpis | null>(null);

  useEffect(() => {
    apiFetch<Kpis>(`/admin-api/kpis?days=${days}`).then(setData).catch(() => setData(null));
  }, [days]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">KPIs</h1>
        <select className="input max-w-32" value={days} onChange={(e) => setDays(Number(e.target.value))}>
          <option value={7}>7 days</option>
          <option value={30}>30 days</option>
          <option value={90}>90 days</option>
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card title="Total Users" value={data?.total_users} />
        <Card title="Active Users" value={data?.active_users_days} />
        <Card title="Batches" value={data?.total_batches_days} />
        <Card title="Items" value={data?.total_items_days} />
        <Card title="Bandwidth (bytes)" value={data?.bandwidth_days_bytes} />
      </div>
    </div>
  );
}

function Card({ title, value }: { title: string; value?: number }) {
  return (
    <div className="glass rounded-xl p-4">
      <p className="text-xs uppercase tracking-wide text-gray-400">{title}</p>
      <p className="mt-2 text-2xl font-semibold">{value ?? '—'}</p>
    </div>
  );
}
