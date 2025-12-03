'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type WeanLitterModalProps = {
  farrowingId: string;
  sowName: string;
  sowEarTag: string;
  actualFarrowingDate: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

type PigletData = {
  id?: string | null;
  name: string;
  ear_tag: string;
  right_ear_notch: string;
  left_ear_notch: string;
  birth_weight: string;
  weaning_weight: string;
  sex: string;
};

type HousingUnit = {
  id: string;
  name: string;
  type: string;
  building_name: string | null;
  pen_number: string | null;
};

export default function WeanLitterModal({
  farrowingId,
  sowName,
  sowEarTag,
  actualFarrowingDate,
  isOpen,
  onClose,
  onSuccess,
}: WeanLitterModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [livePigletCount, setLivePigletCount] = useState<number>(0);
  const [weaningDate, setWeaningDate] = useState(new Date().toISOString().split('T')[0]);
  const [piglets, setPiglets] = useState<PigletData[]>([]);
  const [housingUnits, setHousingUnits] = useState<HousingUnit[]>([]);
  const [selectedHousingId, setSelectedHousingId] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      checkIfAlreadyWeaned();
      fetchNursingPiglets();
      fetchHousingUnits();
    }
  }, [isOpen, farrowingId]);

  const checkIfAlreadyWeaned = async () => {
    try {
      // Check if this farrowing has already been weaned
      const { data: farrowing, error: farrowingError } = await supabase
        .from('farrowings')
        .select('moved_out_of_farrowing_date')
        .eq('id', farrowingId)
        .single();

      if (farrowingError) throw farrowingError;

      if (farrowing?.moved_out_of_farrowing_date) {
        setError('This litter has already been weaned');
        return;
      }
    } catch (err) {
      console.error('Error checking weaning status:', err);
    }
  };

  const fetchNursingPiglets = async () => {
    try {
      // First, try to fetch existing nursing piglets
      const { data: nursingPiglets, error: pigletsError } = await supabase
        .from('piglets')
        .select('*')
        .eq('farrowing_id', farrowingId)
        .eq('status', 'nursing');

      if (pigletsError) throw pigletsError;

      if (nursingPiglets && nursingPiglets.length > 0) {
        // We have existing nursing piglets - populate the form with them
        setLivePigletCount(nursingPiglets.length);
        setPiglets(nursingPiglets.map(piglet => ({
          id: piglet.id,
          name: piglet.name || '',
          ear_tag: piglet.ear_tag || '',
          right_ear_notch: piglet.right_ear_notch?.toString() || '',
          left_ear_notch: piglet.left_ear_notch?.toString() || '',
          birth_weight: piglet.birth_weight?.toString() || '',
          weaning_weight: '',
          sex: piglet.sex || 'unknown',
        })));
      } else {
        // No nursing piglets exist - fall back to creating from live_piglets count
        const { data: farrowing, error: farrowingError } = await supabase
          .from('farrowings')
          .select('live_piglets')
          .eq('id', farrowingId)
          .single();

        if (farrowingError) throw farrowingError;

        const count = farrowing?.live_piglets || 0;
        setLivePigletCount(count);

        // Initialize piglet data array with empty values
        setPiglets(Array(count).fill(null).map(() => ({
          id: null,
          name: '',
          ear_tag: '',
          right_ear_notch: '',
          left_ear_notch: '',
          birth_weight: '',
          weaning_weight: '',
          sex: 'unknown',
        })));
      }
    } catch (err) {
      console.error('Failed to fetch nursing piglets:', err);
      setError('Failed to load piglet data');
    }
  };

  const fetchHousingUnits = async () => {
    try {
      const { data, error } = await supabase
        .from('housing_unit_occupancy')
        .select('*')
        .order('name');

      if (error) throw error;
      setHousingUnits(data || []);
    } catch (err) {
      console.error('Error fetching housing units:', err);
      // Non-critical error - housing is optional
    }
  };

  const getHousingDisplayName = (unit: HousingUnit) => {
    if (unit.building_name && unit.pen_number) {
      return `${unit.building_name} - Pen ${unit.pen_number}`;
    }
    return unit.name;
  };

  const updatePiglet = (index: number, field: keyof PigletData, value: string) => {
    const updated = [...piglets];
    updated[index][field] = value;
    setPiglets(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in to wean a litter');
        setLoading(false);
        return;
      }

      // Double-check that this farrowing hasn't already been weaned
      const { data: farrowingCheck, error: farrowingCheckError } = await supabase
        .from('farrowings')
        .select('moved_out_of_farrowing_date')
        .eq('id', farrowingId)
        .single();

      if (farrowingCheckError) throw farrowingCheckError;

      if (farrowingCheck?.moved_out_of_farrowing_date) {
        setError('This litter has already been weaned');
        setLoading(false);
        return;
      }

      // Validate weights and auto-generate ear tags if needed
      for (let i = 0; i < piglets.length; i++) {
        const piglet = piglets[i];

        // Validate weights if provided (must be positive)
        if (piglet.birth_weight && parseFloat(piglet.birth_weight) <= 0) {
          setError(`Piglet ${i + 1}: Birth weight must be greater than 0`);
          setLoading(false);
          return;
        }
        if (piglet.weaning_weight && parseFloat(piglet.weaning_weight) <= 0) {
          setError(`Piglet ${i + 1}: Weaning weight must be greater than 0`);
          setLoading(false);
          return;
        }
      }

      // Separate existing piglets from new ones
      const pigletsToUpdate = piglets.filter(p => p.id);
      const pigletsToCreate = piglets.filter(p => !p.id);

      // Update existing nursing piglets to weaned status
      for (const piglet of pigletsToUpdate) {
        const { error: updateError } = await supabase
          .from('piglets')
          .update({
            weaning_weight: piglet.weaning_weight ? parseFloat(piglet.weaning_weight) : null,
            weaned_date: weaningDate,
            status: 'weaned',
            housing_unit_id: selectedHousingId || null,
            // Also update these fields if they were changed
            name: piglet.name || null,
            ear_tag: piglet.ear_tag || null,
            right_ear_notch: piglet.right_ear_notch ? parseInt(piglet.right_ear_notch) : null,
            left_ear_notch: piglet.left_ear_notch ? parseInt(piglet.left_ear_notch) : null,
            birth_weight: piglet.birth_weight ? parseFloat(piglet.birth_weight) : null,
            sex: piglet.sex || 'unknown',
          })
          .eq('id', piglet.id);

        if (updateError) throw updateError;
      }

      // Create new piglet records for piglets that didn't exist before
      if (pigletsToCreate.length > 0) {
        const newPigletRecords = pigletsToCreate.map(piglet => {
          // Auto-generate ear tag if no identification provided
          let earTag = piglet.ear_tag?.trim() || null;
          if (!earTag && !piglet.right_ear_notch && !piglet.left_ear_notch) {
            const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            earTag = `PIG-${date}-${random}`;
          }

          return {
            user_id: user.id,
            farrowing_id: farrowingId,
            name: piglet.name || null,
            ear_tag: earTag,
            right_ear_notch: piglet.right_ear_notch ? parseInt(piglet.right_ear_notch) : null,
            left_ear_notch: piglet.left_ear_notch ? parseInt(piglet.left_ear_notch) : null,
            birth_weight: piglet.birth_weight ? parseFloat(piglet.birth_weight) : null,
            weaning_weight: piglet.weaning_weight ? parseFloat(piglet.weaning_weight) : null,
            sex: piglet.sex || 'unknown',
            status: 'weaned',
            weaned_date: weaningDate,
            housing_unit_id: selectedHousingId || null,
          };
        });

        const { error: insertError } = await supabase
          .from('piglets')
          .insert(newPigletRecords);

        if (insertError) throw insertError;
      }

      // Update farrowing record with moved_out_of_farrowing_date
      const { error: farrowingError } = await supabase
        .from('farrowings')
        .update({ moved_out_of_farrowing_date: weaningDate })
        .eq('id', farrowingId);

      if (farrowingError) throw farrowingError;

      // Get the sow_id from the farrowing record for protocol triggering
      const { data: farrowing, error: farrowingFetchError } = await supabase
        .from('farrowings')
        .select('sow_id')
        .eq('id', farrowingId)
        .single();

      if (farrowingFetchError) {
        console.error('Error fetching farrowing sow_id:', farrowingFetchError);
      } else if (farrowing) {
        // Apply weaning protocol - get active weaning protocols
        const { data: protocols, error: protocolError } = await supabase
          .from('protocols')
          .select('id, protocol_tasks(*)')
          .eq('trigger_event', 'weaning')
          .eq('is_active', true);

        if (protocolError) {
          console.error('Error fetching weaning protocols:', protocolError);
        } else if (protocols && protocols.length > 0) {
          // Create scheduled tasks for each protocol
          for (const protocol of protocols) {
            if (protocol.protocol_tasks && protocol.protocol_tasks.length > 0) {
              const scheduledTasks = protocol.protocol_tasks.map((task: any) => {
                const dueDate = new Date(weaningDate);
                dueDate.setDate(dueDate.getDate() + task.days_offset);

                return {
                  user_id: user.id,
                  protocol_id: protocol.id,
                  protocol_task_id: task.id,
                  sow_id: farrowing.sow_id,
                  task_name: task.task_name,
                  description: task.description,
                  due_date: dueDate.toISOString().split('T')[0],
                  is_completed: false,
                };
              });

              const { error: tasksError } = await supabase
                .from('scheduled_tasks')
                .insert(scheduledTasks);

              if (tasksError) {
                console.error('Error creating scheduled tasks:', tasksError);
              }
            }
          }
        }
      }

      // Reset and close
      setWeaningDate(new Date().toISOString().split('T')[0]);
      setPiglets([]);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to wean litter');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const daysSinceFarrowing = Math.floor(
    (new Date().getTime() - new Date(actualFarrowingDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            Wean Litter - Record Individual Piglets
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm font-medium text-blue-900">
                Sow: <strong>{sowName || sowEarTag}</strong>
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Farrowed {daysSinceFarrowing} days ago • {livePigletCount} piglet{livePigletCount !== 1 ? 's' : ''} to record
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weaning_date">
                Weaning Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="weaning_date"
                name="weaning_date"
                type="date"
                value={weaningDate}
                onChange={(e) => setWeaningDate(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Date when piglets were weaned and sow moved out
              </p>
            </div>

            {/* Housing Unit Selection */}
            <div className="space-y-2">
              <Label htmlFor="housing_unit">
                Nursery/Housing Unit <span className="text-red-500">*</span>
              </Label>
              <select
                id="housing_unit"
                value={selectedHousingId}
                onChange={(e) => setSelectedHousingId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                required
              >
                <option value="">-- Select Housing Unit --</option>
                {housingUnits.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {getHousingDisplayName(unit)}
                    {unit.type && ` (${unit.type})`}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Select the nursery or housing unit where weaned piglets will be moved
              </p>
            </div>

            {/* Individual Piglet Inputs */}
            {livePigletCount > 0 && (
              <div className="space-y-4">
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Individual Piglet Data
                  </h3>
                  <p className="text-xs text-gray-600">
                    Enter identification and weight data for each piglet. If no ear tag or notch is provided, an ear tag will be auto-generated.
                  </p>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
                    <p className="text-xs text-yellow-900">
                      <strong>Auto-generated ear tag format:</strong> <code className="bg-yellow-100 px-1 py-0.5 rounded">PIG-{new Date().toISOString().slice(0, 10).replace(/-/g, '')}-XXXX</code> (where XXXX is a random 4-digit number)
                    </p>
                    <p className="text-xs text-yellow-800 mt-1">
                      Example: <code className="bg-yellow-100 px-1 py-0.5 rounded">PIG-{new Date().toISOString().slice(0, 10).replace(/-/g, '')}-{Math.floor(Math.random() * 10000).toString().padStart(4, '0')}</code>
                    </p>
                  </div>
                </div>

                {/* Spreadsheet-style table for batch entry */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 border-b">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-700 w-12">#</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700 min-w-[200px]">Show/Registered Name</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700 min-w-[120px]">Ear Tag</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700 w-28">Right Notch</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700 w-28">Left Notch</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700 w-28">Sex</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700 w-32">Birth Weight (kg)</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700 w-32">Weaning Weight (kg)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {piglets.map((piglet, index) => (
                          <tr key={index} className="border-b last:border-b-0 hover:bg-gray-50">
                            <td className="px-3 py-2 text-gray-600 font-medium">{index + 1}</td>
                            <td className="px-3 py-2">
                              <Input
                                type="text"
                                value={piglet.name}
                                onChange={(e) => updatePiglet(index, 'name', e.target.value)}
                                placeholder="e.g., Starlight's Golden Boy"
                                className="h-9 text-sm border-gray-300 focus:border-red-500 focus:ring-red-500"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                type="text"
                                value={piglet.ear_tag}
                                onChange={(e) => updatePiglet(index, 'ear_tag', e.target.value)}
                                placeholder="P001"
                                className="h-9 text-sm border-gray-300 focus:border-red-500 focus:ring-red-500"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                type="number"
                                min="0"
                                max="9"
                                value={piglet.right_ear_notch}
                                onChange={(e) => updatePiglet(index, 'right_ear_notch', e.target.value)}
                                placeholder="0-9"
                                className="h-9 text-sm border-gray-300 focus:border-red-500 focus:ring-red-500"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                type="number"
                                min="0"
                                max="9"
                                value={piglet.left_ear_notch}
                                onChange={(e) => updatePiglet(index, 'left_ear_notch', e.target.value)}
                                placeholder="0-9"
                                className="h-9 text-sm border-gray-300 focus:border-red-500 focus:ring-red-500"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <select
                                value={piglet.sex}
                                onChange={(e) => updatePiglet(index, 'sex', e.target.value)}
                                className="flex h-9 w-full rounded-md border border-gray-300 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500 focus:border-red-500"
                              >
                                <option value="unknown">Unknown</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                              </select>
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={piglet.birth_weight}
                                onChange={(e) => updatePiglet(index, 'birth_weight', e.target.value)}
                                placeholder="1.5"
                                className="h-9 text-sm border-gray-300 focus:border-red-500 focus:ring-red-500"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={piglet.weaning_weight}
                                onChange={(e) => updatePiglet(index, 'weaning_weight', e.target.value)}
                                placeholder="6.5"
                                className="h-9 text-sm border-gray-300 focus:border-red-500 focus:ring-red-500"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer - Fixed at bottom */}
          <div className="border-t px-6 py-4 bg-white">
            <div className="flex gap-3">
              <Button type="submit" disabled={loading || livePigletCount === 0} className="flex-1">
                {loading ? 'Recording Piglets...' : `Wean ${livePigletCount} Piglet${livePigletCount !== 1 ? 's' : ''}`}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
