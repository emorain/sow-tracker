'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from '@/lib/supabase';
import { PiggyBank, ArrowLeft, Plus, Trash2, ArrowRightLeft } from "lucide-react";
import Link from 'next/link';
import BoarDetailModal from '@/components/BoarDetailModal';
import TransferAnimalModal from '@/components/TransferAnimalModal';
import { toast } from 'sonner';

type Boar = {
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
  created_at: string;
  sire_id: string | null;
  dam_id: string | null;
  boar_type: 'live' | 'ai_semen';
  semen_straws: number | null;
  supplier: string | null;
  collection_date: string | null;
};

type FilterType = 'all' | 'active' | 'live' | 'ai_semen' | 'culled' | 'sold';

export default function BoarsListPage() {
  const [boars, setBoars] = useState<Boar[]>([]);
  const [filteredBoars, setFilteredBoars] = useState<Boar[]>([]);
  const [breedingCounts, setBreedingCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedBoar, setSelectedBoar] = useState<Boar | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBoarIds, setSelectedBoarIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [boarToTransfer, setBoarToTransfer] = useState<Boar | null>(null);

  useEffect(() => {
    fetchBoars();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [boars, activeFilter]);

  const fetchBoars = async () => {
    try {
      const { data, error } = await supabase
        .from('boars')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBoars(data || []);

      // Fetch breeding counts
      if (data) {
        const counts: Record<string, number> = {};
        for (const boar of data) {
          const { count } = await supabase
            .from('farrowings')
            .select('*', { count: 'exact', head: true })
            .eq('boar_id', boar.id);
          counts[boar.id] = count || 0;
        }
        setBreedingCounts(counts);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch boars');
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    let filtered = [...boars];

    switch (activeFilter) {
      case 'active':
        filtered = boars.filter(boar => boar.status === 'active');
        break;
      case 'live':
        filtered = boars.filter(boar => boar.boar_type === 'live');
        break;
      case 'ai_semen':
        filtered = boars.filter(boar => boar.boar_type === 'ai_semen');
        break;
      case 'culled':
        filtered = boars.filter(boar => boar.status === 'culled');
        break;
      case 'sold':
        filtered = boars.filter(boar => boar.status === 'sold');
        break;
      case 'all':
      default:
        break;
    }

    setFilteredBoars(filtered);
  };

  const getFilterCounts = () => {
    return {
      all: boars.length,
      active: boars.filter(b => b.status === 'active').length,
      live: boars.filter(b => b.boar_type === 'live').length,
      ai_semen: boars.filter(b => b.boar_type === 'ai_semen').length,
      culled: boars.filter(b => b.status === 'culled').length,
      sold: boars.filter(b => b.status === 'sold').length,
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
        return 'bg-red-100 text-red-900';
      case 'culled':
        return 'bg-red-100 text-red-800';
      case 'sold':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const toggleBoarSelection = (boarId: string) => {
    setSelectedBoarIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(boarId)) {
        newSet.delete(boarId);
      } else {
        newSet.add(boarId);
      }
      return newSet;
    });
  };

  const selectAllBoars = () => {
    setSelectedBoarIds(new Set(filteredBoars.map(b => b.id)));
  };

  const clearSelection = () => {
    setSelectedBoarIds(new Set());
  };

  const bulkDeleteBoars = async () => {
    const selectedCount = selectedBoarIds.size;

    if (selectedCount === 0) {
      return;
    }

    const confirmMessage = `Are you sure you want to delete ${selectedCount} boar${selectedCount > 1 ? 's' : ''}?\n\n` +
      `This will permanently delete:\n` +
      `- ${selectedCount} boar record${selectedCount > 1 ? 's' : ''}\n` +
      `- All associated breeding records\n\n` +
      `This action CANNOT be undone!`;

    if (!confirm(confirmMessage)) {
      return;
    }

    setBulkDeleting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in');
        return;
      }

      const selectedBoarIdArray = Array.from(selectedBoarIds);

      // Update farrowings to remove boar reference
      const { error: farrowingsError } = await supabase
        .from('farrowings')
        .update({ boar_id: null })
        .eq('user_id', user.id)
        .in('boar_id', selectedBoarIdArray);

      if (farrowingsError) throw farrowingsError;

      // Delete boars
      const { error: boarsError } = await supabase
        .from('boars')
        .delete()
        .eq('user_id', user.id)
        .in('id', selectedBoarIdArray);

      if (boarsError) throw boarsError;

      toast.success(`${selectedCount} boar${selectedCount > 1 ? 's' : ''} deleted successfully!`);
      clearSelection();
      await fetchBoars();
    } catch (err: any) {
      console.error('Error deleting boars:', err);
      toast.error(err.message || 'Failed to delete boars');
    } finally {
      setBulkDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-red-700">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <PiggyBank className="h-8 w-8 text-red-700" />
              <h1 className="text-2xl font-bold text-gray-900">Boar Management</h1>
            </div>
            <div className="flex gap-2">
              <Link href="/boars/new">
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Live Boar
                </Button>
              </Link>
              <Link href="/boars/ai-semen/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add AI Semen
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

          {/* Selection and Bulk Actions */}
          <div className="flex items-center gap-2">
            {selectedBoarIds.size > 0 && (
              <>
                <span className="text-sm font-medium text-gray-700">
                  {selectedBoarIds.size} selected
                </span>
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  Clear
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={bulkDeleteBoars}
                  disabled={bulkDeleting}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {bulkDeleting ? 'Deleting...' : `Delete (${selectedBoarIds.size})`}
                </Button>
              </>
            )}
            {filteredBoars.length > 0 && selectedBoarIds.size !== filteredBoars.length && selectedBoarIds.size === 0 && (
              <Button variant="outline" size="sm" onClick={selectAllBoars}>
                Select All
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Boars</CardTitle>
            <CardDescription>
              {loading ? 'Loading...' : `${filteredBoars.length} boar${filteredBoars.length !== 1 ? 's' : ''} ${activeFilter !== 'all' ? `(${activeFilter})` : 'in your herd'}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filter Tabs */}
            {!loading && (
              <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b">
                {(['all', 'active', 'live', 'ai_semen', 'culled', 'sold'] as FilterType[]).map((filter) => {
                  const counts = getFilterCounts();
                  const count = counts[filter];
                  const isActive = activeFilter === filter;

                  const filterLabels: Record<FilterType, string> = {
                    all: 'All',
                    active: 'Active',
                    live: 'Live Boars',
                    ai_semen: 'AI Semen',
                    culled: 'Culled',
                    sold: 'Sold'
                  };

                  return (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-red-700 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {filterLabels[filter]} ({count})
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
                Loading boars...
              </div>
            ) : filteredBoars.length === 0 ? (
              <div className="text-center py-12">
                <PiggyBank className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No boars found</h3>
                <p className="text-gray-600 mb-4">
                  {activeFilter !== 'all'
                    ? `No ${activeFilter} boars in your herd`
                    : 'Get started by adding your first boar'}
                </p>
                {activeFilter === 'all' && (
                  <Link href="/boars/new">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add New Boar
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBoars.map((boar) => {
                  const breedingCount = breedingCounts[boar.id] || 0;
                  return (
                    <div
                      key={boar.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {/* Top row on mobile: Checkbox, Photo, Name & Badges */}
                      <div className="flex items-center gap-3 sm:gap-4">
                        {/* Selection Checkbox */}
                        <div className="flex-shrink-0">
                          <input
                            type="checkbox"
                            checked={selectedBoarIds.has(boar.id)}
                            onChange={() => toggleBoarSelection(boar.id)}
                            className="h-4 w-4 rounded border-gray-300 text-red-700 focus:ring-red-600 cursor-pointer"
                          />
                        </div>

                        {/* Boar Photo */}
                        <div className="flex-shrink-0">
                          {boar.photo_url ? (
                            <img
                              src={boar.photo_url}
                              alt={boar.name || boar.ear_tag}
                              className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-gray-200"
                            />
                          ) : (
                            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-200 flex items-center justify-center">
                              <PiggyBank className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Boar Name & Badges - Mobile only */}
                        <div className="flex-1 min-w-0 sm:hidden">
                          <h3 className="text-base font-semibold text-gray-900 truncate">
                            {boar.name || boar.ear_tag}
                          </h3>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {boar.boar_type === 'ai_semen' && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                AI Semen
                                {boar.semen_straws !== null && ` - ${boar.semen_straws} straws`}
                              </span>
                            )}
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(boar.status)}`}>
                              {boar.status}
                            </span>
                            {breedingCount > 0 && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {breedingCount} breeding{breedingCount !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Boar Info - Desktop and mobile details */}
                      <div className="flex-1 min-w-0">
                        {/* Desktop name & badges */}
                        <div className="hidden sm:flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {boar.name || boar.ear_tag}
                          </h3>
                          {boar.boar_type === 'ai_semen' && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              AI Semen
                              {boar.semen_straws !== null && ` - ${boar.semen_straws} straws`}
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(boar.status)}`}>
                            {boar.status}
                          </span>
                          {breedingCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {breedingCount} breeding{breedingCount !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>

                        {/* Info grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-1.5 sm:gap-2 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Ear Tag:</span> {boar.ear_tag}
                          </div>
                          <div>
                            <span className="font-medium">Breed:</span> {boar.breed}
                          </div>
                          <div>
                            <span className="font-medium">Age:</span> {calculateAge(boar.birth_date)}
                          </div>
                          {(boar.right_ear_notch !== null || boar.left_ear_notch !== null) && (
                            <div>
                              <span className="font-medium">Notches:</span> R:{boar.right_ear_notch || '-'} L:{boar.left_ear_notch || '-'}
                            </div>
                          )}
                          {boar.registration_number && (
                            <div className="sm:col-span-2">
                              <span className="font-medium">Registration:</span> {boar.registration_number}
                            </div>
                          )}
                          {boar.boar_type === 'ai_semen' && boar.supplier && (
                            <div className="sm:col-span-2">
                              <span className="font-medium">Supplier:</span> {boar.supplier}
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
                            setSelectedBoar(boar);
                            setIsModalOpen(true);
                          }}
                          className="w-full sm:w-auto"
                        >
                          View Details
                        </Button>
                        {boar.status === 'active' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setBoarToTransfer(boar);
                              setShowTransferModal(true);
                            }}
                            className="w-full sm:w-auto"
                          >
                            <ArrowRightLeft className="mr-2 h-4 w-4" />
                            Transfer
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Boar Detail Modal */}
      <BoarDetailModal
        boar={selectedBoar}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedBoar(null);
        }}
        onUpdate={fetchBoars}
      />

      {/* Transfer Animal Modal */}
      {boarToTransfer && (
        <TransferAnimalModal
          animalType="boar"
          animalId={boarToTransfer.id}
          animalEarTag={boarToTransfer.ear_tag}
          animalName={boarToTransfer.name || undefined}
          isOpen={showTransferModal}
          onClose={() => {
            setShowTransferModal(false);
            setBoarToTransfer(null);
          }}
          onTransferCreated={() => {
            fetchBoars();
          }}
        />
      )}
    </div>
  );
}
