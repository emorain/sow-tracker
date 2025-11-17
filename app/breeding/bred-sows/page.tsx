'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from '@/lib/supabase';
import { Calendar, ArrowLeft, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import Link from 'next/link';

type BredSow = {
  id: string;
  sow_id: string;
  breeding_date: string;
  batch_name: string;
  sow?: {
    ear_tag: string;
    name: string | null;
  };
  days_since_breeding: number;
  pregnancy_status: 'pending' | 'confirmed' | 'open' | 'farrowed';
  next_check?: {
    task_name: string;
    due_date: string;
    days_until: number;
  };
};

export default function BredSowsPage() {
  const [bredSows, setBredSows] = useState<BredSow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBredSows();
  }, []);

  const fetchBredSows = async () => {
    try {
      // Get all bred sows from matrix treatments
      const { data: treatments, error: treatmentsError } = await supabase
        .from('matrix_treatments')
        .select(`
          id,
          sow_id,
          breeding_date,
          batch_name,
          sow:sows(ear_tag, name)
        `)
        .eq('bred', true)
        .not('breeding_date', 'is', null)
        .order('breeding_date', { ascending: false });

      if (treatmentsError) throw treatmentsError;

      const today = new Date();

      // For each bred sow, get their next scheduled task
      const bredSowsData = await Promise.all(
        (treatments || []).map(async (treatment: any) => {
          const breedingDate = new Date(treatment.breeding_date);
          const daysSince = Math.floor((today.getTime() - breedingDate.getTime()) / (1000 * 60 * 60 * 24));

          // Get next incomplete task for this sow
          const { data: nextTask } = await supabase
            .from('scheduled_tasks')
            .select('task_name, due_date')
            .eq('sow_id', treatment.sow_id)
            .eq('is_completed', false)
            .gte('due_date', today.toISOString().split('T')[0])
            .order('due_date', { ascending: true })
            .limit(1)
            .single();

          let pregnancyStatus: 'pending' | 'confirmed' | 'open' | 'farrowed' = 'pending';

          // Check if there's a farrowing record for this breeding
          const { data: farrowing } = await supabase
            .from('farrowings')
            .select('id')
            .eq('sow_id', treatment.sow_id)
            .eq('breeding_date', treatment.breeding_date)
            .not('actual_farrowing_date', 'is', null)
            .single();

          if (farrowing) {
            pregnancyStatus = 'farrowed';
          } else if (daysSince > 21 && daysSince < 114) {
            // Between 21 and 114 days - check if ultrasound task is completed
            const { data: ultrasoundTask } = await supabase
              .from('scheduled_tasks')
              .select('is_completed')
              .eq('sow_id', treatment.sow_id)
              .ilike('task_name', '%ultrasound%')
              .or(`task_name.ilike.%pregnancy check%`)
              .single();

            if (ultrasoundTask?.is_completed) {
              pregnancyStatus = 'confirmed';
            }
          }

          let nextCheck = undefined;
          if (nextTask) {
            const dueDate = new Date(nextTask.due_date);
            const daysUntil = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            nextCheck = {
              task_name: nextTask.task_name,
              due_date: nextTask.due_date,
              days_until: daysUntil,
            };
          }

          return {
            id: treatment.id,
            sow_id: treatment.sow_id,
            breeding_date: treatment.breeding_date,
            batch_name: treatment.batch_name,
            sow: treatment.sow,
            days_since_breeding: daysSince,
            pregnancy_status: pregnancyStatus,
            next_check: nextCheck,
          };
        })
      );

      setBredSows(bredSowsData);
    } catch (err: any) {
      console.error('Error fetching bred sows:', err);
      setError(err.message || 'Failed to fetch bred sows');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle2 className="h-3 w-3" />
            Confirmed Pregnant
          </span>
        );
      case 'open':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <XCircle className="h-3 w-3" />
            Open (Not Pregnant)
          </span>
        );
      case 'farrowed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            <CheckCircle2 className="h-3 w-3" />
            Farrowed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            <Clock className="h-3 w-3" />
            Pending Check
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/matrix/batches">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Batches
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Bred Sows</h1>
                <p className="text-sm text-muted-foreground">Monitor pregnancy status and upcoming checks</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Recently Bred Sows ({bredSows.length})</CardTitle>
            <CardDescription>
              Sows that have been bred and are awaiting pregnancy confirmation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading bred sows...
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            ) : bredSows.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No bred sows found. Mark sows as bred from the Matrix Batches page.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Sow
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Batch
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Breeding Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Days Since
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Next Check
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bredSows.map((sow) => (
                      <tr key={sow.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">
                              {sow.sow?.name || sow.sow?.ear_tag || 'Unknown'}
                            </span>
                            {sow.sow?.name && (
                              <span className="text-xs text-gray-500">{sow.sow.ear_tag}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                          {sow.batch_name}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(sow.breeding_date)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                          {sow.days_since_breeding} days
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {getStatusBadge(sow.pregnancy_status)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {sow.next_check ? (
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-900">{sow.next_check.task_name}</span>
                              <span className="text-xs text-gray-500">
                                {sow.next_check.days_until === 0
                                  ? 'Today'
                                  : sow.next_check.days_until < 0
                                  ? `${Math.abs(sow.next_check.days_until)} days overdue`
                                  : `In ${sow.next_check.days_until} days`}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">No upcoming checks</span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Link href={`/tasks?sow=${sow.sow_id}`}>
                            <Button variant="outline" size="sm">
                              View Tasks
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              Pregnancy Check Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm font-semibold text-blue-900">Day 21</div>
                <div className="text-xs text-blue-700 mt-1">Heat Detection Check</div>
                <div className="text-xs text-blue-600 mt-1">If sow returns to heat, breeding failed</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm font-semibold text-green-900">Day 28-35</div>
                <div className="text-xs text-green-700 mt-1">Ultrasound Check</div>
                <div className="text-xs text-green-600 mt-1">Confirm pregnancy via ultrasound</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm font-semibold text-purple-900">Day 60-70</div>
                <div className="text-xs text-purple-700 mt-1">Visual Confirmation</div>
                <div className="text-xs text-purple-600 mt-1">Visible pregnancy development</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-sm font-semibold text-orange-900">Day 107-114</div>
                <div className="text-xs text-orange-700 mt-1">Farrowing Preparation</div>
                <div className="text-xs text-orange-600 mt-1">Move to farrowing pen</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
