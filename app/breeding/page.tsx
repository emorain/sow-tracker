'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, ArrowLeft, Syringe, Plus, Calendar } from "lucide-react";
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useOrganization } from '@/lib/organization-context';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { AIDoseModal } from '@/components/AIDoseModal';

type BreedingAttempt = {
  id: string;
  sow_id: string;
  sow_ear_tag: string;
  sow_name?: string;
  boar_id?: string;
  boar_ear_tag?: string;
  boar_name?: string;
  breeding_date: string;
  breeding_method: 'natural' | 'ai';
  expected_farrowing_date?: string;
  pregnancy_confirmed?: boolean;
  notes?: string;
};

type AIDose = {
  id: string;
  breeding_attempt_id: string;
  dose_number: number;
  dose_date: string;
  straws_used?: number;
  boar_id?: string;
  notes?: string;
};

export default function BreedingPage() {
  const { user } = useAuth();
  const { selectedOrganizationId } = useOrganization();
  const [breedingAttempts, setBreedingAttempts] = useState<BreedingAttempt[]>([]);
  const [aiDoses, setAiDoses] = useState<Record<string, AIDose[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedBreeding, setSelectedBreeding] = useState<BreedingAttempt | null>(null);
  const [doseModalOpen, setDoseModalOpen] = useState(false);

  useEffect(() => {
    if (selectedOrganizationId) {
      fetchBreedingAttempts();
    }
  }, [selectedOrganizationId]);

  const fetchBreedingAttempts = async () => {
    if (!selectedOrganizationId) return;

    try {
      setLoading(true);

      // Fetch breeding attempts with sow and boar info
      const { data: attempts, error: attemptsError } = await supabase
        .from('breeding_attempts')
        .select(`
          *,
          sows!inner(ear_tag, name),
          boars(ear_tag, name, boar_type)
        `)
        .eq('organization_id', selectedOrganizationId)
        .order('breeding_date', { ascending: false });

      if (attemptsError) throw attemptsError;

      // Fetch all AI doses
      const { data: doses, error: dosesError } = await supabase
        .from('ai_doses')
        .select('*')
        .eq('organization_id', selectedOrganizationId)
        .order('dose_number');

      if (dosesError) throw dosesError;

      // Map breeding attempts
      const mappedAttempts: BreedingAttempt[] = (attempts || []).map((a: any) => ({
        id: a.id,
        sow_id: a.sow_id,
        sow_ear_tag: a.sows.ear_tag,
        sow_name: a.sows.name,
        boar_id: a.boar_id,
        boar_ear_tag: a.boars?.ear_tag,
        boar_name: a.boars?.name,
        breeding_date: a.breeding_date,
        breeding_method: a.breeding_method,
        expected_farrowing_date: a.expected_farrowing_date,
        pregnancy_confirmed: a.pregnancy_confirmed,
        notes: a.notes,
      }));

      setBreedingAttempts(mappedAttempts);

      // Group doses by breeding_attempt_id
      const dosesMap: Record<string, AIDose[]> = {};
      (doses || []).forEach((dose: any) => {
        if (!dosesMap[dose.breeding_attempt_id]) {
          dosesMap[dose.breeding_attempt_id] = [];
        }
        dosesMap[dose.breeding_attempt_id].push(dose);
      });

      setAiDoses(dosesMap);
    } catch (error) {
      console.error('Failed to fetch breeding attempts:', error);
      toast.error('Failed to load breeding records');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDose = (breeding: BreedingAttempt) => {
    setSelectedBreeding(breeding);
    setDoseModalOpen(true);
  };

  const handleDoseModalClose = () => {
    setDoseModalOpen(false);
    setSelectedBreeding(null);
  };

  const handleDoseSuccess = () => {
    fetchBreedingAttempts();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-red-700 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-gray-600">Loading breeding records...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-red-700">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-3">
            <Heart className="h-8 w-8 text-red-700" />
            <h1 className="text-2xl font-bold text-gray-900">Breeding Management</h1>
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

        {breedingAttempts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Breeding Records</h3>
              <p className="text-gray-600">
                Breeding records will appear here after recording breeding attempts.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {breedingAttempts.map((breeding) => {
              const doses = aiDoses[breeding.id] || [];
              const isAI = breeding.breeding_method === 'ai';
              const daysSince = Math.floor(
                (new Date().getTime() - new Date(breeding.breeding_date).getTime()) / (1000 * 60 * 60 * 24)
              );

              return (
                <Card key={breeding.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {breeding.sow_ear_tag}
                          {breeding.sow_name && ` (${breeding.sow_name})`}
                        </CardTitle>
                        <CardDescription>
                          Bred {new Date(breeding.breeding_date).toLocaleDateString()} ({daysSince} days ago)
                        </CardDescription>
                      </div>
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                        breeding.breeding_method === 'ai'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {breeding.breeding_method === 'ai' ? 'AI' : 'Natural'}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Boar Info */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Sire:</span>
                        <span className="text-gray-900 font-medium">
                          {breeding.boar_ear_tag || 'Not specified'}
                          {breeding.boar_name && ` (${breeding.boar_name})`}
                        </span>
                      </div>

                      {/* Expected Farrowing */}
                      {breeding.expected_farrowing_date && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Expected Farrowing:</span>
                          <span className="text-gray-900 font-medium">
                            {new Date(breeding.expected_farrowing_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}

                      {/* Pregnancy Status */}
                      {breeding.pregnancy_confirmed !== null && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Pregnancy:</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            breeding.pregnancy_confirmed
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {breeding.pregnancy_confirmed ? 'Confirmed' : 'Not Confirmed'}
                          </span>
                        </div>
                      )}

                      {/* AI Doses */}
                      {isAI && (
                        <div className="border-t pt-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">
                              Follow-up Doses ({doses.length})
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAddDose(breeding)}
                            >
                              <Syringe className="mr-1 h-3 w-3" />
                              Add Dose
                            </Button>
                          </div>

                          {doses.length > 0 && (
                            <div className="space-y-2">
                              {doses.map((dose) => (
                                <div
                                  key={dose.id}
                                  className="bg-purple-50 rounded-md p-2 text-sm"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium text-purple-900">
                                      Dose #{dose.dose_number}
                                    </span>
                                    <span className="text-purple-700">
                                      {new Date(dose.dose_date).toLocaleDateString()}
                                    </span>
                                  </div>
                                  {dose.straws_used && (
                                    <div className="text-xs text-purple-600 mt-1">
                                      {dose.straws_used} straw{dose.straws_used !== 1 ? 's' : ''} used
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Notes */}
                      {breeding.notes && (
                        <div className="text-sm text-gray-600 border-t pt-2">
                          <span className="font-medium">Notes:</span> {breeding.notes}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* AI Dose Modal */}
      {doseModalOpen && selectedBreeding && (
        <AIDoseModal
          breedingAttempt={{
            id: selectedBreeding.id,
            sow_id: selectedBreeding.sow_id,
            boar_id: selectedBreeding.boar_id,
            breeding_date: selectedBreeding.breeding_date,
            breeding_method: selectedBreeding.breeding_method,
          }}
          existingDoses={aiDoses[selectedBreeding.id] || []}
          onClose={handleDoseModalClose}
          onSuccess={handleDoseSuccess}
        />
      )}
    </div>
  );
}
