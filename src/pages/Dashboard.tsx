import { useState } from 'react';
import { useDashboardData } from '../hooks/useDashboardData';
import {
  DashboardLayout,
  type PageKey,
} from '../components/layout/DashboardLayout';
import { OverviewPage } from './OverviewPage';
import { TelecomGatewaysPage } from './TelecomGatewaysPage';
import { InternalRoutesPage } from './InternalRoutesPage';
import { LogsPage } from './LogsPage';

export default function Dashboard() {
  const [page, setPage] = useState<PageKey>('overview');
  const {
    stats,
    telecomGateways,
    internalRoutes,
    loadingStats,
    loadingTG,
    loadingIR,
    statsError,
    refreshAll,
  } = useDashboardData();

  return (
    <DashboardLayout activePage={page} onNavigate={setPage}>
      {page === 'overview' && (
        <OverviewPage
          stats={stats}
          loading={loadingStats}
          error={statsError}
          onRefresh={refreshAll}
        />
      )}

      {page === 'telecom' && (
        <TelecomGatewaysPage
          gateways={telecomGateways}
          loading={loadingTG}
          onRefresh={refreshAll}
          onChanged={refreshAll}
        />
      )}

      {page === 'routes' && (
        <InternalRoutesPage
          routes={internalRoutes}
          telecomGateways={telecomGateways}
          loading={loadingIR}
          onRefresh={refreshAll}
          onChanged={refreshAll}
        />
      )}

      {page === 'logs' && <LogsPage routes={internalRoutes} />}
    </DashboardLayout>
  );
}
