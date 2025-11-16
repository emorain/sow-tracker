'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from '@/lib/supabase';
import { Calendar, ArrowLeft, Check, X } from "lucide-react";
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

export default function MatrixBatchesPage() {
  const [batches, setBatches] = useState<MatrixBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
                      <Button variant="outline" size="sm" disabled>
                        View Sows
                      </Button>
                      <Button variant="outline" size="sm" disabled>
                        Update Breeding
                      </Button>
                    </div>
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
