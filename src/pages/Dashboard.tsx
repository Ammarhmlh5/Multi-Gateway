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
  Radio,
  Inbox,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import type {
  InternalRoute,
  StatsResponse,
  TelecomGateway,
} from '../lib/types';
import { Badge, Button, Card, Input, Select, Spinner } from '../components/ui';
import LogViewer from '../components/LogViewer';

type Tab = 'overview' | 'telecom' | 'routes' | 'logs';

export default function Dashboard() {
  const { logout } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [telecomGateways, setTelecomGateways] = useState<TelecomGateway[]>([]);
  const [internalRoutes, setInternalRoutes] = useState<InternalRoute[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingTG, setLoadingTG] = useState(true);
  const [loadingIR, setLoadingIR] = useState(true);
  const [statsError, setStatsError] = useState('');

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    setStatsError('');
    try {
      setStats(await api.getStats());
    } catch (err) {
      setStatsError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const fetchTelecomGateways = useCallback(async () => {
    setLoadingTG(true);
    try {
      setTelecomGateways(await api.getTelecomGateways());
    } catch {
      /* retried on refresh */
    } finally {
      setLoadingTG(false);
    }
  }, []);

  const fetchInternalRoutes = useCallback(async () => {
    setLoadingIR(true);
    try {
      setInternalRoutes(await api.getInternalRoutes());
    } catch {
      /* retried on refresh */
    } finally {
      setLoadingIR(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchTelecomGateways();
    fetchInternalRoutes();
  }, [fetchStats, fetchTelecomGateways, fetchInternalRoutes]);

  const refreshAll = useCallback(() => {
    fetchStats();
    fetchTelecomGateways();
    fetchInternalRoutes();
  }, [fetchStats, fetchTelecomGateways, fetchInternalRoutes]);

  const navItems: { id: Tab; label: string; icon: typeof Network }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'telecom', label: 'Telecom Gateways', icon: Server },
    { id: 'routes', label: 'Internal Routes', icon: Radio },
    { id: 'logs', label: 'Live Log Viewer', icon: ListChecks },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600 shadow-sm">
              <Network className="h-5 w-5 text-white" strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">Telecom Suite</h1>
              <p className="text-xs text-slate-500">Two-Tier Gateway Console</p>
            </div>
          </div>
          <Button variant="ghost" onClick={logout} className="text-slate-600">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:px-8">
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

        <main className="flex-1 space-y-6">
          {tab === 'overview' && (
            <OverviewTab
              stats={stats}
              loading={loadingStats}
              error={statsError}
              onRefresh={refreshAll}
            />
          )}

          {tab === 'telecom' && (
            <TelecomTab
              gateways={telecomGateways}
              loading={loadingTG}
              onRefresh={refreshAll}
              onChanged={refreshAll}
            />
          )}

          {tab === 'routes' && (
            <RoutesTab
              routes={internalRoutes}
              telecomGateways={telecomGateways}
              loading={loadingIR}
              onRefresh={refreshAll}
              onChanged={refreshAll}
            />
          )}

          {tab === 'logs' && <LogViewer routes={internalRoutes} />}
        </main>
      </div>
    </div>
  );
}

// ── Overview ───────────────────────────────────────────────────────────────

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
            Live counters from the two-tier gateway system
          </p>
        </div>
        <Button variant="secondary" onClick={onRefresh} loading={loading}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </Card>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <StatCard
          icon={<Server className="h-6 w-6" />}
          label="Telecom Gateways (L1)"
          value={stats?.total_telecom_gateways}
          loading={loading}
          accent="teal"
        />
        <StatCard
          icon={<Radio className="h-6 w-6" />}
          label="Internal Routes (L2)"
          value={stats?.total_internal_routes}
          loading={loading}
          accent="blue"
        />
        <StatCard
          icon={<Inbox className="h-6 w-6" />}
          label="Total Logs Across DB"
          value={stats?.total_logs}
          loading={loading}
          accent="amber"
        />
      </div>

      <Card className="p-5">
        <div className="flex items-center gap-2 text-slate-700">
          <Activity className="h-5 w-5 text-teal-600" />
          <h3 className="font-semibold">Two-Tier Architecture</h3>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-teal-200 bg-teal-50 p-4">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-teal-600" />
              <h4 className="text-sm font-semibold text-teal-800">
                Level 1 — Telecom Gateways
              </h4>
            </div>
            <p className="mt-2 text-xs text-teal-700">
              Direct connections to telecom companies (e.g. STC, Mobily). These
              are the exit point — messages leave the system through these
              gateways to reach the telecom provider.
            </p>
          </div>
          <div className="rounded-lg border border-sky-200 bg-sky-50 p-4">
            <div className="flex items-center gap-2">
              <Radio className="h-5 w-5 text-sky-600" />
              <h4 className="text-sm font-semibold text-sky-800">
                Level 2 — Internal Routes
              </h4>
            </div>
            <p className="mt-2 text-xs text-sky-700">
              Internal paths linked to a telecom gateway. Each route receives
              messages and forwards them to its assigned Level 1 gateway for
              delivery.
            </p>
          </div>
        </div>
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
  accent: 'teal' | 'blue' | 'amber';
}) {
  const accents = {
    teal: 'bg-teal-50 text-teal-600 ring-teal-600/10',
    blue: 'bg-sky-50 text-sky-600 ring-sky-600/10',
    amber: 'bg-amber-50 text-amber-600 ring-amber-600/10',
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

// ── Telecom Gateways (Level 1) ──────────────────────────────────────────────

function TelecomTab({
  gateways,
  loading,
  onRefresh,
  onChanged,
}: {
  gateways: TelecomGateway[];
  loading: boolean;
  onRefresh: () => void;
  onChanged: () => void;
}) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [provider, setProvider] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [createdName, setCreatedName] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setCreatedKey(null);
    setCreatedName(null);
    if (!name.trim() || !slug.trim() || !provider.trim()) {
      setError('Name, slug, and provider are all required.');
      return;
    }
    setCreating(true);
    try {
      const gw = await api.createTelecomGateway(
        name.trim(),
        slug.trim().toLowerCase(),
        provider.trim(),
      );
      setCreatedKey(gw.api_key);
      setCreatedName(gw.name);
      setName('');
      setSlug('');
      setProvider('');
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create gateway');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Telecom Gateways</h2>
          <p className="text-sm text-slate-500">
            Level 1 — Direct connections to telecom companies
          </p>
        </div>
        <Button variant="secondary" onClick={onRefresh} loading={loading}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center gap-2 text-slate-700">
            <Plus className="h-5 w-5 text-teal-600" />
            <h3 className="font-semibold">Create Telecom Gateway</h3>
          </div>
          <form onSubmit={handleCreate} className="mt-4 space-y-4">
            <Input
              id="tg-name"
              label="Gateway Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. STC Production Gateway"
              required
            />
            <Input
              id="tg-slug"
              label="Slug (lowercase, URL-safe)"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              placeholder="e.g. stc_prod"
              required
            />
            <Input
              id="tg-provider"
              label="Telecom Provider"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              placeholder="e.g. STC"
              required
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" loading={creating} className="w-full">
              <Plus className="h-4 w-4" />
              Create Gateway
            </Button>
          </form>

          {createdKey && (
            <div className="mt-5 rounded-lg border border-teal-200 bg-teal-50 p-4">
              <p className="text-sm font-semibold text-teal-800">
                "{createdName}" created successfully
              </p>
              <p className="mt-2 text-xs text-teal-700">API Key:</p>
              <code className="mt-1 block break-all rounded bg-white px-2 py-1.5 text-xs text-slate-800 ring-1 ring-teal-200">
                {createdKey}
              </code>
            </div>
          )}
        </Card>

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
                  <th className="px-5 py-3 font-medium">Provider</th>
                  <th className="px-5 py-3 font-medium">API Key</th>
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
                      No telecom gateways yet.
                    </td>
                  </tr>
                ) : (
                  gateways.map((gw) => (
                    <tr key={gw.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3 font-medium text-slate-800">{gw.name}</td>
                      <td className="px-5 py-3">
                        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700">
                          {gw.slug}
                        </code>
                      </td>
                      <td className="px-5 py-3">
                        <Badge color="teal">{gw.provider}</Badge>
                      </td>
                      <td className="px-5 py-3">
                        <code className="text-xs text-slate-500">
                          {gw.api_key.slice(0, 14)}…
                        </code>
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

// ── Internal Routes (Level 2) ──────────────────────────────────────────────

function RoutesTab({
  routes,
  telecomGateways,
  loading,
  onRefresh,
  onChanged,
}: {
  routes: InternalRoute[];
  telecomGateways: TelecomGateway[];
  loading: boolean;
  onRefresh: () => void;
  onChanged: () => void;
}) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [tgId, setTgId] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [createdName, setCreatedName] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setCreatedKey(null);
    setCreatedName(null);
    if (!name.trim() || !slug.trim() || !tgId) {
      setError('Name, slug, and telecom gateway are all required.');
      return;
    }
    setCreating(true);
    try {
      const route = await api.createInternalRoute(
        name.trim(),
        slug.trim().toLowerCase(),
        tgId,
      );
      setCreatedKey(route.api_key);
      setCreatedName(route.name);
      setName('');
      setSlug('');
      setTgId('');
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create route');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Internal Routes</h2>
          <p className="text-sm text-slate-500">
            Level 2 — Internal paths linked to telecom gateways
          </p>
        </div>
        <Button variant="secondary" onClick={onRefresh} loading={loading}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center gap-2 text-slate-700">
            <Plus className="h-5 w-5 text-sky-600" />
            <h3 className="font-semibold">Create Internal Route</h3>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            A dedicated log table is created automatically for each route.
          </p>
          <form onSubmit={handleCreate} className="mt-4 space-y-4">
            <Input
              id="ir-name"
              label="Route Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Customer OTP Route"
              required
            />
            <Input
              id="ir-slug"
              label="Slug (lowercase, URL-safe)"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              placeholder="e.g. customer_otp"
              required
            />
            <Select
              id="ir-telecom"
              label="Linked Telecom Gateway"
              value={tgId}
              onChange={(e) => setTgId(e.target.value)}
            >
              <option value="" disabled>
                Select a telecom gateway…
              </option>
              {telecomGateways.map((gw) => (
                <option key={gw.id} value={gw.id}>
                  {gw.name} ({gw.provider})
                </option>
              ))}
            </Select>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" loading={creating} className="w-full">
              <Plus className="h-4 w-4" />
              Create Route
            </Button>
          </form>

          {createdKey && (
            <div className="mt-5 rounded-lg border border-sky-200 bg-sky-50 p-4">
              <p className="text-sm font-semibold text-sky-800">
                "{createdName}" created successfully
              </p>
              <p className="mt-2 text-xs text-sky-700">API Key:</p>
              <code className="mt-1 block break-all rounded bg-white px-2 py-1.5 text-xs text-slate-800 ring-1 ring-sky-200">
                {createdKey}
              </code>
            </div>
          )}
        </Card>

        <Card className="lg:col-span-3">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h3 className="font-semibold text-slate-700">Existing Routes</h3>
            <Badge color="teal">{routes.length} total</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Slug</th>
                  <th className="px-5 py-3 font-medium">Linked Gateway</th>
                  <th className="px-5 py-3 font-medium">API Key</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center">
                      <Spinner className="mx-auto" />
                    </td>
                  </tr>
                ) : routes.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-slate-400">
                      No internal routes yet.
                    </td>
                  </tr>
                ) : (
                  routes.map((route) => (
                    <tr key={route.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3 font-medium text-slate-800">
                        {route.name}
                      </td>
                      <td className="px-5 py-3">
                        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700">
                          {route.slug}
                        </code>
                      </td>
                      <td className="px-5 py-3">
                        <Badge color="blue">{route.telecom_gateway_name}</Badge>
                      </td>
                      <td className="px-5 py-3">
                        <code className="text-xs text-slate-500">
                          {route.api_key.slice(0, 14)}…
                        </code>
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
