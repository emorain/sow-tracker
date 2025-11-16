'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Calendar, PiggyBank } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import RecordLitterForm from './RecordLitterForm';

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
  created_at: string;
};

type Farrowing = {
  id: string;
  breeding_date: string;
  expected_farrowing_date: string;
  actual_farrowing_date: string | null;
  live_piglets: number | null;
  stillborn: number | null;
  mummified: number | null;
  notes: string | null;
};

type MatrixTreatment = {
  id: string;
  batch_name: string;
  administration_date: string;
  expected_heat_date: string;
  actual_heat_date: string | null;
  bred: boolean;
  breeding_date: string | null;
  dosage: string | null;
  lot_number: string | null;
  notes: string | null;
};

type SowDetailModalProps = {
  sow: Sow | null;
  isOpen: boolean;
  onClose: () => void;
};

export default function SowDetailModal({ sow, isOpen, onClose }: SowDetailModalProps) {
  const [farrowings, setFarrowings] = useState<Farrowing[]>([]);
  const [matrixTreatments, setMatrixTreatments] = useState<MatrixTreatment[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showMatrixHistory, setShowMatrixHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLitterForm, setShowLitterForm] = useState(false);
  const [activeFarrowingId, setActiveFarrowingId] = useState<string | null>(null);

  useEffect(() => {
    if (sow && isOpen) {
      fetchFarrowings();
      fetchMatrixTreatments();
    }
  }, [sow, isOpen]);

  const fetchFarrowings = async () => {
    if (!sow) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('farrowings')
        .select('*')
        .eq('sow_id', sow.id)
        .order('actual_farrowing_date', { ascending: false });

      if (error) throw error;
      setFarrowings(data || []);
    } catch (err) {
      console.error('Failed to fetch farrowings:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMatrixTreatments = async () => {
    if (!sow) return;

    try {
      const { data, error } = await supabase
        .from('matrix_treatments')
        .select('*')
        .eq('sow_id', sow.id)
        .order('administration_date', { ascending: false });

      if (error) throw error;
      setMatrixTreatments(data || []);
    } catch (err) {
      console.error('Failed to fetch Matrix treatments:', err);
    }
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
        return 'bg-green-100 text-green-800';
      case 'culled':
        return 'bg-red-100 text-red-800';
      case 'sold':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFarrowingSummary = () => {
    if (farrowings.length === 0) {
      return { total: 0, totalPiglets: 0, avgLitter: 0, totalStillborn: 0, totalMummified: 0, lastDate: null };
    }

    const totalPiglets = farrowings.reduce((sum, f) => sum + (f.live_piglets || 0), 0);
    const totalStillborn = farrowings.reduce((sum, f) => sum + (f.stillborn || 0), 0);
    const totalMummified = farrowings.reduce((sum, f) => sum + (f.mummified || 0), 0);
    const avgLitter = totalPiglets / farrowings.length;
    const lastFarrowing = farrowings[0]; // Already sorted by date descending

    return {
      total: farrowings.length,
      totalPiglets,
      avgLitter: Math.round(avgLitter * 10) / 10,
      totalStillborn,
      totalMummified,
      lastDate: lastFarrowing?.actual_farrowing_date,
      lastLiveCount: lastFarrowing?.live_piglets,
    };
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (!isOpen || !sow) return null;

  const summary = getFarrowingSummary();
  const isGilt = farrowings.length === 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PiggyBank className="h-6 w-6 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              {sow.name || sow.ear_tag}
            </h2>
            {isGilt && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Gilt
              </span>
            )}
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(sow.status)}`}>
              {sow.status}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Photo */}
          {sow.photo_url && (
            <div className="flex justify-center">
              <img
                src={sow.photo_url}
                alt={sow.name || sow.ear_tag}
                className="w-48 h-48 rounded-lg object-cover border-2 border-gray-200"
              />
            </div>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Ear Tag</label>
              <p className="text-base text-gray-900">{sow.ear_tag}</p>
            </div>
            {sow.name && (
              <div>
                <label className="text-sm font-medium text-gray-500">Name</label>
                <p className="text-base text-gray-900">{sow.name}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-500">Breed</label>
              <p className="text-base text-gray-900">{sow.breed}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Birth Date</label>
              <p className="text-base text-gray-900">{formatDate(sow.birth_date)} ({calculateAge(sow.birth_date)})</p>
            </div>
            {(sow.right_ear_notch !== null || sow.left_ear_notch !== null) && (
              <div>
                <label className="text-sm font-medium text-gray-500">Ear Notches</label>
                <p className="text-base text-gray-900">
                  R: {sow.right_ear_notch ?? '-'} | L: {sow.left_ear_notch ?? '-'}
                </p>
              </div>
            )}
            {sow.registration_number && (
              <div>
                <label className="text-sm font-medium text-gray-500">Registration Number</label>
                <p className="text-base text-gray-900">{sow.registration_number}</p>
              </div>
            )}
          </div>

          {/* Notes */}
          {sow.notes && (
            <div>
              <label className="text-sm font-medium text-gray-500">Notes</label>
              <p className="text-base text-gray-900 whitespace-pre-wrap">{sow.notes}</p>
            </div>
          )}

          {/* Farrowing Summary */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              Farrowing Summary
            </h3>

            {loading ? (
              <p className="text-gray-600">Loading farrowing data...</p>
            ) : farrowings.length === 0 ? (
              <p className="text-gray-600">No farrowing records yet. This is a gilt.</p>
            ) : (
              <>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-700">
                    <strong>{summary.total}</strong> farrowings •
                    <strong> {summary.totalPiglets}</strong> total piglets •
                    Avg <strong>{summary.avgLitter}</strong>/litter
                    {summary.lastDate && (
                      <> • Last: <strong>{formatDate(summary.lastDate)}</strong> ({summary.lastLiveCount} live)</>
                    )}
                  </p>
                  {(summary.totalStillborn > 0 || summary.totalMummified > 0) && (
                    <p className="text-sm text-gray-600 mt-1">
                      Stillborn: {summary.totalStillborn} | Mummified: {summary.totalMummified}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 mb-4">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      // Find if there's an active farrowing (expected but not recorded)
                      const activeFarrowing = farrowings.find(f => f.actual_farrowing_date === null);
                      setActiveFarrowingId(activeFarrowing?.id || null);
                      setShowLitterForm(true);
                    }}
                  >
                    Record Litter
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowHistory(!showHistory)}
                  >
                    {showHistory ? 'Hide History' : 'View History'}
                  </Button>
                </div>

                {/* Expanded Farrowing History */}
                {showHistory && (
                  <div className="space-y-3">
                    {farrowings.map((farrowing, index) => (
                      <div
                        key={farrowing.id}
                        className="border rounded-lg p-4 bg-gray-50"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">
                            Farrowing #{farrowings.length - index}
                          </h4>
                          <span className="text-sm text-gray-600">
                            {formatDate(farrowing.actual_farrowing_date)}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-600">Breeding Date:</span>{' '}
                            <span className="text-gray-900">{formatDate(farrowing.breeding_date)}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Expected Date:</span>{' '}
                            <span className="text-gray-900">{formatDate(farrowing.expected_farrowing_date)}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Live Piglets:</span>{' '}
                            <span className="font-semibold text-green-700">{farrowing.live_piglets ?? 0}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Stillborn:</span>{' '}
                            <span className="text-gray-900">{farrowing.stillborn ?? 0}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Mummified:</span>{' '}
                            <span className="text-gray-900">{farrowing.mummified ?? 0}</span>
                          </div>
                        </div>
                        {farrowing.notes && (
                          <div className="mt-2 text-sm">
                            <span className="text-gray-600">Notes:</span>{' '}
                            <span className="text-gray-900">{farrowing.notes}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Matrix Treatment History */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              Matrix Treatment History
            </h3>

            {matrixTreatments.length === 0 ? (
              <p className="text-gray-600">No Matrix treatments recorded.</p>
            ) : (
              <>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-700">
                    <strong>{matrixTreatments.length}</strong> treatment{matrixTreatments.length !== 1 ? 's' : ''} recorded
                    {matrixTreatments[0] && (
                      <> • Last batch: <strong>{matrixTreatments[0].batch_name}</strong> on {formatDate(matrixTreatments[0].administration_date)}</>
                    )}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Bred: {matrixTreatments.filter(t => t.bred).length} | Pending: {matrixTreatments.filter(t => !t.bred).length}
                  </p>
                </div>

                <div className="flex gap-2 mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMatrixHistory(!showMatrixHistory)}
                  >
                    {showMatrixHistory ? 'Hide History' : 'View History'}
                  </Button>
                </div>

                {/* Expanded Matrix History */}
                {showMatrixHistory && (
                  <div className="space-y-3">
                    {matrixTreatments.map((treatment) => (
                      <div
                        key={treatment.id}
                        className="border rounded-lg p-4 bg-gray-50"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">
                            {treatment.batch_name}
                          </h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            treatment.bred ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {treatment.bred ? 'Bred' : 'Pending'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-600">Administration Date:</span>{' '}
                            <span className="text-gray-900">{formatDate(treatment.administration_date)}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Expected Heat:</span>{' '}
                            <span className="text-gray-900">{formatDate(treatment.expected_heat_date)}</span>
                          </div>
                          {treatment.actual_heat_date && (
                            <div>
                              <span className="text-gray-600">Actual Heat:</span>{' '}
                              <span className="text-gray-900">{formatDate(treatment.actual_heat_date)}</span>
                            </div>
                          )}
                          {treatment.breeding_date && (
                            <div>
                              <span className="text-gray-600">Breeding Date:</span>{' '}
                              <span className="text-gray-900">{formatDate(treatment.breeding_date)}</span>
                            </div>
                          )}
                          {treatment.dosage && (
                            <div>
                              <span className="text-gray-600">Dosage:</span>{' '}
                              <span className="text-gray-900">{treatment.dosage}</span>
                            </div>
                          )}
                          {treatment.lot_number && (
                            <div>
                              <span className="text-gray-600">Lot Number:</span>{' '}
                              <span className="text-gray-900">{treatment.lot_number}</span>
                            </div>
                          )}
                        </div>
                        {treatment.notes && (
                          <div className="mt-2 text-sm">
                            <span className="text-gray-600">Notes:</span>{' '}
                            <span className="text-gray-900">{treatment.notes}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </div>

      {/* Record Litter Form */}
      {sow && (
        <RecordLitterForm
          sowId={sow.id}
          sowName={sow.name || sow.ear_tag}
          farrowingId={activeFarrowingId}
          isOpen={showLitterForm}
          onClose={() => setShowLitterForm(false)}
          onSuccess={() => {
            fetchFarrowings(); // Refresh farrowing data
          }}
        />
      )}
    </div>
  );
}
