'use client';

import { Button } from "@/components/ui/button";
import { PiggyBank, LogOut } from "lucide-react";
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { usePathname } from 'next/navigation';

export function Header() {
  const { signOut, user } = useAuth();
  const pathname = usePathname();
  const farmName = user?.user_metadata?.farm_name || 'Sow Tracker';

  // Don't show header on auth pages
  if (pathname?.startsWith('/auth')) {
    return null;
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <PiggyBank className="h-8 w-8 text-green-600" />
            <h1 className="text-2xl font-bold text-gray-900">{farmName}</h1>
          </Link>
          <div className="flex items-center gap-3">
            {user && (
              <span className="text-sm text-gray-600">
                {user.email}
              </span>
            )}
            <Link href="/sows/new">
              <Button>Add New Sow</Button>
            </Link>
            <Button variant="outline" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
