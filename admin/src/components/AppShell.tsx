import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';

export function AppShell() {
  const navigate = useNavigate();

  const logout = async () => {
    await apiFetch<{ ok: boolean }>('/admin-api/logout', { method: 'POST' });
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <header className="border-b border-white/10 bg-black/40 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/dashboard" className="text-lg font-semibold">BatchTube Admin</Link>
          <button onClick={logout} className="btn-muted">Logout</button>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl grid-cols-12 gap-6 px-6 py-6">
        <aside className="glass col-span-12 rounded-xl p-4 md:col-span-3 lg:col-span-2">
          <nav className="space-y-2 text-sm">
            <NavLink to="/dashboard" className={({ isActive }) => `block rounded-md px-3 py-2 ${isActive ? 'bg-[#ea2a33] text-white' : 'hover:bg-white/10 text-gray-300'}`}>
              Dashboard
            </NavLink>
            <NavLink to="/users" className={({ isActive }) => `block rounded-md px-3 py-2 ${isActive ? 'bg-[#ea2a33] text-white' : 'hover:bg-white/10 text-gray-300'}`}>
              Users
            </NavLink>
            <NavLink to="/audit-logs" className={({ isActive }) => `block rounded-md px-3 py-2 ${isActive ? 'bg-[#ea2a33] text-white' : 'hover:bg-white/10 text-gray-300'}`}>
              Audit Logs
            </NavLink>
          </nav>
        </aside>
        <main className="col-span-12 md:col-span-9 lg:col-span-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
