'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, ArrowLeft, Plus, Pencil, Trash2, AlertCircle, Home } from "lucide-react";
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useSettings } from '@/lib/settings-context';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { HousingUnitModal } from '@/components/HousingUnitModal';

type HousingUnit = {
  id: string;
  name: string;
  unit_number?: string;
  type: 'gestation' | 'farrowing' | 'breeding' | 'hospital' | 'quarantine' | 'other';
  length_feet?: number;
  width_feet?: number;
  square_footage?: number;
  max_capacity?: number;
  building_name?: string;
  notes?: string;
  measurement_date?: string;
  measured_by?: string;
  measurement_notes?: string;
  current_sows?: number;
  sq_ft_per_sow?: number;
  is_compliant?: boolean;
};

export default function HousingUnitsPage() {
  const { user } = useAuth();
  const { settings, loading: settingsLoading } = useSettings();
  const [housingUnits, setHousingUnits] = useState<HousingUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<HousingUnit | null>(null);

  const fetchHousingUnits = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('housing_unit_occupancy')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setHousingUnits(data as HousingUnit[]);
    } catch (error) {
      console.error('Failed to fetch housing units:', error);
      toast.error('Failed to load housing units');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHousingUnits();
  }, [user]);

  const handleAdd = () => {
    setEditingUnit(null);
    setModalOpen(true);
  };

  const handleEdit = (unit: HousingUnit) => {
    setEditingUnit(unit);
    setModalOpen(true);
  };

  const handleDelete = async (unit: HousingUnit) => {
    if (unit.current_sows && unit.current_sows > 0) {
      toast.error(`Cannot delete ${unit.name} - it has ${unit.current_sows} sow(s) assigned`);
      return;
    }

    if (!confirm(`Are you sure you want to delete ${unit.name}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('housing_units')
        .delete()
        .eq('id', unit.id);

      if (error) throw error;

      toast.success(`${unit.name} deleted successfully`);
      fetchHousingUnits();
    } catch (error) {
      console.error('Failed to delete housing unit:', error);
      toast.error('Failed to delete housing unit');
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingUnit(null);
    fetchHousingUnits();
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      gestation: 'Gestation',
      farrowing: 'Farrowing',
      breeding: 'Breeding',
      hospital: 'Hospital',
      quarantine: 'Quarantine',
      other: 'Other'
    };
    return labels[type] || type;
  };

  const getTypeBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      gestation: 'bg-blue-100 text-blue-800',
      farrowing: 'bg-pink-100 text-pink-800',
      breeding: 'bg-purple-100 text-purple-800',
      hospital: 'bg-red-100 text-red-800',
      quarantine: 'bg-orange-100 text-orange-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[type] || colors.other;
  };

  if (loading || settingsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-gray-600">Loading housing units...</div>
        </div>
      </div>
    );
  }

  const isProp12Enabled = settings?.prop12_compliance_enabled || false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-3">
            <Building2 className="h-8 w-8 text-green-600" />
            <h1 className="text-2xl font-bold text-gray-900">Housing Units</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add Housing Unit
          </Button>
        </div>

        {/* Prop 12 Info Banner */}
        {isProp12Enabled && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium">Prop 12 Compliance Mode Enabled</p>
                <p className="mt-1">
                  Gestation units require 24 sq ft per sow. Enter measurements for compliance tracking.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Housing Units List */}
        {housingUnits.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Housing Units</h3>
              <p className="text-gray-600 mb-4">
                Get started by adding your first housing unit or pen.
              </p>
              <Button onClick={handleAdd}>
                <Plus className="mr-2 h-4 w-4" />
                Add Housing Unit
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {housingUnits.map((unit) => (
              <Card key={unit.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{unit.name}</CardTitle>
                      {unit.unit_number && (
                        <CardDescription className="mt-1">
                          Unit #{unit.unit_number}
                        </CardDescription>
                      )}
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeBadgeColor(unit.type)}`}>
                      {getTypeLabel(unit.type)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Building Name */}
                    {unit.building_name && (
                      <div className="text-sm">
                        <span className="text-gray-500">Building:</span>{' '}
                        <span className="text-gray-900">{unit.building_name}</span>
                      </div>
                    )}

                    {/* Occupancy */}
                    <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md">
                      <span className="text-sm font-medium text-gray-700">Occupancy</span>
                      <span className="text-sm font-bold text-gray-900">
                        {unit.current_sows || 0}
                        {unit.max_capacity && ` / ${unit.max_capacity}`} sows
                      </span>
                    </div>

                    {/* Prop 12 Compliance Info */}
                    {isProp12Enabled && unit.square_footage && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Total Area:</span>
                          <span className="text-gray-900 font-medium">
                            {unit.square_footage} sq ft
                          </span>
                        </div>
                        {unit.current_sows && unit.current_sows > 0 && (
                          <>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">Per Sow:</span>
                              <span className="text-gray-900 font-medium">
                                {unit.sq_ft_per_sow} sq ft
                              </span>
                            </div>
                            {unit.type === 'gestation' && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Compliance:</span>
                                {unit.is_compliant ? (
                                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                    Compliant
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                                    Non-Compliant
                                  </span>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {/* Notes */}
                    {unit.notes && (
                      <div className="text-sm text-gray-600 border-t pt-2">
                        {unit.notes}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center space-x-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(unit)}
                        className="flex-1"
                      >
                        <Pencil className="mr-1 h-3 w-3" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(unit)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={!!unit.current_sows && unit.current_sows > 0}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <HousingUnitModal
          unit={editingUnit}
          onClose={handleModalClose}
          isProp12Enabled={isProp12Enabled}
        />
      )}
    </div>
  );
}
