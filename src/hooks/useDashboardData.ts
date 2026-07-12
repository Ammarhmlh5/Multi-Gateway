import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import type {
  InternalRoute,
  StatsResponse,
  TelecomGateway,
} from '../lib/types';

interface DashboardData {
  stats: StatsResponse | null;
  telecomGateways: TelecomGateway[];
  internalRoutes: InternalRoute[];
  loadingStats: boolean;
  loadingTG: boolean;
  loadingIR: boolean;
  statsError: string;
  refreshAll: () => void;
  refreshStats: () => void;
  refreshTelecom: () => void;
  refreshRoutes: () => void;
}

export function useDashboardData(): DashboardData {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [telecomGateways, setTelecomGateways] = useState<TelecomGateway[]>([]);
  const [internalRoutes, setInternalRoutes] = useState<InternalRoute[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingTG, setLoadingTG] = useState(true);
  const [loadingIR, setLoadingIR] = useState(true);
  const [statsError, setStatsError] = useState('');

  const refreshStats = useCallback(async () => {
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

  const refreshTelecom = useCallback(async () => {
    setLoadingTG(true);
    try {
      setTelecomGateways(await api.getTelecomGateways());
    } catch {
      /* retried on refresh */
    } finally {
      setLoadingTG(false);
    }
  }, []);

  const refreshRoutes = useCallback(async () => {
    setLoadingIR(true);
    try {
      setInternalRoutes(await api.getInternalRoutes());
    } catch {
      /* retried on refresh */
    } finally {
      setLoadingIR(false);
    }
  }, []);

  const refreshAll = useCallback(() => {
    refreshStats();
    refreshTelecom();
    refreshRoutes();
  }, [refreshStats, refreshTelecom, refreshRoutes]);

  useEffect(() => {
    refreshStats();
    refreshTelecom();
    refreshRoutes();
  }, [refreshStats, refreshTelecom, refreshRoutes]);

  return {
    stats,
    telecomGateways,
    internalRoutes,
    loadingStats,
    loadingTG,
    loadingIR,
    statsError,
    refreshAll,
    refreshStats,
    refreshTelecom,
    refreshRoutes,
  };
}
