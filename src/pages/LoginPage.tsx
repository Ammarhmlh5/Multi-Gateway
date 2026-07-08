import { useState, type FormEvent } from 'react';
import { Network, LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { Button, Input } from '../components/ui';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(13,148,136,0.25), transparent 45%), radial-gradient(circle at 80% 80%, rgba(2,132,199,0.18), transparent 45%)',
        }}
      />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-600 shadow-lg shadow-teal-600/30">
            <Network className="h-7 w-7 text-white" strokeWidth={2.2} />
          </div>
          <h1 className="text-2xl font-bold text-white">Telecom Suite</h1>
          <p className="mt-1 text-sm text-slate-400">
            Multi-Gateway Administration Console
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur">
          <div className="mb-6 flex items-center gap-2 text-slate-200">
            <LogIn className="h-5 w-5 text-teal-400" />
            <h2 className="text-lg font-semibold">Admin Sign In</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="username"
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              autoComplete="username"
              required
            />
            <Input
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-800/60 bg-red-950/40 px-3 py-2.5 text-sm text-red-300">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full">
              <span>{loading ? 'Signing in…' : 'Sign In'}</span>
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            Use your admin email and password to sign in
          </p>
        </div>
      </div>
    </div>
  );
}
