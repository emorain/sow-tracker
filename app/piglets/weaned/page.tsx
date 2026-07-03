'use client';

// Retired: the Nursery board (/nursery) is now the single workspace for weaned
// grow pigs — classify, weigh, show, reserve, sell (with income), keep as
// breeder, pedigree, photo, and CSV export all live there. The old table's
// bulk hard-delete and status-dropdown (which could mark a pig sold with no
// price/income) are gone. This route redirects to keep old links working.

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function WeanedPigletsRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/nursery'); }, [router]);
  return (
    <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">
      Redirecting to the Nursery…
    </div>
  );
}
