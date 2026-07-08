import { useEffect, useState } from 'react';
import {
  Inbox,
  ListChecks,
  RefreshCw,
  Search,
  MessageSquare,
} from 'lucide-react';
import { api } from '../lib/api';
import type { Gateway, SMSLog } from '../lib/types';
import { Badge, Card, Select, Spinner } from './ui';

interface LogViewerProps {
  gateways: Gateway[];
}

export default function LogViewer({ gateways }: LogViewerProps) {
  const [selectedSlug, setSelectedSlug] = useState('');
  const [logs, setLogs] = useState<SMSLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Auto-select the first gateway when the list loads
  useEffect(() => {
    if (!selectedSlug && gateways.length > 0) {
      setSelectedSlug(gateways[0].slug);
    }
  }, [gateways, selectedSlug]);

  const fetchLogs = async (slug: string) => {
    if (!slug) {
      setLogs([]);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await api.getGatewayLogs(slug);
      setLogs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSlug) fetchLogs(selectedSlug);
  }, [selectedSlug]);

  const filtered = logs.filter((l) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      l.sender_id.toLowerCase().includes(q) ||
      l.receiver_phone.toLowerCase().includes(q) ||
      l.message_text.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Live Log Viewer</h2>
        <p className="text-sm text-slate-500">
          Select a gateway to fetch records from its dedicated log table
        </p>
      </div>

      <Card className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Select
              id="gateway-select"
              label="Gateway"
              value={selectedSlug}
              onChange={(e) => setSelectedSlug(e.target.value)}
            >
              {gateways.length === 0 && (
                <option value="" disabled>
                  No gateways available
                </option>
              )}
              {gateways.map((gw) => (
                <option key={gw.id} value={gw.slug}>
                  {gw.name} ({gw.slug})
                </option>
              ))}
            </Select>
          </div>
          <div className="flex-1">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">
                Search logs
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500"
                  placeholder="Filter by sender, phone, or message…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
          <button
            onClick={() => selectedSlug && fetchLogs(selectedSlug)}
            disabled={!selectedSlug || loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </Card>
      )}

      <Card>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2 text-slate-700">
            <ListChecks className="h-5 w-5 text-teal-600" />
            <h3 className="font-semibold">SMS Log Records</h3>
          </div>
          <Badge color="slate">{filtered.length} records</Badge>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="h-7 w-7" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <Inbox className="h-7 w-7 text-slate-400" />
            </div>
            <p className="mt-3 text-sm font-medium text-slate-600">
              {selectedSlug ? 'No records found' : 'Select a gateway to view logs'}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {selectedSlug
                ? 'This gateway has no SMS logs in its dynamic table yet.'
                : 'Choose a gateway from the dropdown above.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Sender ID</th>
                  <th className="px-5 py-3 font-medium">Receiver Phone</th>
                  <th className="px-5 py-3 font-medium">Message Text</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Received At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="whitespace-nowrap px-5 py-3 font-medium text-slate-800">
                      {log.sender_id}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                      {log.receiver_phone}
                    </td>
                    <td className="max-w-xs px-5 py-3 text-slate-600">
                      <div className="flex items-start gap-1.5">
                        <MessageSquare className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                        <span className="truncate" title={log.message_text}>
                          {log.message_text}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <Badge color={log.status === 'received' ? 'green' : 'amber'}>
                        {log.status}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-slate-500">
                      {new Date(log.received_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
