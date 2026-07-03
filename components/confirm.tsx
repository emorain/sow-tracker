'use client';

import { useEffect, useState } from 'react';

/**
 * Branded, promise-based confirmation dialog to replace native window.confirm().
 *
 * Usage from anywhere (the enclosing function must be async):
 *   import { confirmDialog } from '@/components/confirm';
 *   if (!(await confirmDialog({ message: 'Delete this?', danger: true }))) return;
 *
 * <ConfirmHost/> is mounted once in ClientProviders. If it isn't mounted yet
 * (e.g. SSR), we fall back to window.confirm so callers never hang.
 */

export type ConfirmOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

let hostOpen: ((opts: ConfirmOptions) => void) | null = null;
let pendingResolve: ((value: boolean) => void) | null = null;

export function confirmDialog(opts: ConfirmOptions): Promise<boolean> {
  if (!hostOpen) {
    return Promise.resolve(typeof window !== 'undefined' ? window.confirm(opts.message) : false);
  }
  return new Promise<boolean>((resolve) => {
    pendingResolve = resolve;
    hostOpen!(opts);
  });
}

export function ConfirmHost() {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);

  useEffect(() => {
    hostOpen = (o) => setOpts(o);
    return () => { hostOpen = null; };
  }, []);

  const close = (value: boolean) => {
    setOpts(null);
    pendingResolve?.(value);
    pendingResolve = null;
  };

  useEffect(() => {
    if (!opts) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(false);
      if (e.key === 'Enter') close(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [opts]);

  if (!opts) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4" onClick={() => close(false)}>
      <div className="bg-card text-card-foreground rounded-xl shadow-xl max-w-sm w-full p-5" onClick={(e) => e.stopPropagation()}>
        {opts.title && <h3 className="text-base font-bold tracking-tight mb-1">{opts.title}</h3>}
        <p className="text-sm text-muted-foreground whitespace-pre-line">{opts.message}</p>
        <div className="flex gap-2 justify-end mt-5">
          <button
            onClick={() => close(false)}
            className="px-3.5 py-2 rounded-lg border text-sm font-semibold hover:bg-secondary transition-colors"
          >
            {opts.cancelLabel || 'Cancel'}
          </button>
          <button
            onClick={() => close(true)}
            className={`px-3.5 py-2 rounded-lg text-sm font-semibold text-white transition-colors ${
              opts.danger ? 'bg-due hover:bg-due/90' : 'bg-brand hover:bg-brand/90'
            }`}
          >
            {opts.confirmLabel || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
