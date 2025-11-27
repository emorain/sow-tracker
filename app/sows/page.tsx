'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from '@/lib/supabase';
import { PiggyBank, ArrowLeft, Plus, Upload, Trash2, ArrowRightLeft } from "lucide-react";
import Link from 'next/link';
import Image from 'next/image';
import SowDetailModal from '@/components/SowDetailModal';
import MoveToFarrowingForm from '@/components/MoveToFarrowingForm';
import MatrixTreatmentForm from '@/components/MatrixTreatmentForm';
import RecordBreedingForm from '@/components/RecordBreedingForm';
import TransferAnimalModal from '@/components/TransferAnimalModal';
import PregnancyCheckModal from '@/components/PregnancyCheckModal';
import AssignHousingModal from '@/components/AssignHousingModal';
import { toast } from 'sonner';

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
  housing_unit_id: string | null;
  sire_id: string | null;
  dam_id: string | null;
  created_at: string;
  housing_unit?: {
    name: string;
    type: string;
  };
  breeding_status?: {
    is_bred: boolean;
    breeding_date: string | null;
    days_since_breeding: number | null;
    status_label: string | null;
    pregnancy_confirmed: boolean;
    needs_pregnancy_check: boolean;
  };
};

type FilterType = 'all' | 'active' | 'sows' | 'gilts' | 'bred' | 'pregnant' | 'culled' | 'sold';

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
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showBreedingForm, setShowBreedingForm] = useState(false);
  const [sowToBreed, setSowToBreed] = useState<Sow | null>(null);
  const [markingReturnToHeat, setMarkingReturnToHeat] = useState<string | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [sowToTransfer, setSowToTransfer] = useState<Sow | null>(null);
  const [showPregnancyCheck, setShowPregnancyCheck] = useState(false);
  const [sowForPregnancyCheck, setSowForPregnancyCheck] = useState<{ sow: Sow; breedingAttempt: any } | null>(null);
  const [showAssignHousing, setShowAssignHousing] = useState(false);
  const [sowForHousing, setSowForHousing] = useState<Sow | null>(null);

  useEffect(() => {
    fetchSows();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [sows, activeFilter, farrowingCounts]);

  const fetchSows = async () => {
    try {
      // Use optimized view instead of N+1 queries
      // Performance: 151 queries → 1 query for 50 sows
      const { data, error } = await supabase
        .from('sow_list_view')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const today = new Date();
        const counts: Record<string, number> = {};
        const activeSet = new Set<string>();

        // Transform view data into component format
        const transformedSows = data.map((sow: any) => {
          // Store farrowing counts and active status
          counts[sow.id] = sow.farrowing_count || 0;
          if (sow.has_active_farrowing) {
            activeSet.add(sow.id);
          }

          // Calculate breeding status from view data
          let breeding_status: Sow['breeding_status'] = {
            is_bred: false,
            breeding_date: null,
            days_since_breeding: null,
            status_label: null,
            pregnancy_confirmed: false,
            needs_pregnancy_check: false,
          };

          if (sow.current_breeding_date) {
            const breedingDate = new Date(sow.current_breeding_date);
            const daysSince = Math.floor((today.getTime() - breedingDate.getTime()) / (1000 * 60 * 60 * 24));
            const pregnancyConfirmed = sow.pregnancy_confirmed === true;

            let statusLabel = '';
            if (pregnancyConfirmed) {
              statusLabel = `Pregnant - Day ${daysSince}`;
            } else if (sow.pregnancy_confirmed === false) {
              statusLabel = `Returned to Heat`;
            } else if (daysSince >= 18 && daysSince < 21) {
              statusLabel = `Day ${daysSince} - Ready for Pregnancy Check`;
            } else if (daysSince >= 21) {
              statusLabel = `Day ${daysSince} - Pregnancy Check Overdue`;
            } else {
              statusLabel = `Bred - Day ${daysSince}`;
            }

            breeding_status = {
              is_bred: true,
              breeding_date: sow.current_breeding_date,
              days_since_breeding: daysSince,
              status_label: statusLabel,
              pregnancy_confirmed: pregnancyConfirmed,
              needs_pregnancy_check: !sow.pregnancy_confirmed && daysSince >= 18,
            };
          }

          // Reconstruct housing_unit object for backward compatibility
          return {
            ...sow,
            housing_unit: sow.housing_unit_name ? {
              name: sow.housing_unit_name,
              type: sow.housing_unit_type,
            } : null,
            breeding_status,
          };
        });

        setFarrowingCounts(counts);
        setActiveFarrowings(activeSet);
        setSows(transformedSows);
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
      case 'bred':
        filtered = sows.filter(sow => sow.breeding_status?.is_bred && !sow.breeding_status?.pregnancy_confirmed);
        break;
      case 'pregnant':
        filtered = sows.filter(sow => sow.breeding_status?.pregnancy_confirmed);
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
    const bredCount = sows.filter(sow => sow.breeding_status?.is_bred && !sow.breeding_status?.pregnancy_confirmed).length;
    const pregnantCount = sows.filter(sow => sow.breeding_status?.pregnancy_confirmed).length;
    return {
      all: sows.length,
      active: sows.filter(s => s.status === 'active').length,
      sows: sowCount,
      gilts: giltCount,
      bred: bredCount,
      pregnant: pregnantCount,
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
        return 'bg-red-100 text-red-900';
      case 'culled':
        return 'bg-red-100 text-red-800';
      case 'sold':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getLocationBadge = (sow: Sow, isInFarrowing: boolean) => {
    // If sow has an active farrowing, show that regardless of database location
    if (isInFarrowing) {
      return {
        text: 'Farrowing',
        color: 'bg-orange-100 text-orange-800',
      };
    }

    // If sow is assigned to a housing unit, show that
    if (sow.housing_unit) {
      const typeColorMap: Record<string, string> = {
        gestation: 'bg-blue-100 text-blue-800',
        farrowing: 'bg-orange-100 text-orange-800',
        breeding: 'bg-pink-100 text-pink-800',
        hospital: 'bg-red-100 text-red-800',
        quarantine: 'bg-yellow-100 text-yellow-800',
        other: 'bg-gray-100 text-gray-800',
      };

      return {
        text: sow.housing_unit.name,
        color: typeColorMap[sow.housing_unit.type] || 'bg-gray-100 text-gray-800',
      };
    }

    // Fall back to generic location if available
    if (sow.current_location) {
      const locationMap: Record<string, { text: string; color: string }> = {
        breeding: { text: 'Breeding', color: 'bg-pink-100 text-pink-800' },
        gestation: { text: 'Gestation', color: 'bg-blue-100 text-blue-800' },
        farrowing: { text: 'Farrowing', color: 'bg-orange-100 text-orange-800' },
        hospital: { text: 'Hospital', color: 'bg-red-100 text-red-800' },
        quarantine: { text: 'Quarantine', color: 'bg-yellow-100 text-yellow-800' },
        other: { text: 'Other', color: 'bg-gray-100 text-gray-800' },
      };

      return locationMap[sow.current_location] || null;
    }

    return null;
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

  const handleMarkReturnToHeat = async (sowId: string) => {
    const confirmMessage =
      'Mark this sow as returned to heat?\n\n' +
      'This indicates the breeding was unsuccessful. The sow will be available for re-breeding.\n\n' +
      'This will:\n' +
      '- Delete the failed breeding record\n' +
      '- Keep breeding protocol tasks for reference\n' +
      '- Allow you to breed this sow again';

    if (!confirm(confirmMessage)) {
      return;
    }

    setMarkingReturnToHeat(sowId);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in');
        return;
      }

      // Delete the failed farrowing record (no actual farrowing occurred)
      const { error } = await supabase
        .from('farrowings')
        .delete()
        .eq('sow_id', sowId)
        .eq('user_id', user.id)
        .is('actual_farrowing_date', null);

      if (error) throw error;

      toast.success('Sow marked as returned to heat. You can now re-breed.');
      await fetchSows(); // Refresh to show updated status
    } catch (err: any) {
      console.error('Error marking return to heat:', err);
      toast.error(err.message || 'Failed to mark return to heat');
    } finally {
      setMarkingReturnToHeat(null);
    }
  };

  const bulkDeleteSows = async () => {
    const selectedCount = selectedSowIds.size;

    if (selectedCount === 0) {
      return;
    }

    const confirmMessage = `Are you sure you want to delete ${selectedCount} sow${selectedCount > 1 ? 's' : ''}?\n\n` +
      `This will permanently delete:\n` +
      `- ${selectedCount} sow record${selectedCount > 1 ? 's' : ''}\n` +
      `- All farrowing records\n` +
      `- All piglet records\n` +
      `- All matrix treatments\n` +
      `- All location history\n\n` +
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

      const selectedSowIdArray = Array.from(selectedSowIds);

      // Get all farrowing IDs for selected sows
      const { data: farrowings, error: farrowingFetchError } = await supabase
        .from('farrowings')
        .select('id')
        .in('sow_id', selectedSowIdArray);

      if (farrowingFetchError) throw farrowingFetchError;

      const farrowingIds = farrowings?.map(f => f.id) || [];

      // Delete piglets (depends on farrowings)
      if (farrowingIds.length > 0) {
        const { error: pigletsError } = await supabase
          .from('piglets')
          .delete()
          .eq('user_id', user.id)
          .in('farrowing_id', farrowingIds);

        if (pigletsError) throw pigletsError;
      }

      // Delete farrowings (depends on sows)
      const { error: farrowingsError } = await supabase
        .from('farrowings')
        .delete()
        .eq('user_id', user.id)
        .in('sow_id', selectedSowIdArray);

      if (farrowingsError) throw farrowingsError;

      // Delete matrix treatments (depends on sows)
      const { error: matrixError } = await supabase
        .from('matrix_treatments')
        .delete()
        .eq('user_id', user.id)
        .in('sow_id', selectedSowIdArray);

      if (matrixError) throw matrixError;

      // Delete sow location history (depends on sows)
      const { error: locationError } = await supabase
        .from('sow_location_history')
        .delete()
        .eq('user_id', user.id)
        .in('sow_id', selectedSowIdArray);

      if (locationError) throw locationError;

      // Finally delete sows
      const { error: sowsError } = await supabase
        .from('sows')
        .delete()
        .eq('user_id', user.id)
        .in('id', selectedSowIdArray);

      if (sowsError) throw sowsError;

      toast.success(`${selectedCount} sow${selectedCount > 1 ? 's' : ''} and all related records deleted successfully!`);
      clearSelection();
      await fetchSows();
    } catch (err: any) {
      console.error('Error deleting sows:', err);
      toast.error(err.message || 'Failed to delete sows');
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
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={bulkDeleteSows}
                  disabled={bulkDeleting}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {bulkDeleting ? 'Deleting...' : `Delete (${selectedSowIds.size})`}
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
                {(['all', 'active', 'sows', 'gilts', 'bred', 'pregnant', 'culled', 'sold'] as FilterType[]).map((filter) => {
                  const counts = getFilterCounts();
                  const count = counts[filter];
                  const isActive = activeFilter === filter;

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
                  const locationBadge = getLocationBadge(sow, isInFarrowing);
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
                          className="h-4 w-4 rounded border-gray-300 text-red-700 focus:ring-red-600 cursor-pointer"
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
                          {sow.breeding_status?.is_bred && sow.breeding_status.status_label && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              sow.breeding_status.pregnancy_confirmed
                                ? 'bg-green-100 text-green-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {sow.breeding_status.status_label}
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
                        {sow.breeding_status?.is_bred && sow.breeding_status.status_label && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            sow.breeding_status.pregnancy_confirmed
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {sow.breeding_status.status_label}
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
                        <>
                          {/* Only show Record Breeding if sow is not currently bred */}
                          {!sow.breeding_status?.is_bred && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => {
                                setSowToBreed(sow);
                                setShowBreedingForm(true);
                              }}
                              className="w-full sm:w-auto"
                            >
                              Record Breeding
                            </Button>
                          )}
                          {/* Show Pregnancy Check button for bred sows that need checking */}
                          {sow.breeding_status?.is_bred && sow.breeding_status?.needs_pregnancy_check && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={async () => {
                                // Fetch the breeding attempt details
                                const { data: breedingAttempt } = await supabase
                                  .from('breeding_attempts')
                                  .select('*')
                                  .eq('sow_id', sow.id)
                                  .in('result', ['pending'])
                                  .order('breeding_date', { ascending: false })
                                  .limit(1)
                                  .single();

                                if (breedingAttempt) {
                                  setSowForPregnancyCheck({
                                    sow,
                                    breedingAttempt: {
                                      ...breedingAttempt,
                                      days_since_breeding: sow.breeding_status?.days_since_breeding || 0
                                    }
                                  });
                                  setShowPregnancyCheck(true);
                                }
                              }}
                              className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                            >
                              Pregnancy Check
                            </Button>
                          )}
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
                        </>
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
                      {sow.status === 'active' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSowForHousing(sow);
                              setShowAssignHousing(true);
                            }}
                            className="w-full sm:w-auto"
                          >
                            Assign Housing
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSowToTransfer(sow);
                              setShowTransferModal(true);
                            }}
                            className="w-full sm:w-auto"
                          >
                            <ArrowRightLeft className="mr-2 h-4 w-4" />
                            Transfer
                          </Button>
                        </>
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

      {/* Sow Detail Modal */}
      <SowDetailModal
        sow={selectedSow}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSow(null);
        }}
        onDelete={() => {
          fetchSows(); // Refresh the sow list after deletion
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

      {/* Record Breeding Form */}
      {sowToBreed && (
        <RecordBreedingForm
          sow={{
            id: sowToBreed.id,
            ear_tag: sowToBreed.ear_tag,
            name: sowToBreed.name,
          }}
          isOpen={showBreedingForm}
          onClose={() => {
            setShowBreedingForm(false);
            setSowToBreed(null);
          }}
          onSuccess={() => {
            fetchSows(); // Refresh the sow list
          }}
        />
      )}

      {/* Transfer Animal Modal */}
      {sowToTransfer && (
        <TransferAnimalModal
          animalType="sow"
          animalId={sowToTransfer.id}
          animalEarTag={sowToTransfer.ear_tag}
          animalName={sowToTransfer.name || undefined}
          isOpen={showTransferModal}
          onClose={() => {
            setShowTransferModal(false);
            setSowToTransfer(null);
          }}
          onTransferCreated={() => {
            fetchSows();
          }}
        />
      )}

      {/* Pregnancy Check Modal */}
      {sowForPregnancyCheck && (
        <PregnancyCheckModal
          sow={sowForPregnancyCheck.sow}
          breedingAttempt={sowForPregnancyCheck.breedingAttempt}
          isOpen={showPregnancyCheck}
          onClose={() => {
            setShowPregnancyCheck(false);
            setSowForPregnancyCheck(null);
          }}
          onSuccess={() => {
            fetchSows();
          }}
        />
      )}

      {/* Assign Housing Modal */}
      {sowForHousing && showAssignHousing && (
        <AssignHousingModal
          sow={sowForHousing}
          onClose={() => {
            setShowAssignHousing(false);
            setSowForHousing(null);
          }}
          onSuccess={() => {
            fetchSows();
          }}
        />
      )}
    </div>
  );
}
