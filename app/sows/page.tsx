'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from '@/lib/supabase';
import { PiggyBank, ArrowLeft, Plus, Upload } from "lucide-react";
import Link from 'next/link';
import Image from 'next/image';
import SowDetailModal from '@/components/SowDetailModal';
import MoveToFarrowingForm from '@/components/MoveToFarrowingForm';
import MatrixTreatmentForm from '@/components/MatrixTreatmentForm';

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
  current_location: string | null;
  created_at: string;
};

type FilterType = 'all' | 'active' | 'sows' | 'gilts' | 'culled' | 'sold';

export default function SowsListPage() {
  const [sows, setSows] = useState<Sow[]>([]);
  const [filteredSows, setFilteredSows] = useState<Sow[]>([]);
  const [farrowingCounts, setFarrowingCounts] = useState<Record<string, number>>({});
  const [activeFarrowings, setActiveFarrowings] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedSow, setSelectedSow] = useState<Sow | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showMoveToFarrowingForm, setShowMoveToFarrowingForm] = useState(false);
  const [sowToMove, setSowToMove] = useState<Sow | null>(null);
  const [selectedSowIds, setSelectedSowIds] = useState<Set<string>>(new Set());
  const [showMatrixForm, setShowMatrixForm] = useState(false);

  useEffect(() => {
    fetchSows();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [sows, activeFilter, farrowingCounts]);

  const fetchSows = async () => {
    try {
      const { data, error } = await supabase
        .from('sows')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSows(data || []);

      // Fetch farrowing counts for gilt detection and active farrowings
      if (data) {
        const counts: Record<string, number> = {};
        const activeSet = new Set<string>();

        for (const sow of data) {
          // Get total farrowing count
          const { count } = await supabase
            .from('farrowings')
            .select('*', { count: 'exact', head: true })
            .eq('sow_id', sow.id);
          counts[sow.id] = count || 0;

          // Check if sow has an active farrowing (in farrowing but not moved out yet)
          const { data: activeFarrowing } = await supabase
            .from('farrowings')
            .select('id')
            .eq('sow_id', sow.id)
            .not('actual_farrowing_date', 'is', null)
            .is('moved_out_of_farrowing_date', null)
            .maybeSingle();

          if (activeFarrowing) {
            activeSet.add(sow.id);
          }
        }

        setFarrowingCounts(counts);
        setActiveFarrowings(activeSet);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch sows');
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    let filtered = [...sows];

    switch (activeFilter) {
      case 'active':
        filtered = sows.filter(sow => sow.status === 'active');
        break;
      case 'sows':
        filtered = sows.filter(sow => sow.status === 'active' && farrowingCounts[sow.id] > 0);
        break;
      case 'gilts':
        filtered = sows.filter(sow => sow.status === 'active' && farrowingCounts[sow.id] === 0);
        break;
      case 'culled':
        filtered = sows.filter(sow => sow.status === 'culled');
        break;
      case 'sold':
        filtered = sows.filter(sow => sow.status === 'sold');
        break;
      case 'all':
      default:
        // Show all sows
        break;
    }

    setFilteredSows(filtered);
  };

  const getFilterCounts = () => {
    const giltCount = sows.filter(sow => sow.status === 'active' && farrowingCounts[sow.id] === 0).length;
    const sowCount = sows.filter(sow => sow.status === 'active' && farrowingCounts[sow.id] > 0).length;
    return {
      all: sows.length,
      active: sows.filter(s => s.status === 'active').length,
      sows: sowCount,
      gilts: giltCount,
      culled: sows.filter(s => s.status === 'culled').length,
      sold: sows.filter(s => s.status === 'sold').length,
    };
  };

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    const ageInMonths = Math.floor((today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 30));
    const years = Math.floor(ageInMonths / 12);
    const months = ageInMonths % 12;

    if (years > 0) {
      return `${years}y ${months}m`;
    }
    return `${months}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'culled':
        return 'bg-red-100 text-red-800';
      case 'sold':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getLocationBadge = (location: string | null, isInFarrowing: boolean) => {
    // If sow has an active farrowing, show that regardless of database location
    if (isInFarrowing) {
      return {
        text: 'Farrowing',
        color: 'bg-orange-100 text-orange-800',
      };
    }

    // Otherwise show database location if available
    if (!location) return null;

    const locationMap: Record<string, { text: string; color: string }> = {
      breeding: { text: 'Breeding', color: 'bg-pink-100 text-pink-800' },
      gestation: { text: 'Gestation', color: 'bg-blue-100 text-blue-800' },
      farrowing: { text: 'Farrowing', color: 'bg-orange-100 text-orange-800' },
      hospital: { text: 'Hospital', color: 'bg-red-100 text-red-800' },
      quarantine: { text: 'Quarantine', color: 'bg-yellow-100 text-yellow-800' },
      other: { text: 'Other', color: 'bg-gray-100 text-gray-800' },
    };

    return locationMap[location] || null;
  };

  const toggleSowSelection = (sowId: string) => {
    setSelectedSowIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sowId)) {
        newSet.delete(sowId);
      } else {
        newSet.add(sowId);
      }
      return newSet;
    });
  };

  const selectAllSows = () => {
    setSelectedSowIds(new Set(filteredSows.map(s => s.id)));
  };

  const clearSelection = () => {
    setSelectedSowIds(new Set());
  };

  const getSelectedSows = () => {
    return sows.filter(s => selectedSowIds.has(s.id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <PiggyBank className="h-8 w-8 text-green-600" />
              <h1 className="text-2xl font-bold text-gray-900">Sow Tracker</h1>
            </div>
            <div className="flex gap-2">
              <Link href="/sows/import">
                <Button variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Import Sows
                </Button>
              </Link>
              <Link href="/sows/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Sow
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>

          {/* Selection and Matrix Actions */}
          <div className="flex items-center gap-2">
            {selectedSowIds.size > 0 && (
              <>
                <span className="text-sm font-medium text-gray-700">
                  {selectedSowIds.size} selected
                </span>
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  Clear
                </Button>
              </>
            )}
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowMatrixForm(true)}
              disabled={selectedSowIds.size === 0}
            >
              Record Matrix ({selectedSowIds.size})
            </Button>
            {filteredSows.length > 0 && selectedSowIds.size !== filteredSows.length && (
              <Button variant="outline" size="sm" onClick={selectAllSows}>
                Select All
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Sows</CardTitle>
            <CardDescription>
              {loading ? 'Loading...' : `${filteredSows.length} sow${filteredSows.length !== 1 ? 's' : ''} ${activeFilter !== 'all' ? `(${activeFilter})` : 'in your herd'}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filter Tabs */}
            {!loading && (
              <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b">
                {(['all', 'active', 'sows', 'gilts', 'culled', 'sold'] as FilterType[]).map((filter) => {
                  const counts = getFilterCounts();
                  const count = counts[filter];
                  const isActive = activeFilter === filter;

                  return (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1)} ({count})
                    </button>
                  );
                })}
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
                {error}
              </div>
            )}

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading sows...
              </div>
            ) : filteredSows.length === 0 ? (
              <div className="text-center py-12">
                <PiggyBank className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No sows found</h3>
                <p className="text-gray-600 mb-4">
                  {activeFilter !== 'all'
                    ? `No ${activeFilter} sows in your herd`
                    : 'Get started by adding your first sow'}
                </p>
                {activeFilter === 'all' && (
                  <Link href="/sows/new">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add New Sow
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSows.map((sow) => {
                  const isGilt = farrowingCounts[sow.id] === 0;
                  const isInFarrowing = activeFarrowings.has(sow.id);
                  const locationBadge = getLocationBadge(sow.current_location, isInFarrowing);
                  return (
                  <div
                    key={sow.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {/* Top row on mobile: Checkbox, Photo, Name & Badges */}
                    <div className="flex items-center gap-3 sm:gap-4">
                      {/* Selection Checkbox */}
                      <div className="flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={selectedSowIds.has(sow.id)}
                          onChange={() => toggleSowSelection(sow.id)}
                          className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                        />
                      </div>

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

                      {/* Sow Name & Badges */}
                      <div className="flex-1 min-w-0 sm:hidden">
                        <h3 className="text-base font-semibold text-gray-900 truncate">
                          {sow.name || sow.ear_tag}
                        </h3>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {isGilt && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              Gilt
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(sow.status)}`}>
                            {sow.status}
                          </span>
                          {locationBadge && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${locationBadge.color}`}>
                              {locationBadge.text}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Sow Info - Desktop and mobile details */}
                    <div className="flex-1 min-w-0">
                      {/* Desktop name & badges */}
                      <div className="hidden sm:flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {sow.name || sow.ear_tag}
                        </h3>
                        {isGilt && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Gilt
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(sow.status)}`}>
                          {sow.status}
                        </span>
                        {locationBadge && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${locationBadge.color}`}>
                            {locationBadge.text}
                          </span>
                        )}
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
                          <span className="font-medium">Age:</span> {calculateAge(sow.birth_date)}
                        </div>
                        {(sow.right_ear_notch !== null || sow.left_ear_notch !== null) && (
                          <div>
                            <span className="font-medium">Notches:</span> R:{sow.right_ear_notch || '-'} L:{sow.left_ear_notch || '-'}
                          </div>
                        )}
                        {sow.registration_number && (
                          <div className="sm:col-span-2">
                            <span className="font-medium">Registration:</span> {sow.registration_number}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions - Stack on mobile */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:flex-shrink-0">
                      {sow.status === 'active' && !activeFarrowings.has(sow.id) && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            setSowToMove(sow);
                            setShowMoveToFarrowingForm(true);
                          }}
                          className="w-full sm:w-auto"
                        >
                          Move to Farrowing
                        </Button>
                      )}
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
                    </div>
                  </div>
                  );
                })}
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

      {/* Move to Farrowing Form */}
      {sowToMove && (
        <MoveToFarrowingForm
          sowId={sowToMove.id}
          sowName={sowToMove.name || sowToMove.ear_tag}
          isOpen={showMoveToFarrowingForm}
          onClose={() => {
            setShowMoveToFarrowingForm(false);
            setSowToMove(null);
          }}
          onSuccess={() => {
            fetchSows(); // Refresh the sow list
          }}
        />
      )}

      {/* Matrix Treatment Form */}
      <MatrixTreatmentForm
        selectedSows={getSelectedSows()}
        isOpen={showMatrixForm}
        onClose={() => {
          setShowMatrixForm(false);
        }}
        onSuccess={() => {
          clearSelection();
          fetchSows();
        }}
      />
    </div>
  );
}
