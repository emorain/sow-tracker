'use client';

import { Button } from "@/components/ui/button";
import { PiggyBank, LogOut, Settings, ChevronDown, MessageSquare } from "lucide-react";
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useSettings } from '@/lib/settings-context';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import NotificationCenter from '@/components/NotificationCenter';
import FeedbackModal from '@/components/FeedbackModal';

export function Header() {
  const { signOut, user } = useAuth();
  const { settings } = useSettings();
  const pathname = usePathname();
  const farmName = settings?.farm_name || 'Sow Tracker';
  const [pendingTransfersCount, setPendingTransfersCount] = useState(0);
  const [showUtilitiesMenu, setShowUtilitiesMenu] = useState(false);
  const utilitiesRef = useRef<HTMLDivElement>(null);
  const utilitiesButtonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ left: 0 });
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

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

  // Close utilities menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (utilitiesRef.current && !utilitiesRef.current.contains(event.target as Node) &&
          utilitiesButtonRef.current && !utilitiesButtonRef.current.contains(event.target as Node)) {
        setShowUtilitiesMenu(false);
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
    { href: '/matrix/batches', label: 'Matrix' },
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
                    {link.label}
                    {link.badge && link.badge > 0 && (
                      <span className="absolute right-3 top-2 h-5 w-5 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {link.badge > 9 ? '9+' : link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Feedback Modal */}
      <FeedbackModal isOpen={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} />
    </header>
  );
}
