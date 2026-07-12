import { useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { api } from '../../lib/api';
import type { InternalRoute, TelecomGateway } from '../../lib/types';
import { Button, Card, Input, Select } from '../ui';

interface InternalRouteFormProps {
  telecomGateways: TelecomGateway[];
  onCreated: () => void;
}

export function InternalRouteForm({
  telecomGateways,
  onCreated,
}: InternalRouteFormProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [tgId, setTgId] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [createdName, setCreatedName] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
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
      const route: InternalRoute = await api.createInternalRoute(
        name.trim(),
        slug.trim().toLowerCase(),
        tgId,
      );
      setCreatedKey(route.api_key);
      setCreatedName(route.name);
      setName('');
      setSlug('');
      setTgId('');
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create route');
    } finally {
      setCreating(false);
    }
  }

  return (
    <Card className="p-6 lg:col-span-2">
      <div className="flex items-center gap-2 text-slate-700">
        <Plus className="h-5 w-5 text-sky-600" />
        <h3 className="font-semibold">Create Internal Route</h3>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        A dedicated log table is created automatically for each route.
      </p>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
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
            &ldquo;{createdName}&rdquo; created successfully
          </p>
          <p className="mt-2 text-xs text-sky-700">API Key:</p>
          <code className="mt-1 block break-all rounded bg-white px-2 py-1.5 text-xs text-slate-800 ring-1 ring-sky-200">
            {createdKey}
          </code>
        </div>
      )}
    </Card>
  );
}
