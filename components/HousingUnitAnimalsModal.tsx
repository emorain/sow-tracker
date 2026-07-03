'use client';

import { useState, useEffect } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import Link from 'next/link';

type Animal = {
  id: string;
  ear_tag?: string;
  name: string | null;
  status: string;
  type: 'sow' | 'boar' | 'piglet';
  farrowing_id?: string;
};

type HousingUnit = {
  id: string;
  name: string;
  type: string;
  building_name?: string;
  pen_number?: string;
  current_sows?: number;
  current_boars?: number;
  current_piglets?: number;
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

      // Fetch weaned piglets
      const { data: pigletsData, error: pigletsError } = await supabase
        .from('piglets')
        .select('*')
        .eq('housing_unit_id', housingUnit.id)
        .in('status', ['weaned', 'alive'])
        .order('created_at');

      if (pigletsError) throw pigletsError;

      // Map sows, boars, and piglets with type
      const sows: Animal[] = (sowsData || []).map(s => ({
        ...s,
        type: 'sow' as const
      }));
      const boars: Animal[] = (boarsData || []).map(b => ({
        ...b,
        type: 'boar' as const
      }));
      const piglets: Animal[] = (pigletsData || []).map((p, index) => ({
        ...p,
        ear_tag: `Piglet ${index + 1}`,
        type: 'piglet' as const
      }));

      setAnimals([...sows, ...boars, ...piglets]);
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
      active: 'bg-ok-bg text-ok',
      bred: 'bg-info-bg text-info',
      pregnant: 'bg-info-bg text-info',
      farrowing: 'bg-due-bg text-due',
      weaning: 'bg-soon-bg text-soon',
      retired: 'bg-secondary text-muted-foreground',
    };
    return colors[status] || 'bg-secondary text-muted-foreground';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card text-card-foreground rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {getDisplayName()}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {(housingUnit.current_sows || 0) + (housingUnit.current_boars || 0) + (housingUnit.current_piglets || 0)} animal{((housingUnit.current_sows || 0) + (housingUnit.current_boars || 0) + (housingUnit.current_piglets || 0)) !== 1 ? 's' : ''}
              {housingUnit.max_capacity && ` / ${housingUnit.max_capacity} capacity`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">Loading animals...</div>
            </div>
          ) : animals.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">No animals currently in this housing unit</div>
            </div>
          ) : (
            <div className="space-y-2">
              {animals.map((animal) => (
                <div
                  key={`${animal.type}-${animal.id}`}
                  className="flex items-center justify-between p-3 bg-secondary rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground font-mono">{animal.ear_tag || 'Piglet'}</span>
                      {animal.name && (
                        <span className="text-sm text-muted-foreground">({animal.name})</span>
                      )}
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        animal.type === 'sow' ? 'bg-soon-bg text-soon' :
                        animal.type === 'boar' ? 'bg-info-bg text-info' :
                        'bg-ok-bg text-ok'
                      }`}>
                        {animal.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(animal.status)}`}>
                        {animal.status}
                      </span>
                    </div>
                  </div>
                  {animal.type !== 'piglet' && (
                    <Link
                      href={`/${animal.type === 'sow' ? 'sows' : 'boars'}`}
                      className="text-brand hover:text-brand/80"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-secondary border-t px-6 py-4">
          <Button onClick={onClose} variant="outline" className="w-full">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
