'use client';

import { AuthProvider } from '@/lib/auth-context';
import { Header } from '@/components/Header';
import { Toaster } from 'sonner';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Header />
      {children}
      <Toaster position="top-center" richColors closeButton />
    </AuthProvider>
  );
}
