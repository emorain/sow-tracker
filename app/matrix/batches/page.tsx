'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from '@/lib/supabase';
import { Calendar, ArrowLeft, Check, X, ChevronDown, ChevronUp, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import RecordBreedingForm from '@/components/RecordBreedingForm';

type MatrixBatch = {
  batch_name: string;
  treatment_start_date: string;
  treatment_end_date: string;
  treatment_duration_days: number;
  expected_heat_date: string;
  sow_count: number;
  bred_count: number;
  pending_count: number;
  days_until_heat: number;
  days_until_end: number;
  treatment_completed: boolean;
};

type MatrixTreatment = {
  id: string;
  sow_id: string;
  batch_name: string;
  treatment_start_date: string;
  treatment_end_date: string;
  treatment_duration_days: number;
  expected_heat_date: string;
  actual_heat_date: string | null;
  bred: boolean;
  breeding_date: string | null;
  treatment_completed: boolean;
  sow?: {
    id: string;
    ear_tag: string;
    name: string | null;
  };
};

export default function MatrixBatchesPage() {
  const { user } = useAuth();
  const farmName = user?.user_metadata?.farm_name || 'Sow Tracker';
  const [batches, setBatches] = useState<MatrixBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);
  const [batchTreatments, setBatchTreatments] = useState<MatrixTreatment[]>([]);
  const [loadingTreatments, setLoadingTreatments] = useState(false);
  const [breedingFormOpen, setBreedingFormOpen] = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState<MatrixTreatment | null>(null);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      // Get all estrus synchronization treatments grouped by batch
      const { data, error } = await supabase
        .from('matrix_treatments')
        .select('*')
        .order('expected_heat_date', { ascending: false });

      if (error) throw error;

      // Group by batch_name
      const batchMap = new Map<string, any[]>();
      (data || []).forEach((treatment: any) => {
        if (!batchMap.has(treatment.batch_name)) {
          batchMap.set(treatment.batch_name, []);
        }
        batchMap.get(treatment.batch_name)!.push(treatment);
      });

      // Calculate batch statistics
      const today = new Date();
      const batchStats: MatrixBatch[] = Array.from(batchMap.entries()).map(([batchName, treatments]) => {
        const firstTreatment = treatments[0];
        const expectedDate = new Date(firstTreatment.expected_heat_date);
        const endDate = new Date(firstTreatment.treatment_end_date);
        const daysUntilHeat = Math.ceil((expectedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const daysUntilEnd = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        return {
          batch_name: batchName,
          treatment_start_date: firstTreatment.treatment_start_date,
          treatment_end_date: firstTreatment.treatment_end_date,
          treatment_duration_days: firstTreatment.treatment_duration_days,
          expected_heat_date: firstTreatment.expected_heat_date,
          sow_count: treatments.length,
          bred_count: treatments.filter((t: any) => t.bred).length,
          pending_count: treatments.filter((t: any) => !t.bred && !t.actual_heat_date).length,
          days_until_heat: daysUntilHeat,
          days_until_end: daysUntilEnd,
          treatment_completed: daysUntilEnd <= 0,
        };
      });

      // Sort by expected heat date (most recent first)
      batchStats.sort((a, b) => new Date(b.expected_heat_date).getTime() - new Date(a.expected_heat_date).getTime());

      setBatches(batchStats);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch Estrus Synchronization batches');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getDaysLabel = (days: number) => {
    if (days < 0) {
      return `${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} overdue`;
    } else if (days === 0) {
      return 'Due today';
    } else {
      return `${days} day${days !== 1 ? 's' : ''} until heat`;
    }
  };

  const getDaysColor = (days: number) => {
    if (days < 0) return 'bg-due-bg text-due';
    if (days === 0) return 'bg-soon-bg text-soon';
    if (days <= 3) return 'bg-soon-bg text-soon';
    if (days <= 7) return 'bg-info-bg text-info';
    return 'bg-secondary text-muted-foreground';
  };

  const toggleBatchExpansion = async (batchName: string) => {
    if (expandedBatch === batchName) {
      setExpandedBatch(null);
      setBatchTreatments([]);
    } else {
      setExpandedBatch(batchName);
      await fetchBatchTreatments(batchName);
    }
  };

  const fetchBatchTreatments = async (batchName: string) => {
    setLoadingTreatments(true);
    try {
      const { data, error } = await supabase
        .from('matrix_treatments')
        .select(`
          *,
          sow:sows(id, ear_tag, name)
        `)
        .eq('batch_name', batchName)
        .order('sow_id');

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Fetched treatments:', data);
      setBatchTreatments(data || []);
    } catch (err: any) {
      console.error('Error fetching batch treatments:', err);
      setError(err.message || 'Failed to fetch batch treatments');
    } finally {
      setLoadingTreatments(false);
    }
  };

  const handleRecordBreedingClick = (treatment: MatrixTreatment) => {
    setSelectedTreatment(treatment);
    setBreedingFormOpen(true);
  };

  const handleBreedingSuccess = async () => {
    // Refresh the treatments list
    if (expandedBatch) {
      await fetchBatchTreatments(expandedBatch);
    }

    // Refresh batches to update stats
    await fetchBatches();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Estrus Sync</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {loading ? 'Loading…' : `${batches.length} batch${batches.length !== 1 ? 'es' : ''} tracked`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/breeding/bred-sows">
              <Button variant="outline" size="sm">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                View Bred Sows
              </Button>
            </Link>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Synchronized Batches</CardTitle>
            <CardDescription>
              {loading ? 'Loading...' : `${batches.length} batch${batches.length !== 1 ? 'es' : ''} tracked`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-due-bg border border-due/30 text-due px-4 py-3 rounded-md mb-4">
                {error}
              </div>
            )}

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading estrus synchronization batches...
              </div>
            ) : batches.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No estrus synchronization batches yet</h3>
                <p className="text-muted-foreground mb-4">
                  Record your first estrus synchronization treatment to start tracking synchronized breeding
                </p>
                <Link href="/sows">
                  <Button>
                    Go to Sow List
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {batches.map((batch) => (
                  <div
                    key={batch.batch_name}
                    className="border rounded-lg p-5 hover:bg-secondary transition-colors"
                  >
                    {/* Batch Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-1">
                          {batch.batch_name}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDaysColor(batch.days_until_heat)}`}>
                            {getDaysLabel(batch.days_until_heat)}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {batch.sow_count} sow{batch.sow_count !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm">
                          <Check className="h-4 w-4 text-brand" />
                          <span className="font-medium text-brand">{batch.bred_count} bred</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm mt-1">
                          <X className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{batch.pending_count} pending</span>
                        </div>
                      </div>
                    </div>

                    {/* Batch Details */}
                    <div className="space-y-3 text-sm">
                      {/* Treatment Period */}
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-muted-foreground">Treatment Period:</span>
                        <span className="text-foreground">
                          {formatDate(batch.treatment_start_date)} → {formatDate(batch.treatment_end_date)}
                        </span>
                        <span className="text-muted-foreground">
                          ({batch.treatment_duration_days} days)
                        </span>
                      </div>

                      {/* Treatment Status */}
                      {!batch.treatment_completed && batch.days_until_end > 0 && (
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-info" />
                          <span className="text-info font-medium">
                            In Treatment - {batch.days_until_end} day{batch.days_until_end !== 1 ? 's' : ''} remaining
                          </span>
                        </div>
                      )}

                      {batch.treatment_completed && (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-ok" />
                          <span className="text-ok font-medium">Treatment Completed</span>
                          <span className="text-muted-foreground">→</span>
                          <span className="font-medium text-muted-foreground">Expected Heat:</span>
                          <span className="text-foreground">{formatDate(batch.expected_heat_date)}</span>
                        </div>
                      )}

                      {/* Breeding Stats */}
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="font-medium text-muted-foreground">Breeding Rate:</span>{' '}
                          <span className="text-foreground font-semibold">
                            {batch.sow_count > 0
                              ? Math.round((batch.bred_count / batch.sow_count) * 100)
                              : 0}%
                          </span>
                        </div>
                        <div className="text-muted-foreground">
                          ({batch.bred_count} of {batch.sow_count} sows bred)
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 pt-4 border-t flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleBatchExpansion(batch.batch_name)}
                      >
                        {expandedBatch === batch.batch_name ? (
                          <>
                            <ChevronUp className="mr-2 h-4 w-4" />
                            Hide Sows
                          </>
                        ) : (
                          <>
                            <ChevronDown className="mr-2 h-4 w-4" />
                            View Sows
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Expanded Sow List */}
                    {expandedBatch === batch.batch_name && (
                      <div className="mt-4 pt-4 border-t">
                        {loadingTreatments ? (
                          <div className="text-center py-4 text-muted-foreground">
                            Loading sows...
                          </div>
                        ) : batchTreatments.length === 0 ? (
                          <div className="text-center py-4 text-muted-foreground">
                            No sows found in this batch
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <h4 className="font-semibold text-sm text-muted-foreground mb-3">
                              Sows in this batch ({batchTreatments.length})
                            </h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead className="bg-secondary border-b">
                                  <tr>
                                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Sow #</th>
                                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Expected Heat</th>
                                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Actual Heat</th>
                                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Breeding Date</th>
                                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Status</th>
                                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Action</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y">
                                  {batchTreatments.map((treatment) => (
                                    <tr key={treatment.id} className="hover:bg-secondary">
                                      <td className="px-3 py-2 font-medium">
                                        {treatment.sow?.ear_tag || 'N/A'}
                                      </td>
                                      <td className="px-3 py-2 text-muted-foreground">
                                        {formatDate(treatment.expected_heat_date)}
                                      </td>
                                      <td className="px-3 py-2 text-muted-foreground">
                                        {treatment.actual_heat_date
                                          ? formatDate(treatment.actual_heat_date)
                                          : '-'}
                                      </td>
                                      <td className="px-3 py-2 text-muted-foreground">
                                        {treatment.breeding_date
                                          ? formatDate(treatment.breeding_date)
                                          : '-'}
                                      </td>
                                      <td className="px-3 py-2">
                                        {treatment.bred ? (
                                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-ok-bg text-ok">
                                            <Check className="h-3 w-3" />
                                            Bred
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-secondary text-muted-foreground">
                                            <X className="h-3 w-3" />
                                            Pending
                                          </span>
                                        )}
                                      </td>
                                      <td className="px-3 py-2">
                                        {!treatment.bred && treatment.sow && (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-7 px-2 text-xs"
                                            onClick={() => handleRecordBreedingClick(treatment)}
                                          >
                                            Record Breeding
                                          </Button>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Record Breeding Form */}
      {breedingFormOpen && selectedTreatment?.sow && (
        <RecordBreedingForm
          sow={{
            id: selectedTreatment.sow.id,
            ear_tag: selectedTreatment.sow.ear_tag,
            name: selectedTreatment.sow.name,
          }}
          isOpen={breedingFormOpen}
          onClose={() => {
            setBreedingFormOpen(false);
            setSelectedTreatment(null);
          }}
          onSuccess={handleBreedingSuccess}
          matrixTreatmentId={selectedTreatment.id}
        />
      )}
    </div>
  );
}
