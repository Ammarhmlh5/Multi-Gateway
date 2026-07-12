import { type ReactNode } from 'react';
import {
  LayoutDashboard,
  ListChecks,
  LogOut,
  Network,
  Radio,
  Server,
} from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { Button } from '../ui';

export type PageKey = 'overview' | 'telecom' | 'routes' | 'logs';

interface DashboardLayoutProps {
  activePage: PageKey;
  onNavigate: (page: PageKey) => void;
  children: ReactNode;
}

const navItems: { key: PageKey; label: string; icon: typeof Network }[] = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'telecom', label: 'Telecom Gateways', icon: Server },
  { key: 'routes', label: 'Internal Routes', icon: Radio },
  { key: 'logs', label: 'Live Log Viewer', icon: ListChecks },
];

export function DashboardLayout({
  activePage,
  onNavigate,
  children,
}: DashboardLayoutProps) {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600 shadow-sm">
              <Network className="h-5 w-5 text-white" strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">
                Telecom Suite
              </h1>
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
          {navItems.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => onNavigate(key)}
              className={`flex flex-1 items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors lg:flex-none ${
                activePage === key
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              <Icon className="h-4.5 w-4.5 flex-shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        <main className="flex-1 space-y-6">{children}</main>
      </div>
    </div>
  );
}
