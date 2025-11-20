'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from '@/lib/supabase';
import { PiggyBank, ArrowLeft, Calendar } from "lucide-react";
import Link from 'next/link';
import SowDetailModal from '@/components/SowDetailModal';
import WeanLitterModal from '@/components/WeanLitterModal';

type Sow = {
  id: string;
  ear_tag: string;
  name: string | null;
  birth_date: string;
  breed: string;
  status: 'active' | 'culled' | 'sold';
  photo_url: string | null;
  right_ear_notch: number | null;
  left_ear_notch: number | null;
  registration_number: string | null;
  notes: string | null;
  sire_id: string | null;
  dam_id: string | null;
  created_at: string;
};

type FarrowingSow = Sow & {
  expected_farrowing_date: string;
  actual_farrowing_date: string;
  breeding_date: string;
  farrowing_id: string;
  days_until_farrowing: number;
  farrowing_crate: string | null;
  moved_to_farrowing_date: string | null;
};

export default function ActiveFarrowingsPage() {
  const [farrowingSows, setFarrowingSows] = useState<FarrowingSow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSow, setSelectedSow] = useState<Sow | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [weaningSow, setWeaningSow] = useState<FarrowingSow | null>(null);
  const [isWeanModalOpen, setIsWeanModalOpen] = useState(false);

  useEffect(() => {
    fetchFarrowingSows();
  }, []);

  const fetchFarrowingSows = async () => {
    try {
      const today = new Date();
      const twentyOneDaysAgo = new Date(today);
      twentyOneDaysAgo.setDate(today.getDate() - 21);

      // Get sows currently nursing (farrowed within last 21 days and not yet weaned)
      const { data: farrowingData, error: farrowingError } = await supabase
        .from('farrowings')
        .select(`
          id,
          sow_id,
          breeding_date,
          expected_farrowing_date,
          actual_farrowing_date,
          farrowing_crate,
          moved_to_farrowing_date,
          sows (*)
        `)
        .not('actual_farrowing_date', 'is', null)
        .is('moved_out_of_farrowing_date', null)
        .gte('actual_farrowing_date', twentyOneDaysAgo.toISOString().split('T')[0])
        .order('actual_farrowing_date', { ascending: false });

      if (farrowingError) throw farrowingError;

      // Transform data to include sow info and days since farrowing
      const allFarrowings: FarrowingSow[] = (farrowingData || []).map((farrowing: any) => {
        const actualDate = new Date(farrowing.actual_farrowing_date);
        const daysSince = Math.floor((today.getTime() - actualDate.getTime()) / (1000 * 60 * 60 * 24));

        return {
          ...farrowing.sows,
          expected_farrowing_date: farrowing.expected_farrowing_date,
          actual_farrowing_date: farrowing.actual_farrowing_date,
          breeding_date: farrowing.breeding_date,
          farrowing_id: farrowing.id,
          days_until_farrowing: -daysSince, // Negative to indicate days in the past
          farrowing_crate: farrowing.farrowing_crate,
          moved_to_farrowing_date: farrowing.moved_to_farrowing_date,
        };
      });

      // Deduplicate by sow_id, keeping only the most recent farrowing for each sow
      const sowMap = new Map<string, FarrowingSow>();
      allFarrowings.forEach(sow => {
        const existing = sowMap.get(sow.id);
        if (!existing || new Date(sow.actual_farrowing_date) > new Date(existing.actual_farrowing_date)) {
          sowMap.set(sow.id, sow);
        }
      });

      const sowsWithFarrowing = Array.from(sowMap.values());
      setFarrowingSows(sowsWithFarrowing);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch farrowing sows');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getDaysLabel = (days: number) => {
    const daysSince = Math.abs(days);
    if (daysSince === 0) {
      return 'Farrowed today';
    } else if (daysSince === 1) {
      return '1 day nursing';
    } else {
      return `${daysSince} days nursing`;
    }
  };

  const getDaysColor = (days: number) => {
    const daysSince = Math.abs(days);
    if (daysSince === 0) return 'bg-orange-100 text-orange-800';
    if (daysSince <= 7) return 'bg-yellow-100 text-yellow-800';
    if (daysSince <= 14) return 'bg-blue-100 text-blue-800';
    return 'bg-red-100 text-red-900'; // Approaching weaning (21 days)
  };

  return (
    <div className="min-h-screen bg-red-700">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-3">
            <Calendar className="h-8 w-8 text-red-700" />
            <h1 className="text-2xl font-bold text-gray-900">Currently Farrowing</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sows in Farrowing House</CardTitle>
            <CardDescription>
              {loading ? 'Loading...' : `${farrowingSows.length} sow${farrowingSows.length !== 1 ? 's' : ''} currently nursing litters`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
                {error}
              </div>
            )}

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading farrowing sows...
              </div>
            ) : farrowingSows.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No sows currently nursing</h3>
                <p className="text-gray-600">
                  No sows have farrowed in the last 21 days
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {farrowingSows.map((sow) => (
                  <div
                    key={sow.farrowing_id}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {/* Top row on mobile: Photo, Name & Badges */}
                    <div className="flex items-center gap-3 sm:gap-4">
                      {/* Sow Photo */}
                      <div className="flex-shrink-0">
                        {sow.photo_url ? (
                          <img
                            src={sow.photo_url}
                            alt={sow.name || sow.ear_tag}
                            className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-gray-200"
                          />
                        ) : (
                          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-200 flex items-center justify-center">
                            <PiggyBank className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Sow Name & Badge - Mobile only */}
                      <div className="flex-1 min-w-0 sm:hidden">
                        <h3 className="text-base font-semibold text-gray-900 truncate">
                          {sow.name || sow.ear_tag}
                        </h3>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getDaysColor(sow.days_until_farrowing)} mt-0.5`}>
                          {getDaysLabel(sow.days_until_farrowing)}
                        </span>
                      </div>
                    </div>

                    {/* Sow Info - Desktop and mobile details */}
                    <div className="flex-1 min-w-0">
                      {/* Desktop name & badge */}
                      <div className="hidden sm:flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {sow.name || sow.ear_tag}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getDaysColor(sow.days_until_farrowing)}`}>
                          {getDaysLabel(sow.days_until_farrowing)}
                        </span>
                      </div>

                      {/* Info grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-1.5 sm:gap-2 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Ear Tag:</span> {sow.ear_tag}
                        </div>
                        <div>
                          <span className="font-medium">Breed:</span> {sow.breed}
                        </div>
                        <div>
                          <span className="font-medium">Bred:</span> {formatDate(sow.breeding_date)}
                        </div>
                        <div>
                          <span className="font-medium">Farrowed:</span> {formatDate(sow.actual_farrowing_date)}
                        </div>
                        {sow.farrowing_crate && (
                          <div>
                            <span className="font-medium">Crate:</span> {sow.farrowing_crate}
                          </div>
                        )}
                        {sow.moved_to_farrowing_date && (
                          <div>
                            <span className="font-medium">Moved In:</span> {formatDate(sow.moved_to_farrowing_date)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions - Stack on mobile */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedSow(sow);
                          setIsModalOpen(true);
                        }}
                        className="w-full sm:w-auto"
                      >
                        View Details
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          setWeaningSow(sow);
                          setIsWeanModalOpen(true);
                        }}
                        className="w-full sm:w-auto"
                      >
                        Wean Litter
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Sow Detail Modal */}
      <SowDetailModal
        sow={selectedSow}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSow(null);
        }}
      />

      {/* Wean Litter Modal */}
      {weaningSow && (
        <WeanLitterModal
          farrowingId={weaningSow.farrowing_id}
          sowName={weaningSow.name || ''}
          sowEarTag={weaningSow.ear_tag}
          actualFarrowingDate={weaningSow.actual_farrowing_date}
          isOpen={isWeanModalOpen}
          onClose={() => {
            setIsWeanModalOpen(false);
            setWeaningSow(null);
          }}
          onSuccess={() => {
            fetchFarrowingSows();
          }}
        />
      )}
    </div>
  );
}
