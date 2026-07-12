import { useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { api } from '../../lib/api';
import type { TelecomGateway } from '../../lib/types';
import { Button, Card, Input } from '../ui';

interface TelecomGatewayFormProps {
  onCreated: () => void;
}

export function TelecomGatewayForm({ onCreated }: TelecomGatewayFormProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [provider, setProvider] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [createdName, setCreatedName] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
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
      const gw: TelecomGateway = await api.createTelecomGateway(
        name.trim(),
        slug.trim().toLowerCase(),
        provider.trim(),
      );
      setCreatedKey(gw.api_key);
      setCreatedName(gw.name);
      setName('');
      setSlug('');
      setProvider('');
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create gateway');
    } finally {
      setCreating(false);
    }
  }

  return (
    <Card className="p-6 lg:col-span-2">
      <div className="flex items-center gap-2 text-slate-700">
        <Plus className="h-5 w-5 text-teal-600" />
        <h3 className="font-semibold">Create Telecom Gateway</h3>
      </div>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
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
            &ldquo;{createdName}&rdquo; created successfully
          </p>
          <p className="mt-2 text-xs text-teal-700">API Key:</p>
          <code className="mt-1 block break-all rounded bg-white px-2 py-1.5 text-xs text-slate-800 ring-1 ring-teal-200">
            {createdKey}
          </code>
        </div>
      )}
    </Card>
  );
}
