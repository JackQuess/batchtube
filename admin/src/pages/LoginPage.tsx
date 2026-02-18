import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, RequestError } from '../lib/api';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiFetch<{ ok: boolean }>('/admin-api/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      navigate('/dashboard');
    } catch (err) {
      if (err instanceof RequestError) setError(err.message);
      else setError('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={onSubmit} className="glass w-full max-w-md rounded-2xl p-6">
        <h1 className="mb-1 text-2xl font-semibold">Admin Login</h1>
        <p className="mb-6 text-sm text-gray-400">Owner access only</p>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-gray-300">Email</label>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-300">Password</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
        </div>

        {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}

        <button disabled={loading} className="btn-red mt-6 w-full">
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
