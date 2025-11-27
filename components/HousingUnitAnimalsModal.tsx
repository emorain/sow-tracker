'use client';

import { useState, useEffect } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import Link from 'next/link';

type Animal = {
  id: string;
  ear_tag: string;
  name: string | null;
  status: string;
  type: 'sow' | 'boar';
};

type HousingUnit = {
  id: string;
  name: string;
  type: string;
  building_name?: string;
  pen_number?: string;
  current_sows?: number;
  max_capacity?: number;
};

type HousingUnitAnimalsModalProps = {
  housingUnit: HousingUnit;
  onClose: () => void;
};

export function HousingUnitAnimalsModal({ housingUnit, onClose }: HousingUnitAnimalsModalProps) {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnimals();
  }, [housingUnit.id]);

  const fetchAnimals = async () => {
    try {
      setLoading(true);

      // Fetch sows directly from sows table
      const { data: sowsData, error: sowsError } = await supabase
        .from('sows')
        .select('*')
        .eq('housing_unit_id', housingUnit.id)
        .order('ear_tag');

      if (sowsError) throw sowsError;

      // Fetch boars
      const { data: boarsData, error: boarsError } = await supabase
        .from('boars')
        .select('*')
        .eq('housing_unit_id', housingUnit.id)
        .order('ear_tag');

      if (boarsError) throw boarsError;

      // Map sows with type
      const sows: Animal[] = (sowsData || []).map(s => ({
        ...s,
        type: 'sow' as const
      }));
      const boars: Animal[] = (boarsData || []).map(b => ({ ...b, type: 'boar' as const }));

      setAnimals([...sows, ...boars]);
    } catch (error) {
      console.error('Error fetching animals:', error);
      toast.error('Failed to load animals');
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = () => {
    if (housingUnit.building_name && housingUnit.pen_number) {
      return `${housingUnit.building_name} - Pen ${housingUnit.pen_number}`;
    }
    return housingUnit.name;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      bred: 'bg-blue-100 text-blue-800',
      pregnant: 'bg-purple-100 text-purple-800',
      farrowing: 'bg-pink-100 text-pink-800',
      weaning: 'bg-yellow-100 text-yellow-800',
      retired: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {getDisplayName()}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {housingUnit.current_sows || 0} animal{(housingUnit.current_sows || 0) !== 1 ? 's' : ''}
              {housingUnit.max_capacity && ` / ${housingUnit.max_capacity} capacity`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-600">Loading animals...</div>
            </div>
          ) : animals.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-600">No animals currently in this housing unit</div>
            </div>
          ) : (
            <div className="space-y-2">
              {animals.map((animal) => (
                <div
                  key={`${animal.type}-${animal.id}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{animal.ear_tag}</span>
                      {animal.name && (
                        <span className="text-sm text-gray-600">({animal.name})</span>
                      )}
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${animal.type === 'sow' ? 'bg-pink-100 text-pink-800' : 'bg-blue-100 text-blue-800'}`}>
                        {animal.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(animal.status)}`}>
                        {animal.status}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/${animal.type === 'sow' ? 'sows' : 'boars'}`}
                    className="text-red-600 hover:text-red-700"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4">
          <Button onClick={onClose} variant="outline" className="w-full">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
