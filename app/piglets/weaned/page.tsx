'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from '@/lib/supabase';
import { TrendingUp, ArrowLeft, Edit, Trash2, FileText } from "lucide-react";
import Link from 'next/link';
import PigletEditModal from '@/components/PigletEditModal';
import PedigreeCertificate from '@/components/PedigreeCertificate';
import { toast } from 'sonner';

type Piglet = {
  id: string;
  ear_tag: string | null;
  right_ear_notch: number | null;
  left_ear_notch: number | null;
  birth_weight: number;
  weaning_weight: number;
  weaned_date: string;
  status: string;
  notes: string | null;
  sire_id: string | null;
  dam_id: string | null;
  farrowing: {
    sow: {
      id: string;
      ear_tag: string;
      name: string | null;
    };
    actual_farrowing_date: string;
  };
};

export default function WeanedPigletsPage() {
  const [piglets, setPiglets] = useState<Piglet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPiglet, setSelectedPiglet] = useState<Piglet | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPedigreeModalOpen, setIsPedigreeModalOpen] = useState(false);
  const [pedigreeePigletId, setPedigreePigletId] = useState<string | null>(null);
  const [selectedPigletIds, setSelectedPigletIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  useEffect(() => {
    fetchWeanedPiglets();
  }, []);

  const fetchWeanedPiglets = async () => {
    try {
      const { data, error } = await supabase
        .from('piglets')
        .select(`
          id,
          ear_tag,
          right_ear_notch,
          left_ear_notch,
          birth_weight,
          weaning_weight,
          weaned_date,
          status,
          notes,
          sire_id,
          dam_id,
          farrowings!inner (
            actual_farrowing_date,
            sows!inner (
              id,
              ear_tag,
              name
            )
          )
        `)
        .eq('status', 'weaned')
        .order('weaned_date', { ascending: false });

      if (error) throw error;

      // Transform the nested data structure
      const transformedData = data?.map((piglet: any) => ({
        ...piglet,
        farrowing: {
          actual_farrowing_date: piglet.farrowings.actual_farrowing_date,
          sow: piglet.farrowings.sows,
        },
      })) || [];

      setPiglets(transformedData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch weaned piglets');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getIdentification = (piglet: Piglet) => {
    if (piglet.ear_tag) return piglet.ear_tag;
    if (piglet.right_ear_notch || piglet.left_ear_notch) {
      return `Notch: ${piglet.right_ear_notch || 0}-${piglet.left_ear_notch || 0}`;
    }
    return 'No ID';
  };

  const calculateWeightGain = (piglet: Piglet) => {
    return (piglet.weaning_weight - piglet.birth_weight).toFixed(2);
  };

  const togglePigletSelection = (pigletId: string) => {
    setSelectedPigletIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pigletId)) {
        newSet.delete(pigletId);
      } else {
        newSet.add(pigletId);
      }
      return newSet;
    });
  };

  const selectAllPiglets = () => {
    setSelectedPigletIds(new Set(piglets.map(p => p.id)));
  };

  const clearSelection = () => {
    setSelectedPigletIds(new Set());
  };

  const bulkDeletePiglets = async () => {
    const selectedCount = selectedPigletIds.size;

    if (selectedCount === 0) {
      return;
    }

    const confirmMessage = `Are you sure you want to delete ${selectedCount} piglet${selectedCount > 1 ? 's' : ''}?\n\n` +
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

      const selectedPigletIdArray = Array.from(selectedPigletIds);

      // Delete piglets
      const { error: pigletsError } = await supabase
        .from('piglets')
        .delete()
        .eq('user_id', user.id)
        .in('id', selectedPigletIdArray);

      if (pigletsError) throw pigletsError;

      toast.success(`${selectedCount} piglet${selectedCount > 1 ? 's' : ''} deleted successfully!`);
      clearSelection();
      await fetchWeanedPiglets();
    } catch (err: any) {
      console.error('Error deleting piglets:', err);
      toast.error(err.message || 'Failed to delete piglets');
    } finally {
      setBulkDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-red-700">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-3">
            <TrendingUp className="h-8 w-8 text-red-700" />
            <h1 className="text-2xl font-bold text-gray-900">Weaned Piglets</h1>
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
            {selectedPigletIds.size > 0 && (
              <>
                <span className="text-sm font-medium text-gray-700">
                  {selectedPigletIds.size} selected
                </span>
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  Clear
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={bulkDeletePiglets}
                  disabled={bulkDeleting}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {bulkDeleting ? 'Deleting...' : `Delete (${selectedPigletIds.size})`}
                </Button>
              </>
            )}
            {piglets.length > 0 && selectedPigletIds.size !== piglets.length && selectedPigletIds.size === 0 && (
              <Button variant="outline" size="sm" onClick={selectAllPiglets}>
                Select All
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Weaned Piglets</CardTitle>
            <CardDescription>
              {loading ? 'Loading...' : `${piglets.length} piglet${piglets.length !== 1 ? 's' : ''} weaned and tracked`}
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
                Loading weaned piglets...
              </div>
            ) : piglets.length === 0 ? (
              <div className="text-center py-12">
                <TrendingUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No weaned piglets yet</h3>
                <p className="text-gray-600">
                  Use the &quot;Wean Litter&quot; feature to record individual piglets when weaning
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={piglets.length > 0 && selectedPigletIds.size === piglets.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              selectAllPiglets();
                            } else {
                              clearSelection();
                            }
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-red-700 focus:ring-red-600 cursor-pointer"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Identification
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mother
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Birth Weight
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Weaning Weight
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Weight Gain
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Weaned Date
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {piglets.map((piglet) => (
                      <tr key={piglet.id} className="hover:bg-gray-50">
                        <td className="px-3 py-4">
                          <input
                            type="checkbox"
                            checked={selectedPigletIds.has(piglet.id)}
                            onChange={() => togglePigletSelection(piglet.id)}
                            className="h-4 w-4 rounded border-gray-300 text-red-700 focus:ring-red-600 cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {getIdentification(piglet)}
                          </div>
                          {piglet.ear_tag && (piglet.right_ear_notch || piglet.left_ear_notch) && (
                            <div className="text-xs text-gray-500">
                              Notch: {piglet.right_ear_notch || 0}-{piglet.left_ear_notch || 0}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {piglet.farrowing.sow.name || piglet.farrowing.sow.ear_tag}
                          </div>
                          <div className="text-xs text-gray-500">
                            Tag: {piglet.farrowing.sow.ear_tag}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {piglet.birth_weight} kg
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {piglet.weaning_weight} kg
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="text-red-700 font-medium">
                            +{calculateWeightGain(piglet)} kg
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(piglet.weaned_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setPedigreePigletId(piglet.id);
                                setIsPedigreeModalOpen(true);
                              }}
                              title="View Pedigree"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedPiglet(piglet);
                                setIsEditModalOpen(true);
                              }}
                              title="Edit Piglet"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Edit Piglet Modal */}
      <PigletEditModal
        piglet={selectedPiglet}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedPiglet(null);
        }}
        onSuccess={() => {
          fetchWeanedPiglets();
        }}
      />

      {/* Pedigree Certificate Modal */}
      {pedigreeePigletId && (
        <PedigreeCertificate
          pigletId={pedigreeePigletId}
          isOpen={isPedigreeModalOpen}
          onClose={() => {
            setIsPedigreeModalOpen(false);
            setPedigreePigletId(null);
          }}
        />
      )}
    </div>
  );
}
