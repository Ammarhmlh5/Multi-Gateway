import { RefreshCw } from 'lucide-react';
import type { InternalRoute, TelecomGateway } from '../lib/types';
import { Badge, Button, Card, Spinner } from '../components/ui';
import { InternalRouteForm } from '../components/gateways/InternalRouteForm';

interface InternalRoutesPageProps {
  routes: InternalRoute[];
  telecomGateways: TelecomGateway[];
  loading: boolean;
  onRefresh: () => void;
  onChanged: () => void;
}

export function InternalRoutesPage({
  routes,
  telecomGateways,
  loading,
  onRefresh,
  onChanged,
}: InternalRoutesPageProps) {
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
        <InternalRouteForm telecomGateways={telecomGateways} onCreated={onChanged} />

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
