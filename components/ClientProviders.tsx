'use client';

import { AuthProvider } from '@/lib/auth-context';
import { Header } from '@/components/Header';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Header />
      {children}
    </AuthProvider>
  );
}
