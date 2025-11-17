'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from '@/lib/supabase';
import { Calendar, ArrowLeft, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import Link from 'next/link';

type MatrixBatch = {
  batch_name: string;
  administration_date: string;
  expected_heat_date: string;
  sow_count: number;
  bred_count: number;
  pending_count: number;
  days_until_heat: number;
};

type MatrixTreatment = {
  id: string;
  sow_id: string;
  batch_name: string;
  administration_date: string;
  expected_heat_date: string;
  actual_heat_date: string | null;
  bred: boolean;
  breeding_date: string | null;
  sow?: {
    ear_tag: string;
  };
};

export default function MatrixBatchesPage() {
  const [batches, setBatches] = useState<MatrixBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);
  const [batchTreatments, setBatchTreatments] = useState<MatrixTreatment[]>([]);
  const [loadingTreatments, setLoadingTreatments] = useState(false);
  const [updatingTreatment, setUpdatingTreatment] = useState<string | null>(null);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      // Get all matrix treatments grouped by batch
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
        const daysUntil = Math.ceil((expectedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        return {
          batch_name: batchName,
          administration_date: firstTreatment.administration_date,
          expected_heat_date: firstTreatment.expected_heat_date,
          sow_count: treatments.length,
          bred_count: treatments.filter((t: any) => t.bred).length,
          pending_count: treatments.filter((t: any) => !t.bred && !t.actual_heat_date).length,
          days_until_heat: daysUntil,
        };
      });

      // Sort by expected heat date (most recent first)
      batchStats.sort((a, b) => new Date(b.expected_heat_date).getTime() - new Date(a.expected_heat_date).getTime());

      setBatches(batchStats);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch Matrix batches');
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
    if (days < 0) return 'bg-red-100 text-red-800';
    if (days === 0) return 'bg-orange-100 text-orange-800';
    if (days <= 3) return 'bg-yellow-100 text-yellow-800';
    if (days <= 7) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
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
          sow:sows(ear_tag)
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

  const markAsBred = async (treatmentId: string, earTag: string) => {
    if (!confirm(`Mark sow ${earTag} as bred?`)) return;

    setUpdatingTreatment(treatmentId);
    try {
      const today = new Date().toISOString().split('T')[0];

      const { error } = await supabase
        .from('matrix_treatments')
        .update({
          actual_heat_date: today,
          bred: true,
          breeding_date: today,
        })
        .eq('id', treatmentId);

      if (error) throw error;

      // Refresh the treatments list
      if (expandedBatch) {
        await fetchBatchTreatments(expandedBatch);
      }

      // Refresh batches to update stats
      await fetchBatches();
    } catch (err: any) {
      console.error('Error updating breeding:', err);
      alert(err.message || 'Failed to update breeding status');
    } finally {
      setUpdatingTreatment(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-3">
            <Calendar className="h-8 w-8 text-green-600" />
            <h1 className="text-2xl font-bold text-gray-900">Matrix Batches</h1>
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
            <CardTitle>Synchronized Batches</CardTitle>
            <CardDescription>
              {loading ? 'Loading...' : `${batches.length} batch${batches.length !== 1 ? 'es' : ''} tracked`}
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
                Loading Matrix batches...
              </div>
            ) : batches.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Matrix batches yet</h3>
                <p className="text-gray-600 mb-4">
                  Record your first Matrix treatment to start tracking synchronized breeding
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
                    className="border rounded-lg p-5 hover:bg-gray-50 transition-colors"
                  >
                    {/* Batch Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {batch.batch_name}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDaysColor(batch.days_until_heat)}`}>
                            {getDaysLabel(batch.days_until_heat)}
                          </span>
                          <span className="text-sm text-gray-600">
                            {batch.sow_count} sow{batch.sow_count !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm">
                          <Check className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-green-700">{batch.bred_count} bred</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm mt-1">
                          <X className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">{batch.pending_count} pending</span>
                        </div>
                      </div>
                    </div>

                    {/* Batch Details */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Administered:</span>{' '}
                        <span className="text-gray-900">{formatDate(batch.administration_date)}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Expected Heat:</span>{' '}
                        <span className="text-gray-900">{formatDate(batch.expected_heat_date)}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Breeding Rate:</span>{' '}
                        <span className="text-gray-900">
                          {batch.sow_count > 0
                            ? Math.round((batch.bred_count / batch.sow_count) * 100)
                            : 0}%
                        </span>
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
                            <h4 className="font-semibold text-sm text-gray-700 mb-3">
                              Sows in this batch ({batchTreatments.length})
                            </h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b">
                                  <tr>
                                    <th className="px-3 py-2 text-left font-medium text-gray-700">Sow #</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-700">Expected Heat</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-700">Actual Heat</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-700">Breeding Date</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-700">Status</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-700">Action</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y">
                                  {batchTreatments.map((treatment) => (
                                    <tr key={treatment.id} className="hover:bg-gray-50">
                                      <td className="px-3 py-2 font-medium">
                                        {treatment.sow?.ear_tag || 'N/A'}
                                      </td>
                                      <td className="px-3 py-2 text-gray-600">
                                        {formatDate(treatment.expected_heat_date)}
                                      </td>
                                      <td className="px-3 py-2 text-gray-600">
                                        {treatment.actual_heat_date
                                          ? formatDate(treatment.actual_heat_date)
                                          : '-'}
                                      </td>
                                      <td className="px-3 py-2 text-gray-600">
                                        {treatment.breeding_date
                                          ? formatDate(treatment.breeding_date)
                                          : '-'}
                                      </td>
                                      <td className="px-3 py-2">
                                        {treatment.bred ? (
                                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                            <Check className="h-3 w-3" />
                                            Bred
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                            <X className="h-3 w-3" />
                                            Pending
                                          </span>
                                        )}
                                      </td>
                                      <td className="px-3 py-2">
                                        {!treatment.bred && (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-7 px-2 text-xs"
                                            onClick={() => markAsBred(treatment.id, treatment.sow?.ear_tag || 'Unknown')}
                                            disabled={updatingTreatment === treatment.id}
                                          >
                                            {updatingTreatment === treatment.id ? 'Updating...' : 'Mark Bred'}
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
    </div>
  );
}
