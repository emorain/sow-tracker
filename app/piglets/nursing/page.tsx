'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/lib/organization-context';
import { Baby, ArrowLeft, Edit, Trash2, Download } from "lucide-react";
import Link from 'next/link';
import NursingPigletModal from '@/components/NursingPigletModal';
import { toast } from 'sonner';
import { downloadCSV, formatDateForCSV } from '@/lib/csv-export';

type NursingPiglet = {
  id: string;
  ear_tag: string | null;
  right_ear_notch: number | null;
  left_ear_notch: number | null;
  sex: string | null;
  birth_weight: number | null;
  ear_notch_date: string | null;
  castration_date: string | null;
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

export default function NursingPigletsPage() {
  const { selectedOrganizationId } = useOrganization();
  const [piglets, setPiglets] = useState<NursingPiglet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPiglet, setSelectedPiglet] = useState<NursingPiglet | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPigletIds, setSelectedPigletIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  useEffect(() => {
    if (selectedOrganizationId) {
      fetchNursingPiglets();
    }
  }, [selectedOrganizationId]);

  const fetchNursingPiglets = async () => {
    try {
      if (!selectedOrganizationId) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('piglets')
        .select(`
          id,
          ear_tag,
          right_ear_notch,
          left_ear_notch,
          sex,
          birth_weight,
          ear_notch_date,
          castration_date,
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
        .eq('organization_id', selectedOrganizationId)
        .eq('status', 'nursing')
        .order('created_at', { ascending: false});

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
      setError(err.message || 'Failed to fetch nursing piglets');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getIdentification = (piglet: NursingPiglet) => {
    if (piglet.ear_tag) return piglet.ear_tag;
    if (piglet.right_ear_notch || piglet.left_ear_notch) {
      return `Notch: ${piglet.right_ear_notch || 0}-${piglet.left_ear_notch || 0}`;
    }
    return 'No ID';
  };

  const getAge = (farrowingDate: string) => {
    const birth = new Date(farrowingDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - birth.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} days`;
  };

  const getSexBadge = (sex: string | null) => {
    if (!sex || sex === 'unknown') return <span className="text-xs text-muted-foreground">Unknown</span>;
    if (sex === 'male') return <span className="text-xs text-info font-medium">Male</span>;
    if (sex === 'female') return <span className="text-xs text-pink-600 font-medium">Female</span>;
    return <span className="text-xs text-muted-foreground">{sex}</span>;
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
      if (!selectedOrganizationId) {
        toast.error('No organization selected');
        return;
      }

      const selectedPigletIdArray = Array.from(selectedPigletIds);

      // Delete piglets
      const { error: pigletsError } = await supabase
        .from('piglets')
        .delete()
        .eq('organization_id', selectedOrganizationId)
        .in('id', selectedPigletIdArray);

      if (pigletsError) throw pigletsError;

      toast.success(`${selectedCount} piglet${selectedCount > 1 ? 's' : ''} deleted successfully!`);
      clearSelection();
      await fetchNursingPiglets();
    } catch (err: any) {
      console.error('Error deleting piglets:', err);
      toast.error(err.message || 'Failed to delete piglets');
    } finally {
      setBulkDeleting(false);
    }
  };

  const calculateAgeDays = (farrowingDate: string) => {
    const birth = new Date(farrowingDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - birth.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const exportToCSV = () => {
    if (piglets.length === 0) {
      toast.error('No nursing piglets to export');
      return;
    }

    const csvData = piglets.map(piglet => ({
      'Identification': getIdentification(piglet),
      'Ear Tag': piglet.ear_tag || '',
      'Right Ear Notch': piglet.right_ear_notch || '',
      'Left Ear Notch': piglet.left_ear_notch || '',
      'Sex': piglet.sex || '',
      'Mother Ear Tag': piglet.farrowing.sow.ear_tag,
      'Mother Name': piglet.farrowing.sow.name || '',
      'Birth Date': formatDateForCSV(piglet.farrowing.actual_farrowing_date),
      'Birth Weight (kg)': piglet.birth_weight || '',
      'Ear Notch Date': formatDateForCSV(piglet.ear_notch_date),
      'Castration Date': formatDateForCSV(piglet.castration_date),
      'Age (days)': calculateAgeDays(piglet.farrowing.actual_farrowing_date),
      'Status': piglet.status,
      'Notes': piglet.notes || '',
    }));

    const filename = `nursing-piglets-${new Date().toISOString().split('T')[0]}`;
    downloadCSV(csvData, filename);
    toast.success(`Exported ${piglets.length} piglet${piglets.length !== 1 ? 's' : ''} to CSV`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Nursing Piglets</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {loading ? 'Loading…' : `${piglets.length} piglet${piglets.length !== 1 ? 's' : ''} currently nursing`}
            </p>
          </div>

          {/* Export and Selection Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              disabled={loading || piglets.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            {selectedPigletIds.size > 0 && (
              <>
                <span className="text-sm font-medium text-muted-foreground">
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
          <CardContent className="pt-6">
            {error && (
              <div className="bg-due-bg border border-due/30 text-due px-4 py-3 rounded-md mb-4">
                {error}
              </div>
            )}

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading nursing piglets...
              </div>
            ) : piglets.length === 0 ? (
              <div className="text-center py-12">
                <Baby className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No nursing piglets yet</h3>
                <p className="text-muted-foreground">
                  Create individual nursing piglets when recording a litter
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-secondary">
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
                          className="h-4 w-4 rounded border-border text-brand focus:ring-brand cursor-pointer"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Identification
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Mother
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Sex
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Age
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Birth Weight
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Ear Notched
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Castrated
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {piglets.map((piglet) => (
                      <tr key={piglet.id} className="hover:bg-secondary">
                        <td className="px-3 py-4">
                          <input
                            type="checkbox"
                            checked={selectedPigletIds.has(piglet.id)}
                            onChange={() => togglePigletSelection(piglet.id)}
                            className="h-4 w-4 rounded border-border text-brand focus:ring-brand cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-foreground">
                            {getIdentification(piglet)}
                          </div>
                          {piglet.ear_tag && (piglet.right_ear_notch || piglet.left_ear_notch) && (
                            <div className="text-xs text-muted-foreground">
                              Notch: {piglet.right_ear_notch || 0}-{piglet.left_ear_notch || 0}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-foreground">
                            {piglet.farrowing.sow.name || piglet.farrowing.sow.ear_tag}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Tag: {piglet.farrowing.sow.ear_tag}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getSexBadge(piglet.sex)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {getAge(piglet.farrowing.actual_farrowing_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {piglet.birth_weight ? `${piglet.birth_weight} kg` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {formatDate(piglet.ear_notch_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {piglet.sex === 'male' ? formatDate(piglet.castration_date) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedPiglet(piglet);
                              setIsModalOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
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

      {/* Nursing Piglet Detail Modal */}
      <NursingPigletModal
        piglet={selectedPiglet}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedPiglet(null);
        }}
        onSuccess={() => {
          fetchNursingPiglets();
        }}
      />
    </div>
  );
}
