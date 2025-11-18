'use client';

import { Button } from "@/components/ui/button";
import { PiggyBank, LogOut, Settings } from "lucide-react";
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useSettings } from '@/lib/settings-context';
import { usePathname } from 'next/navigation';

export function Header() {
  const { signOut, user } = useAuth();
  const { settings } = useSettings();
  const pathname = usePathname();
  const farmName = settings?.farm_name || 'Sow Tracker';

  // Don't show header on auth pages
  if (pathname?.startsWith('/auth')) {
    return null;
  }

  const navLinks = [
    { href: '/', label: 'Dashboard' },
    { href: '/sows', label: 'Sows' },
    { href: '/tasks', label: 'Tasks' },
    { href: '/protocols', label: 'Protocols' },
    { href: '/farrowings/active', label: 'Farrowings' },
    { href: '/piglets/weaned', label: 'Piglets' },
    { href: '/matrix/batches', label: 'Matrix' },
  ];

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar */}
        <div className="flex items-center justify-between py-4">
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            {settings?.logo_url ? (
              <img
                src={settings.logo_url}
                alt={farmName}
                className="h-8 w-8 object-contain"
              />
            ) : (
              <PiggyBank className="h-8 w-8 text-red-700" />
            )}
            <h1 className="text-2xl font-bold text-gray-900">{farmName}</h1>
          </Link>
          <div className="flex items-center gap-3">
            {user && (
              <span className="text-sm text-gray-600 hidden sm:block">
                {user.email}
              </span>
            )}
            <Link href="/sows/new">
              <Button size="sm">Add Sow</Button>
            </Link>
            <Link href="/settings">
              <Button size="sm" variant="outline">
                <Settings className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Settings</span>
              </Button>
            </Link>
            <Button size="sm" variant="outline" onClick={signOut}>
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex gap-1 overflow-x-auto pb-2 -mb-px">
          {navLinks.map((link) => {
            const isActive = pathname === link.href ||
              (link.href !== '/' && pathname?.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? 'border-red-700 text-red-700'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
