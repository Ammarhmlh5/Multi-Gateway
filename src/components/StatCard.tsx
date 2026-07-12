import { type ReactNode } from 'react';
import { Card, Spinner } from './ui';

type Accent = 'teal' | 'blue' | 'amber';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value?: number;
  loading: boolean;
  accent: Accent;
}

const accentClasses: Record<Accent, string> = {
  teal: 'bg-teal-50 text-teal-600 ring-teal-600/10',
  blue: 'bg-sky-50 text-sky-600 ring-sky-600/10',
  amber: 'bg-amber-50 text-amber-600 ring-amber-600/10',
};

export function StatCard({ icon, label, value, loading, accent }: StatCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ring-1 ring-inset ${accentClasses[accent]}`}
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
