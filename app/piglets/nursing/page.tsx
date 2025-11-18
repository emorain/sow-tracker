'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from '@/lib/supabase';
import { Baby, ArrowLeft, Edit } from "lucide-react";
import Link from 'next/link';
import NursingPigletModal from '@/components/NursingPigletModal';

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
  const [piglets, setPiglets] = useState<NursingPiglet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPiglet, setSelectedPiglet] = useState<NursingPiglet | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchNursingPiglets();
  }, []);

  const fetchNursingPiglets = async () => {
    try {
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
          farrowings!inner (
            actual_farrowing_date,
            sows!inner (
              id,
              ear_tag,
              name
            )
          )
        `)
        .eq('status', 'nursing')
        .order('created_at', { ascending: false });

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
    if (!sex || sex === 'unknown') return <span className="text-xs text-gray-400">Unknown</span>;
    if (sex === 'male') return <span className="text-xs text-blue-600 font-medium">Male</span>;
    if (sex === 'female') return <span className="text-xs text-pink-600 font-medium">Female</span>;
    return <span className="text-xs text-gray-400">{sex}</span>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-3">
            <Baby className="h-8 w-8 text-red-700" />
            <h1 className="text-2xl font-bold text-gray-900">Nursing Piglets</h1>
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
            <CardTitle>Nursing Piglets</CardTitle>
            <CardDescription>
              {loading ? 'Loading...' : `${piglets.length} piglet${piglets.length !== 1 ? 's' : ''} currently nursing`}
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
                Loading nursing piglets...
              </div>
            ) : piglets.length === 0 ? (
              <div className="text-center py-12">
                <Baby className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No nursing piglets yet</h3>
                <p className="text-gray-600">
                  Create individual nursing piglets when recording a litter
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Identification
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mother
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sex
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Age
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Birth Weight
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ear Notched
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Castrated
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {piglets.map((piglet) => (
                      <tr key={piglet.id} className="hover:bg-gray-50">
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getSexBadge(piglet.sex)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getAge(piglet.farrowing.actual_farrowing_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {piglet.birth_weight ? `${piglet.birth_weight} kg` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(piglet.ear_notch_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
