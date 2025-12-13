'use client';

import { AuthProvider } from '@/lib/auth-context';
import { SettingsProvider } from '@/lib/settings-context';
import { OrganizationProvider } from '@/lib/organization-context';
import { Header } from '@/components/Header';
import { Toaster } from 'sonner';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <OrganizationProvider>
        <SettingsProvider>
          <Header />
          {children}
          <Toaster position="top-center" richColors closeButton />
        </SettingsProvider>
      </OrganizationProvider>
    </AuthProvider>
  );
}
