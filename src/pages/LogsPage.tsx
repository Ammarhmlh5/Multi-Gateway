import type { InternalRoute } from '../lib/types';
import LogViewer from '../components/LogViewer';

interface LogsPageProps {
  routes: InternalRoute[];
}

export function LogsPage({ routes }: LogsPageProps) {
  return <LogViewer routes={routes} />;
}
