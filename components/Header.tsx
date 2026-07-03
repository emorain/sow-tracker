'use client';

import { Button } from "@/components/ui/button";
import { PiggyBank, LogOut, Settings, ChevronDown, MessageSquare, Building2, Plus } from "lucide-react";
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useSettings } from '@/lib/settings-context';
import { useOrganization } from '@/lib/organization-context';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import NotificationCenter from '@/components/NotificationCenter';
import FeedbackModal from '@/components/FeedbackModal';
import CreateOrganizationModal from '@/components/CreateOrganizationModal';

export function Header() {
  const { signOut, user } = useAuth();
  const { settings } = useSettings();
  const { selectedOrganization, userMemberships, switchOrganization } = useOrganization();
  const pathname = usePathname();
  const farmName = settings?.farm_name || 'Sow Tracker';
  const [pendingTransfersCount, setPendingTransfersCount] = useState(0);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showOrgMenu, setShowOrgMenu] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const orgMenuRef = useRef<HTMLDivElement>(null);
  const orgButtonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ left: 0 });
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);

  const transfersEnabled = !!settings?.feature_transfers;
  const financesEnabled = !!settings?.feature_finances;
  const complianceEnabled = !!settings?.prop12_compliance_enabled;

  // Poll pending transfers only when the transfers feature is enabled.
  useEffect(() => {
    if (!user || !transfersEnabled) { setPendingTransfersCount(0); return; }

    const fetchPendingTransfers = async () => {
      try {
        const { count: sowCount } = await supabase
          .from('sow_transfer_requests')
          .select('*', { count: 'exact', head: true })
          .or(`to_user_id.eq.${user.id},to_user_email.eq.${user.email}`)
          .eq('status', 'pending');
        const { count: boarCount } = await supabase
          .from('boar_transfer_requests')
          .select('*', { count: 'exact', head: true })
          .or(`to_user_id.eq.${user.id},to_user_email.eq.${user.email}`)
          .eq('status', 'pending');
        setPendingTransfersCount((sowCount || 0) + (boarCount || 0));
      } catch (error) {
        console.error('Error fetching pending transfers:', error);
      }
    };

    fetchPendingTransfers();
    const interval = setInterval(fetchPendingTransfers, 30000);
    return () => clearInterval(interval);
  }, [user, transfersEnabled]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(event.target as Node) &&
          moreButtonRef.current && !moreButtonRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
      if (orgMenuRef.current && !orgMenuRef.current.contains(event.target as Node) &&
          orgButtonRef.current && !orgButtonRef.current.contains(event.target as Node)) {
        setShowOrgMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (showMoreMenu && moreButtonRef.current) {
      const buttonRect = moreButtonRef.current.getBoundingClientRect();
      const wrapperRect = moreButtonRef.current.closest('.relative')?.getBoundingClientRect();
      if (wrapperRect) setDropdownPosition({ left: buttonRect.left - wrapperRect.left });
    }
  }, [showMoreMenu]);

  if (pathname?.startsWith('/auth')) return null;

  // Primary navigation — ordered by the daily workflow, breeding cycle first.
  const navLinks = [
    { href: '/', label: 'Today', exact: true },
    { href: '/breeding-board', label: 'Breeding Board' },
    { href: '/sows', label: 'Sows' },
    { href: '/boars', label: 'Boars' },
    { href: '/piglets/nursing', label: 'Nursing' },
    { href: '/nursery', label: 'Nursery' },
    { href: '/matrix/batches', label: 'Estrus Sync' },
  ];

  // "More" — records + admin, plus feature-gated modules.
  const moreLinks = [
    { href: '/piglets/weaned', label: 'Weaned Piglets' },
    { href: '/shows', label: 'Show Results' },
    { href: '/calendar', label: 'Calendar' },
    { href: '/tasks', label: 'Tasks' },
    { href: '/protocols', label: 'Protocols' },
    { href: '/health', label: 'Health' },
    { href: '/housing-units', label: 'Housing' },
    ...(financesEnabled ? [{ href: '/finances', label: 'Finances' }] : []),
    ...(complianceEnabled ? [{ href: '/compliance', label: 'Prop 12' }] : []),
    ...(transfersEnabled ? [{ href: '/transfers', label: 'Transfers', badge: pendingTransfersCount }] : []),
  ];

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname?.startsWith(href);

  return (
    <header className="sticky top-0 z-50 bg-card shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar */}
        <div className="flex items-center justify-between py-3.5">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt={farmName} className="h-8 w-8 object-contain" />
            ) : (
              <PiggyBank className="h-7 w-7 text-brand" />
            )}
            <h1 className="text-xl font-bold tracking-tight">{farmName}</h1>
          </Link>
          <div className="flex items-center gap-2">
            {user && <span className="text-sm text-muted-foreground hidden md:block">{user.email}</span>}
            <NotificationCenter />
            <Button size="sm" variant="outline" onClick={() => setShowFeedbackModal(true)} title="Send Feedback">
              <MessageSquare className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Feedback</span>
            </Button>
            <Link href="/settings">
              <Button size="sm" variant="outline"><Settings className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Settings</span></Button>
            </Link>
            <Button size="sm" variant="outline" onClick={signOut}>
              <LogOut className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>

        {/* Organization switcher — only when the user belongs to more than one */}
        {user && userMemberships.length > 1 && selectedOrganization && (
          <div className="pb-2.5">
            <div className="relative inline-block">
              <button ref={orgButtonRef} onClick={() => setShowOrgMenu(!showOrgMenu)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-md hover:bg-secondary transition-colors" title="Switch Organization">
                <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="font-medium">{selectedOrganization.name}</span>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform shrink-0 ${showOrgMenu ? 'rotate-180' : ''}`} />
              </button>
              {showOrgMenu && (
                <div ref={orgMenuRef} className="absolute top-full left-0 mt-1 w-64 max-w-[calc(100vw-2rem)] bg-card border rounded-md shadow-lg py-1 z-[100]">
                  <div className="px-3 py-2 border-b"><p className="text-xs text-muted-foreground font-medium">Switch Organization</p></div>
                  {userMemberships.map((membership) => (
                    <button key={membership.organization_id}
                      onClick={() => { switchOrganization(membership.organization_id); setShowOrgMenu(false); }}
                      className={`block w-full text-left px-3 py-2 text-sm transition-colors ${
                        membership.organization_id === selectedOrganization?.id ? 'bg-secondary text-brand font-medium' : 'hover:bg-secondary'}`}>
                      <div className="flex items-center justify-between">
                        <span className="truncate">{membership.organization.name}</span>
                        {membership.organization_id === selectedOrganization?.id && (
                          <span className="text-xs px-2 py-0.5 bg-brand/10 text-brand rounded-full ml-2">Active</span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground capitalize">{membership.role}</span>
                    </button>
                  ))}
                  <div className="border-t mt-1 pt-1">
                    <button onClick={() => { setShowCreateOrgModal(true); setShowOrgMenu(false); }}
                      className="block w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors">
                      <div className="flex items-center gap-2"><Plus className="h-4 w-4 text-brand" /><span className="text-brand font-medium">Create New Organization</span></div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="relative">
          <nav className="flex gap-1 overflow-x-auto pb-2 -mb-px">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}
                className={`px-3.5 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  isActive(link.href, link.exact) ? 'border-brand text-brand' : 'border-transparent text-foreground hover:text-brand hover:border-brand/40'}`}>
                {link.label}
              </Link>
            ))}
            <button ref={moreButtonRef} onClick={() => setShowMoreMenu(!showMoreMenu)}
              className={`px-3.5 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex items-center gap-1 ${
                moreLinks.some(l => pathname?.startsWith(l.href)) ? 'border-brand text-brand' : 'border-transparent text-foreground hover:text-brand hover:border-brand/40'}`}>
              More
              <ChevronDown className={`h-4 w-4 transition-transform ${showMoreMenu ? 'rotate-180' : ''}`} />
              {pendingTransfersCount > 0 && (
                <span className="ml-1 h-5 w-5 bg-due text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {pendingTransfersCount > 9 ? '9+' : pendingTransfersCount}
                </span>
              )}
            </button>
          </nav>

          {showMoreMenu && (
            <div ref={moreRef} className="absolute top-full mt-1 w-48 bg-card border rounded-md shadow-lg py-1 z-[100]" style={{ left: `${dropdownPosition.left}px` }}>
              {moreLinks.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setShowMoreMenu(false)}
                  className={`block px-4 py-2 text-sm transition-colors ${
                    isActive(link.href) ? 'bg-secondary text-brand font-medium' : 'hover:bg-secondary hover:text-brand'}`}>
                  <span className="flex items-center justify-between w-full">
                    <span>{link.label}</span>
                    {'badge' in link && (link as any).badge > 0 && (
                      <span className="h-5 w-5 bg-due text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {(link as any).badge > 9 ? '9+' : (link as any).badge}
                      </span>
                    )}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <FeedbackModal isOpen={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} />
      <CreateOrganizationModal isOpen={showCreateOrgModal} onClose={() => setShowCreateOrgModal(false)} />
    </header>
  );
}
