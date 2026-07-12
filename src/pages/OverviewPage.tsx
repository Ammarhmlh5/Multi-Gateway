import { Activity, Inbox, Radio, RefreshCw, Server } from 'lucide-react';
import type { StatsResponse } from '../lib/types';
import { Button, Card } from '../components/ui';
import { StatCard } from '../components/StatCard';

interface OverviewPageProps {
  stats: StatsResponse | null;
  loading: boolean;
  error: string;
  onRefresh: () => void;
}

export function OverviewPage({
  stats,
  loading,
  error,
  onRefresh,
}: OverviewPageProps) {
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
