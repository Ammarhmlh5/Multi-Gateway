import { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Network,
  Plus,
  RefreshCw,
  Server,
  Inbox,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import type { Gateway, StatsResponse } from '../lib/types';
import { Badge, Button, Card, Input, Spinner } from '../components/ui';
import LogViewer from '../components/LogViewer';

type Tab = 'overview' | 'gateways' | 'logs';

export default function Dashboard() {
  const { logout } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingGateways, setLoadingGateways] = useState(true);
  const [statsError, setStatsError] = useState('');

  // Gateway manager form state
  const [gwName, setGwName] = useState('');
  const [gwSlug, setGwSlug] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [createdName, setCreatedName] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    setStatsError('');
    try {
      const s = await api.getStats();
      setStats(s);
    } catch (err) {
      setStatsError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const fetchGateways = useCallback(async () => {
    setLoadingGateways(true);
    try {
      const g = await api.getGateways();
      setGateways(g);
    } catch {
      // errors surface via stats / form; list silently retries on refresh
    } finally {
      setLoadingGateways(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchGateways();
  }, [fetchStats, fetchGateways]);

  const refreshAll = useCallback(() => {
    fetchStats();
    fetchGateways();
  }, [fetchStats, fetchGateways]);

  async function handleCreateGateway(e: React.FormEvent) {
    e.preventDefault();
    setCreateError('');
    setCreatedKey(null);
    setCreatedName(null);
    if (!gwName.trim() || !gwSlug.trim()) {
      setCreateError('Both name and slug are required.');
      return;
    }
    setCreating(true);
    try {
      const gw = await api.createGateway(gwName.trim(), gwSlug.trim().toLowerCase());
      setCreatedKey(gw.api_key);
      setCreatedName(gw.name);
      setGwName('');
      setGwSlug('');
      fetchGateways();
      fetchStats();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create gateway');
    } finally {
      setCreating(false);
    }
  }

  const navItems: { id: Tab; label: string; icon: typeof Network }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'gateways', label: 'Gateway Manager', icon: Server },
    { id: 'logs', label: 'Live Log Viewer', icon: ListChecks },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600 shadow-sm">
              <Network className="h-5 w-5 text-white" strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">Telecom Suite</h1>
              <p className="text-xs text-slate-500">Multi-Gateway Console</p>
            </div>
          </div>
          <Button variant="ghost" onClick={logout} className="text-slate-600">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:px-8">
        {/* Sidebar */}
        <nav className="flex gap-2 lg:w-56 lg:flex-shrink-0 lg:flex-col">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex flex-1 items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors lg:flex-none ${
                tab === id
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              <Icon className="h-4.5 w-4.5 flex-shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        {/* Main content */}
        <main className="flex-1 space-y-6">
          {tab === 'overview' && (
            <OverviewTab
              stats={stats}
              loading={loadingStats}
              error={statsError}
              onRefresh={refreshAll}
            />
          )}

          {tab === 'gateways' && (
            <GatewaysTab
              gateways={gateways}
              loading={loadingGateways}
              onRefresh={refreshAll}
              gwName={gwName}
              gwSlug={gwSlug}
              setGwName={setGwName}
              setGwSlug={setGwSlug}
              creating={creating}
              createError={createError}
              createdKey={createdKey}
              createdName={createdName}
              onCreate={handleCreateGateway}
            />
          )}

          {tab === 'logs' && <LogViewer gateways={gateways} />}
        </main>
      </div>
    </div>
  );
}

function OverviewTab({
  stats,
  loading,
  error,
  onRefresh,
}: {
  stats: StatsResponse | null;
  loading: boolean;
  error: string;
  onRefresh: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Dashboard Overview</h2>
          <p className="text-sm text-slate-500">
            Live counters pulled from the database
          </p>
        </div>
        <Button variant="secondary" onClick={onRefresh} loading={loading}>
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </Card>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <StatCard
          icon={<Network className="h-6 w-6" />}
          label="Total Active Gateways"
          value={stats?.total_gateways}
          loading={loading}
          accent="teal"
        />
        <StatCard
          icon={<Inbox className="h-6 w-6" />}
          label="Total Logs Across Database"
          value={stats?.total_logs}
          loading={loading}
          accent="blue"
        />
      </div>

      <Card className="p-5">
        <div className="flex items-center gap-2 text-slate-700">
          <Activity className="h-5 w-5 text-teal-600" />
          <h3 className="font-semibold">How it works</h3>
        </div>
        <ol className="mt-3 space-y-2 text-sm text-slate-600">
          <li>
            1. Create a gateway in <strong>Gateway Manager</strong> — this
            provisions a dedicated log table in the database.
          </li>
          <li>
            2. Send SMS into a gateway via{' '}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
              POST /api/v1/gateway/&lt;slug&gt;/sms/send
            </code>{' '}
            with the gateway's <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">X-API-KEY</code>.
          </li>
          <li>
            3. Inspect per-gateway records in the{' '}
            <strong>Live Log Viewer</strong>.
          </li>
        </ol>
      </Card>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  loading,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value?: number;
  loading: boolean;
  accent: 'teal' | 'blue';
}) {
  const accents = {
    teal: 'bg-teal-50 text-teal-600 ring-teal-600/10',
    blue: 'bg-sky-50 text-sky-600 ring-sky-600/10',
  };
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ring-1 ring-inset ${accents[accent]}`}
        >
          {icon}
        </div>
        {loading && <Spinner className="h-5 w-5" />}
      </div>
      <p className="mt-4 text-3xl font-bold text-slate-900">
        {loading ? '—' : value ?? 0}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-500">{label}</p>
    </Card>
  );
}

function GatewaysTab({
  gateways,
  loading,
  onRefresh,
  gwName,
  gwSlug,
  setGwName,
  setGwSlug,
  creating,
  createError,
  createdKey,
  createdName,
  onCreate,
}: {
  gateways: Gateway[];
  loading: boolean;
  onRefresh: () => void;
  gwName: string;
  gwSlug: string;
  setGwName: (v: string) => void;
  setGwSlug: (v: string) => void;
  creating: boolean;
  createError: string;
  createdKey: string | null;
  createdName: string | null;
  onCreate: (e: React.FormEvent) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Gateway Manager</h2>
          <p className="text-sm text-slate-500">
            Create gateways and view their credentials
          </p>
        </div>
        <Button variant="secondary" onClick={onRefresh} loading={loading}>
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Create form */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center gap-2 text-slate-700">
            <Plus className="h-5 w-5 text-teal-600" />
            <h3 className="font-semibold">Create New Gateway</h3>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            A dedicated log table is created automatically in the database.
          </p>
          <form onSubmit={onCreate} className="mt-4 space-y-4">
            <Input
              id="gw-name"
              label="Gateway Name"
              value={gwName}
              onChange={(e) => setGwName(e.target.value)}
              placeholder="e.g. STC Pay Gateway"
              required
            />
            <Input
              id="gw-slug"
              label="Slug (URL-safe, lowercase)"
              value={gwSlug}
              onChange={(e) => setGwSlug(e.target.value.toLowerCase())}
              placeholder="e.g. stc_pay"
              required
            />
            <p className="text-xs text-slate-500">
              Only lowercase letters, numbers, and underscores. The log table
              will be named{' '}
              <code className="rounded bg-slate-100 px-1 py-0.5">
                gw_table_{gwSlug || '<slug>'}_logs
              </code>
              .
            </p>

            {createError && (
              <p className="text-sm text-red-600">{createError}</p>
            )}

            <Button type="submit" loading={creating} className="w-full">
              <Plus className="h-4 w-4" />
              <span>Create Gateway</span>
            </Button>
          </form>

          {createdKey && (
            <div className="mt-5 rounded-lg border border-teal-200 bg-teal-50 p-4">
              <p className="text-sm font-semibold text-teal-800">
                Gateway "{createdName}" created successfully
              </p>
              <p className="mt-2 text-xs text-teal-700">API Key:</p>
              <code className="mt-1 block break-all rounded bg-white px-2 py-1.5 text-xs text-slate-800 ring-1 ring-teal-200">
                {createdKey}
              </code>
              <p className="mt-2 text-xs text-teal-700">
                Use this key in the <code>X-API-KEY</code> header to send SMS.
              </p>
            </div>
          )}
        </Card>

        {/* Gateways list */}
        <Card className="lg:col-span-3">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h3 className="font-semibold text-slate-700">Existing Gateways</h3>
            <Badge color="teal">{gateways.length} total</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Slug</th>
                  <th className="px-5 py-3 font-medium">API Key</th>
                  <th className="px-5 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center">
                      <Spinner className="mx-auto" />
                    </td>
                  </tr>
                ) : gateways.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-slate-400">
                      No gateways yet. Create one using the form.
                    </td>
                  </tr>
                ) : (
                  gateways.map((gw) => (
                    <tr key={gw.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3 font-medium text-slate-800">
                        {gw.name}
                      </td>
                      <td className="px-5 py-3">
                        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700">
                          {gw.slug}
                        </code>
                      </td>
                      <td className="px-5 py-3">
                        <code className="text-xs text-slate-500">
                          {gw.api_key.slice(0, 14)}…
                        </code>
                      </td>
                      <td className="px-5 py-3 text-slate-500">
                        {new Date(gw.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
