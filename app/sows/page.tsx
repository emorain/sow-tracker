'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from '@/lib/supabase';
import { PiggyBank, ArrowLeft, Plus, Upload, Trash2, ArrowRightLeft, Syringe } from "lucide-react";
import Link from 'next/link';
import Image from 'next/image';
import SowDetailModal from '@/components/SowDetailModal';
import MatrixTreatmentForm from '@/components/MatrixTreatmentForm';
import RecordBreedingForm from '@/components/RecordBreedingForm';
import BulkBreedingForm from '@/components/BulkBreedingForm';
import TransferAnimalModal from '@/components/TransferAnimalModal';
import PregnancyCheckModal from '@/components/PregnancyCheckModal';
import AssignHousingModal from '@/components/AssignHousingModal';
import BulkAssignHousingModal from '@/components/BulkAssignHousingModal';
import { AIDoseModal } from '@/components/AIDoseModal';
import BulkActionConfirmationModal from '@/components/BulkActionConfirmationModal';
import SowCard from '@/components/SowCard';
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
  housing_move_in_date?: string | null;
  breeding_status?: {
    is_bred: boolean;
    breeding_date: string | null;
    days_since_breeding: number | null;
    status_label: string | null;
    pregnancy_confirmed: boolean;
    needs_pregnancy_check: boolean;
  };
  current_breeding_method?: 'natural' | 'ai' | null;
  current_breeding_attempt_id?: string | null;
  current_boar_id?: string | null;
  breeding_cycle_complete?: boolean;
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
  const [selectedSowIds, setSelectedSowIds] = useState<Set<string>>(new Set());
  const [showMatrixForm, setShowMatrixForm] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showBreedingForm, setShowBreedingForm] = useState(false);
  const [sowToBreed, setSowToBreed] = useState<Sow | null>(null);
  const [showBulkBreedingForm, setShowBulkBreedingForm] = useState(false);
  const [markingReturnToHeat, setMarkingReturnToHeat] = useState<string | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [sowToTransfer, setSowToTransfer] = useState<Sow | null>(null);
  const [showPregnancyCheck, setShowPregnancyCheck] = useState(false);
  const [sowForPregnancyCheck, setSowForPregnancyCheck] = useState<{ sow: Sow; breedingAttempt: any } | null>(null);
  const [showAssignHousing, setShowAssignHousing] = useState(false);
  const [sowForHousing, setSowForHousing] = useState<Sow | null>(null);
  const [showBulkAssignHousing, setShowBulkAssignHousing] = useState(false);
  const [showAIDoseModal, setShowAIDoseModal] = useState(false);
  const [sowForAIDose, setSowForAIDose] = useState<Sow | null>(null);
  const [aiDoses, setAiDoses] = useState<Record<string, any[]>>({});
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [bulkDeleteImpact, setBulkDeleteImpact] = useState<{
    items: Array<{ id: string; ear_tag: string; name?: string | null; additionalInfo?: string }>;
    impactSummary: Array<{ label: string; count: number }>;
  } | null>(null);

  useEffect(() => {
    fetchSows();
    fetchAIDoses();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [sows, activeFilter, farrowingCounts]);

  const fetchSows = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in to view sows');
        setLoading(false);
        return;
      }

      // Use optimized view instead of N+1 queries
      // Performance: 151 queries → 1 query for 50 sows
      const { data, error } = await supabase
        .from('sow_list_view')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch current housing assignments (location history)
      const { data: locationData } = await supabase
        .from('location_history')
        .select('sow_id, moved_in_date, moved_out_date')
        .eq('user_id', user.id)
        .is('moved_out_date', null)
        .order('moved_in_date', { ascending: false });

      // Create map of sow_id -> move_in_date
      const housingMoveInMap: Record<string, string> = {};
      (locationData || []).forEach(loc => {
        if (loc.sow_id && !housingMoveInMap[loc.sow_id]) {
          housingMoveInMap[loc.sow_id] = loc.moved_in_date;
        }
      });

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

          // Only show breeding status if sow hasn't farrowed yet
          if (sow.current_breeding_date && !sow.has_active_farrowing) {
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
            housing_move_in_date: housingMoveInMap[sow.id] || null,
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

  const fetchAIDoses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: doses, error } = await supabase
        .from('ai_doses')
        .select('*')
        .eq('user_id', user.id)
        .order('dose_number');

      if (error) throw error;

      // Group doses by breeding_attempt_id
      const dosesMap: Record<string, any[]> = {};
      (doses || []).forEach((dose: any) => {
        if (!dosesMap[dose.breeding_attempt_id]) {
          dosesMap[dose.breeding_attempt_id] = [];
        }
        dosesMap[dose.breeding_attempt_id].push(dose);
      });

      setAiDoses(dosesMap);
    } catch (error) {
      console.error('Failed to fetch AI doses:', error);
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

  const getHousingStalenessInfo = (sow: Sow) => {
    if (!sow.housing_move_in_date || !sow.housing_unit) {
      return null;
    }

    const moveInDate = new Date(sow.housing_move_in_date);
    const today = new Date();
    const daysSinceMoveIn = Math.floor((today.getTime() - moveInDate.getTime()) / (1000 * 60 * 60 * 24));

    // Show warning if sow has been in same housing for more than 30 days
    // (except farrowing units which are expected to be longer)
    if (daysSinceMoveIn > 30 && sow.housing_unit.type !== 'farrowing') {
      return {
        daysInHousing: daysSinceMoveIn,
        badge: {
          text: `${daysSinceMoveIn}d in ${sow.housing_unit.name}`,
          color: daysSinceMoveIn > 60 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800',
        },
      };
    }

    return null;
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

  const handleCompleteBreedingCycle = async (breedingAttemptId: string, sowId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in');
        return;
      }

      // Mark breeding cycle as complete
      const { error } = await supabase
        .from('breeding_attempts')
        .update({
          breeding_cycle_complete: true,
          breeding_cycle_completed_at: new Date().toISOString()
        })
        .eq('id', breedingAttemptId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Breeding cycle marked complete. Pregnancy check countdown started from first dose.');
      await fetchSows(); // Refresh to show updated status
    } catch (err: any) {
      console.error('Error completing breeding cycle:', err);
      toast.error(err.message || 'Failed to complete breeding cycle');
    }
  };

  const prepareBulkDelete = async () => {
    const selectedCount = selectedSowIds.size;

    if (selectedCount === 0) {
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in');
        return;
      }

      const selectedSowIdArray = Array.from(selectedSowIds);

      // Get selected sows with details
      const selectedSows = sows.filter(s => selectedSowIds.has(s.id));

      // Fetch impact counts
      const [breedingResult, farrowingResult, pigletResult, matrixResult, locationResult] = await Promise.all([
        supabase.from('breeding_attempts').select('id', { count: 'exact', head: true }).in('sow_id', selectedSowIdArray).eq('user_id', user.id),
        supabase.from('farrowings').select('id', { count: 'exact', head: true }).in('sow_id', selectedSowIdArray).eq('user_id', user.id),
        supabase.from('piglets').select('id', { count: 'exact', head: true }).in('sow_id', selectedSowIdArray).eq('user_id', user.id),
        supabase.from('matrix_treatments').select('id', { count: 'exact', head: true }).in('sow_id', selectedSowIdArray).eq('user_id', user.id),
        supabase.from('location_history').select('id', { count: 'exact', head: true }).in('sow_id', selectedSowIdArray).eq('user_id', user.id),
      ]);

      const impactSummary = [
        { label: 'breeding attempt records', count: breedingResult.count || 0 },
        { label: 'farrowing records', count: farrowingResult.count || 0 },
        { label: 'piglet records', count: pigletResult.count || 0 },
        { label: 'matrix treatment records', count: matrixResult.count || 0 },
        { label: 'location history records', count: locationResult.count || 0 },
      ].filter(item => item.count > 0);

      // Prepare items for display
      const items = selectedSows.map(sow => ({
        id: sow.id,
        ear_tag: sow.ear_tag,
        name: sow.name,
        additionalInfo: `${farrowingCounts[sow.id] || 0} farrowings`,
      }));

      setBulkDeleteImpact({ items, impactSummary });
      setShowBulkDeleteConfirm(true);
    } catch (error: any) {
      console.error('Error preparing bulk delete:', error);
      toast.error('Failed to prepare delete preview');
    }
  };

  const bulkDeleteSows = async () => {
    setBulkDeleting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in');
        return;
      }

      const selectedSowIdArray = Array.from(selectedSowIds);
      const selectedCount = selectedSowIdArray.length;

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

      // Break circular foreign key: set breeding_attempt_id to NULL in farrowings
      if (farrowingIds.length > 0) {
        const { error: breakFkError } = await supabase
          .from('farrowings')
          .update({ breeding_attempt_id: null })
          .eq('user_id', user.id)
          .in('id', farrowingIds);

        if (breakFkError) throw breakFkError;
      }

      // Delete breeding attempts (now safe after breaking FK)
      const { error: breedingError } = await supabase
        .from('breeding_attempts')
        .delete()
        .eq('user_id', user.id)
        .in('sow_id', selectedSowIdArray);

      if (breedingError) throw breedingError;

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

      // Force refresh the sow list
      setLoading(true);
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
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const selectedSows = getSelectedSows();
                    if (selectedSows.length === 1) {
                      setSowToTransfer(selectedSows[0]);
                      setShowTransferModal(true);
                    } else {
                      toast.error('Please select exactly one sow to transfer');
                    }
                  }}
                >
                  <ArrowRightLeft className="mr-2 h-4 w-4" />
                  Transfer ({selectedSowIds.size})
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={prepareBulkDelete}
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
              onClick={() => setShowBulkBreedingForm(true)}
              disabled={selectedSowIds.size === 0}
              className="bg-red-600 hover:bg-red-700"
            >
              <Syringe className="h-4 w-4 mr-1" />
              Bulk Breed ({selectedSowIds.size})
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowBulkAssignHousing(true)}
              disabled={selectedSowIds.size === 0}
            >
              Assign Housing ({selectedSowIds.size})
            </Button>
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
                {filteredSows.map((sow) => (
                  <SowCard
                    key={sow.id}
                    sow={sow}
                    isSelected={selectedSowIds.has(sow.id)}
                    farrowingCount={farrowingCounts[sow.id] || 0}
                    isInFarrowing={activeFarrowings.has(sow.id)}
                    onToggleSelection={toggleSowSelection}
                    onBreed={(sow) => {
                      setSowToBreed(sow);
                      setShowBreedingForm(true);
                    }}
                    onPregnancyCheck={(sow, breedingAttempt) => {
                      setSowForPregnancyCheck({ sow, breedingAttempt });
                      setShowPregnancyCheck(true);
                    }}
                    onAIDose={(sow) => {
                      setSowForAIDose(sow);
                      setShowAIDoseModal(true);
                    }}
                    onCompleteBreeding={handleCompleteBreedingCycle}
                    onViewDetails={(sow) => {
                      setSelectedSow(sow);
                      setIsModalOpen(true);
                    }}
                    onAssignHousing={(sow) => {
                      setSowForHousing(sow);
                      setShowAssignHousing(true);
                    }}
                    calculateAge={calculateAge}
                    getStatusColor={getStatusColor}
                    getHousingStalenessInfo={getHousingStalenessInfo}
                    getLocationBadge={getLocationBadge}
                  />
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
        onDelete={() => {
          fetchSows(); // Refresh the sow list after deletion
        }}
      />


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

      {/* Bulk Breeding Form */}
      {showBulkBreedingForm && selectedSowIds.size > 0 && (
        <BulkBreedingForm
          sows={getSelectedSows()}
          isOpen={showBulkBreedingForm}
          onClose={() => {
            setShowBulkBreedingForm(false);
          }}
          onSuccess={() => {
            clearSelection();
            fetchSows();
          }}
        />
      )}

      {/* Bulk Assign Housing Modal */}
      {showBulkAssignHousing && selectedSowIds.size > 0 && (
        <BulkAssignHousingModal
          sows={getSelectedSows()}
          onClose={() => {
            setShowBulkAssignHousing(false);
          }}
          onSuccess={() => {
            clearSelection();
            fetchSows();
          }}
        />
      )}

      {/* AI Dose Modal */}
      {showAIDoseModal && sowForAIDose && sowForAIDose.current_breeding_attempt_id && (
        <AIDoseModal
          breedingAttempt={{
            id: sowForAIDose.current_breeding_attempt_id,
            sow_id: sowForAIDose.id,
            boar_id: sowForAIDose.current_boar_id || undefined,
            breeding_date: sowForAIDose.breeding_status?.breeding_date || '',
            breeding_method: 'ai',
          }}
          existingDoses={aiDoses[sowForAIDose.current_breeding_attempt_id] || []}
          onClose={() => {
            setShowAIDoseModal(false);
            setSowForAIDose(null);
          }}
          onSuccess={() => {
            fetchAIDoses();
            fetchSows();
          }}
        />
      )}

      {/* Bulk Delete Confirmation Modal */}
      {bulkDeleteImpact && (
        <BulkActionConfirmationModal
          isOpen={showBulkDeleteConfirm}
          title="Confirm Bulk Delete"
          actionType="delete"
          items={bulkDeleteImpact.items}
          impactSummary={bulkDeleteImpact.impactSummary}
          warningMessage="This will permanently delete all selected sows and their associated records from the database."
          confirmLabel="Yes, Delete All"
          onConfirm={() => {
            setShowBulkDeleteConfirm(false);
            bulkDeleteSows();
          }}
          onCancel={() => {
            setShowBulkDeleteConfirm(false);
            setBulkDeleteImpact(null);
          }}
          loading={bulkDeleting}
        />
      )}
    </div>
  );
}
