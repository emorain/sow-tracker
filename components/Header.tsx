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
  const [showUtilitiesMenu, setShowUtilitiesMenu] = useState(false);
  const [showOrgMenu, setShowOrgMenu] = useState(false);
  const utilitiesRef = useRef<HTMLDivElement>(null);
  const utilitiesButtonRef = useRef<HTMLButtonElement>(null);
  const orgMenuRef = useRef<HTMLDivElement>(null);
  const orgButtonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ left: 0 });
  const [orgDropdownPosition, setOrgDropdownPosition] = useState({ left: 0 });
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);

  // Fetch pending transfer requests count
  useEffect(() => {
    if (!user) return;

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

    // Poll every 30 seconds for new transfer requests
    const interval = setInterval(fetchPendingTransfers, 30000);

    return () => clearInterval(interval);
  }, [user]);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (utilitiesRef.current && !utilitiesRef.current.contains(event.target as Node) &&
          utilitiesButtonRef.current && !utilitiesButtonRef.current.contains(event.target as Node)) {
        setShowUtilitiesMenu(false);
      }
      if (orgMenuRef.current && !orgMenuRef.current.contains(event.target as Node) &&
          orgButtonRef.current && !orgButtonRef.current.contains(event.target as Node)) {
        setShowOrgMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update dropdown position when menu opens
  useEffect(() => {
    if (showUtilitiesMenu && utilitiesButtonRef.current) {
      const buttonRect = utilitiesButtonRef.current.getBoundingClientRect();
      const wrapperRect = utilitiesButtonRef.current.closest('.relative')?.getBoundingClientRect();
      if (wrapperRect) {
        setDropdownPosition({ left: buttonRect.left - wrapperRect.left });
      }
    }
  }, [showUtilitiesMenu]);

  // Don't show header on auth pages
  if (pathname?.startsWith('/auth')) {
    return null;
  }

  // Main navigation links
  const navLinks = [
    { href: '/', label: 'Dashboard' },
    { href: '/sows', label: 'Sows' },
    { href: '/boars', label: 'Boars' },
    { href: '/farrowings/active', label: 'Farrowings' },
    { href: '/piglets/weaned', label: 'Piglets' },
    { href: '/matrix/batches', label: 'Estrus Sync' },
  ];

  // Utilities dropdown links
  const utilityLinks = [
    { href: '/health', label: 'Health Dashboard' },
    { href: '/calendar', label: 'Calendar' },
    { href: '/tasks', label: 'Tasks' },
    { href: '/protocols', label: 'Protocols' },
    { href: '/compliance', label: 'Prop 12' },
    { href: '/housing-units', label: 'Housing' },
    { href: '/transfers', label: 'Transfers', badge: pendingTransfersCount },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md border-b border-gray-200">
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
            <h1 className="text-2xl font-bold text-black">{farmName}</h1>
          </Link>
          <div className="flex items-center gap-3">
            {user && (
              <span className="text-sm text-gray-600 hidden sm:block">
                {user.email}
              </span>
            )}
            <NotificationCenter />
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowFeedbackModal(true)}
              title="Send Feedback"
            >
              <MessageSquare className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Feedback</span>
            </Button>
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

        {/* Organization Switcher Row - Show if user has any orgs */}
        {user && userMemberships.length > 0 && selectedOrganization && (
          <div className="pb-3 border-b border-gray-100">
            <div className="relative inline-block">
              <button
                ref={orgButtonRef}
                onClick={() => setShowOrgMenu(!showOrgMenu)}
                className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                title="Switch Organization"
              >
                <Building2 className="h-4 w-4 text-gray-600 flex-shrink-0" />
                <span className="text-gray-700 font-medium">
                  {selectedOrganization.name}
                </span>
                <ChevronDown className={`h-4 w-4 text-gray-600 transition-transform flex-shrink-0 ${showOrgMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Organization Dropdown */}
              {showOrgMenu && (
                <div
                  ref={orgMenuRef}
                  className="absolute top-full left-0 mt-1 w-64 max-w-[calc(100vw-2rem)] bg-white border border-gray-200 rounded-md shadow-lg py-1 z-[100]"
                >
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-xs text-gray-500 font-medium">Switch Organization</p>
                  </div>
                  {userMemberships.map((membership) => (
                    <button
                      key={membership.organization_id}
                      onClick={() => {
                        switchOrganization(membership.organization_id);
                        setShowOrgMenu(false);
                      }}
                      className={`block w-full text-left px-3 py-2 text-sm transition-colors ${
                        membership.organization_id === selectedOrganization?.id
                          ? 'bg-red-50 text-red-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">{membership.organization.name}</span>
                        {membership.organization_id === selectedOrganization?.id && (
                          <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full ml-2">
                            Active
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 capitalize">{membership.role}</span>
                    </button>
                  ))}
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button
                      onClick={() => {
                        setShowCreateOrgModal(true);
                        setShowOrgMenu(false);
                      }}
                      className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Plus className="h-4 w-4 text-green-600" />
                        <span className="text-green-700 font-medium">Create New Organization</span>
                      </div>
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
                      : 'border-transparent text-black hover:text-red-700 hover:border-red-300'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            {/* Utilities Dropdown Button */}
            <button
              ref={utilitiesButtonRef}
              onClick={() => setShowUtilitiesMenu(!showUtilitiesMenu)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex items-center gap-1 ${
                utilityLinks.some(link => pathname?.startsWith(link.href))
                  ? 'border-red-700 text-red-700'
                  : 'border-transparent text-black hover:text-red-700 hover:border-red-300'
              }`}
            >
              Utilities
              <ChevronDown className={`h-4 w-4 transition-transform ${showUtilitiesMenu ? 'rotate-180' : ''}`} />
              {pendingTransfersCount > 0 && (
                <span className="ml-1 h-5 w-5 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {pendingTransfersCount > 9 ? '9+' : pendingTransfersCount}
                </span>
              )}
            </button>
          </nav>

          {/* Dropdown Menu - Outside overflow container */}
          {showUtilitiesMenu && (
            <div
              ref={utilitiesRef}
              className="absolute top-full mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-[100]"
              style={{ left: `${dropdownPosition.left}px` }}
            >
              {utilityLinks.map((link) => {
                const isActive = pathname === link.href ||
                  (link.href !== '/' && pathname?.startsWith(link.href));

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setShowUtilitiesMenu(false)}
                    className={`block px-4 py-2 text-sm transition-colors relative ${
                      isActive
                        ? 'bg-red-50 text-red-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-red-700'
                    }`}
                  >
                    <span className="flex items-center justify-between w-full">
                      <span>{link.label}</span>
                      {link.badge !== undefined && link.badge > 0 && (
                        <span className="h-5 w-5 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                          {link.badge > 9 ? '9+' : link.badge}
                        </span>
                      )}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Feedback Modal */}
      <FeedbackModal isOpen={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} />

      {/* Create Organization Modal */}
      <CreateOrganizationModal
        isOpen={showCreateOrgModal}
        onClose={() => setShowCreateOrgModal(false)}
      />
    </header>
  );
}
