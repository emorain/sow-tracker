'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type RecordLitterFormProps = {
  sowId: string;
  sowName: string;
  farrowingId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

type PigletData = {
  ear_tag: string;
  right_ear_notch: string;
  left_ear_notch: string;
  sex: 'male' | 'female' | 'unknown';
  birth_weight: string;
};

export default function RecordLitterForm({
  sowId,
  sowName,
  farrowingId,
  isOpen,
  onClose,
  onSuccess,
}: RecordLitterFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createIndividualPiglets, setCreateIndividualPiglets] = useState(false);
  const [piglets, setPiglets] = useState<PigletData[]>([]);
  const [formData, setFormData] = useState({
    breeding_date: '',
    actual_farrowing_date: new Date().toISOString().split('T')[0],
    live_piglets: '',
    stillborn: '0',
    mummified: '0',
    notes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // If live_piglets count changes and we're creating individual piglets, update the array
    if (name === 'live_piglets' && createIndividualPiglets) {
      const count = parseInt(value) || 0;
      const currentCount = piglets.length;

      if (count > currentCount) {
        // Add more piglets
        const newPiglets = [...piglets];
        for (let i = currentCount; i < count; i++) {
          newPiglets.push({
            ear_tag: '',
            right_ear_notch: '',
            left_ear_notch: '',
            sex: 'unknown',
            birth_weight: '',
          });
        }
        setPiglets(newPiglets);
      } else if (count < currentCount) {
        // Remove excess piglets
        setPiglets(piglets.slice(0, count));
      }
    }
  };

  const handleCreateIndividualPigletsToggle = (checked: boolean) => {
    setCreateIndividualPiglets(checked);
    if (checked) {
      // Initialize piglet array based on current live_piglets count
      const count = parseInt(formData.live_piglets) || 0;
      setPiglets(Array(count).fill(null).map(() => ({
        ear_tag: '',
        right_ear_notch: '',
        left_ear_notch: '',
        sex: 'unknown' as 'male' | 'female' | 'unknown',
        birth_weight: '',
      })));
    } else {
      setPiglets([]);
    }
  };

  const updatePiglet = (index: number, field: keyof PigletData, value: string) => {
    const updated = [...piglets];
    updated[index][field] = value as any;
    setPiglets(updated);
  };

  const generateTasksFromProtocols = async (farrowingId: string, sowId: string, farrowingDate: string) => {
    try {
      // Get active protocols for farrowing events
      const { data: protocols, error: protocolsError } = await supabase
        .from('protocols')
        .select('id, name')
        .eq('trigger_event', 'farrowing')
        .eq('is_active', true);

      if (protocolsError) throw protocolsError;
      if (!protocols || protocols.length === 0) return;

      // Get all protocol tasks for these protocols
      const protocolIds = protocols.map(p => p.id);
      const { data: protocolTasks, error: tasksError } = await supabase
        .from('protocol_tasks')
        .select('*')
        .in('protocol_id', protocolIds);

      if (tasksError) throw tasksError;
      if (!protocolTasks || protocolTasks.length === 0) return;

      // Get current user for scheduled tasks
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No user found for scheduled tasks generation');
        return;
      }

      // Generate scheduled tasks with calculated due dates
      const scheduledTasks = protocolTasks.map(task => {
        const dueDate = new Date(farrowingDate);
        dueDate.setDate(dueDate.getDate() + task.days_offset);

        return {
          user_id: user.id,
          protocol_id: task.protocol_id,
          protocol_task_id: task.id,
          farrowing_id: farrowingId,
          sow_id: sowId,
          task_name: task.task_name,
          description: task.description,
          due_date: dueDate.toISOString().split('T')[0],
          is_completed: false
        };
      });

      // Insert all scheduled tasks
      const { error: insertError } = await supabase
        .from('scheduled_tasks')
        .insert(scheduledTasks);

      if (insertError) throw insertError;

      console.log(`Generated ${scheduledTasks.length} tasks from ${protocols.length} protocols`);
    } catch (error) {
      console.error('Error generating tasks from protocols:', error);
      // Don't throw - task generation failure shouldn't block farrowing record
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in to record a litter');
        setLoading(false);
        return;
      }

      let currentFarrowingId = farrowingId;

      if (farrowingId) {
        // Update existing farrowing record
        const { error: updateError } = await supabase
          .from('farrowings')
          .update({
            actual_farrowing_date: formData.actual_farrowing_date,
            live_piglets: parseInt(formData.live_piglets) || 0,
            stillborn: parseInt(formData.stillborn) || 0,
            mummified: parseInt(formData.mummified) || 0,
            notes: formData.notes || null,
          })
          .eq('id', farrowingId);

        if (updateError) throw updateError;
      } else {
        // Create new farrowing record
        if (!formData.breeding_date) {
          setError('Breeding date is required for new farrowing records');
          setLoading(false);
          return;
        }

        const { data: newFarrowing, error: insertError } = await supabase
          .from('farrowings')
          .insert([{
            user_id: user.id,
            sow_id: sowId,
            breeding_date: formData.breeding_date,
            actual_farrowing_date: formData.actual_farrowing_date,
            live_piglets: parseInt(formData.live_piglets) || 0,
            stillborn: parseInt(formData.stillborn) || 0,
            mummified: parseInt(formData.mummified) || 0,
            notes: formData.notes || null,
          }])
          .select()
          .single();

        if (insertError) throw insertError;

        currentFarrowingId = newFarrowing.id;

        // Auto-generate tasks from active protocols
        if (newFarrowing) {
          await generateTasksFromProtocols(newFarrowing.id, sowId, formData.actual_farrowing_date);
        }
      }

      // Create individual nursing piglets if option is enabled
      if (createIndividualPiglets && currentFarrowingId && piglets.length > 0) {
        const pigletRecords = piglets.map(piglet => {
          // Auto-generate ear tag if no identification provided
          let earTag = piglet.ear_tag?.trim() || null;
          if (!earTag && !piglet.right_ear_notch && !piglet.left_ear_notch) {
            const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            earTag = `PIG-${date}-${random}`;
          }

          return {
            user_id: user.id,
            farrowing_id: currentFarrowingId,
            ear_tag: earTag,
            right_ear_notch: piglet.right_ear_notch ? parseInt(piglet.right_ear_notch) : null,
            left_ear_notch: piglet.left_ear_notch ? parseInt(piglet.left_ear_notch) : null,
            sex: piglet.sex || 'unknown',
            birth_weight: piglet.birth_weight ? parseFloat(piglet.birth_weight) : null,
            status: 'nursing',
          };
        });

        const { error: pigletsError } = await supabase
          .from('piglets')
          .insert(pigletRecords);

        if (pigletsError) throw pigletsError;
      }

      // Reset form and close
      setFormData({
        breeding_date: '',
        actual_farrowing_date: new Date().toISOString().split('T')[0],
        live_piglets: '',
        stillborn: '0',
        mummified: '0',
        notes: '',
      });
      setCreateIndividualPiglets(false);
      setPiglets([]);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record litter');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            Record Litter - {sowName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {!farrowingId && (
            <div className="space-y-2">
              <Label htmlFor="breeding_date">
                Breeding Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="breeding_date"
                name="breeding_date"
                type="date"
                value={formData.breeding_date}
                onChange={handleChange}
                required={!farrowingId}
              />
              <p className="text-sm text-muted-foreground">
                When was this sow bred?
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="actual_farrowing_date">
              Actual Farrowing Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="actual_farrowing_date"
              name="actual_farrowing_date"
              type="date"
              value={formData.actual_farrowing_date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="live_piglets">
                Live Piglets <span className="text-red-500">*</span>
              </Label>
              <Input
                id="live_piglets"
                name="live_piglets"
                type="number"
                min="0"
                value={formData.live_piglets}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stillborn">Stillborn</Label>
              <Input
                id="stillborn"
                name="stillborn"
                type="number"
                min="0"
                value={formData.stillborn}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mummified">Mummified</Label>
              <Input
                id="mummified"
                name="mummified"
                type="number"
                min="0"
                value={formData.mummified}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any observations about the farrowing..."
              rows={4}
            />
          </div>

          {/* Summary */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Summary</h4>
            <p className="text-sm text-gray-700">
              Total Born: <strong>{(parseInt(formData.live_piglets) || 0) + (parseInt(formData.stillborn) || 0) + (parseInt(formData.mummified) || 0)}</strong>
              {' • '}
              Live: <strong className="text-red-800">{parseInt(formData.live_piglets) || 0}</strong>
              {' • '}
              Stillborn: <strong>{parseInt(formData.stillborn) || 0}</strong>
              {' • '}
              Mummified: <strong>{parseInt(formData.mummified) || 0}</strong>
            </p>
          </div>

          {/* Create Individual Piglets Option */}
          {parseInt(formData.live_piglets) > 0 && (
            <div className="border-t pt-4">
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  id="create_individual_piglets"
                  checked={createIndividualPiglets}
                  onChange={(e) => handleCreateIndividualPigletsToggle(e.target.checked)}
                  className="w-4 h-4 text-red-700 bg-gray-100 border-gray-300 rounded focus:ring-red-600"
                />
                <Label htmlFor="create_individual_piglets" className="cursor-pointer">
                  Create Individual Nursing Piglets
                </Label>
              </div>

              {createIndividualPiglets && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-900">
                      <strong>Optional:</strong> Enter individual piglet data now, or add it later. All fields are optional - you can track ear notching, castration, and other events as they happen.
                    </p>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-xs text-yellow-900">
                      <strong>Auto-generated ear tag format:</strong> <code className="bg-yellow-100 px-1 py-0.5 rounded">PIG-{new Date().toISOString().slice(0, 10).replace(/-/g, '')}-XXXX</code> (where XXXX is a random 4-digit number)
                    </p>
                    <p className="text-xs text-yellow-800 mt-1">
                      Example: <code className="bg-yellow-100 px-1 py-0.5 rounded">PIG-{new Date().toISOString().slice(0, 10).replace(/-/g, '')}-{Math.floor(Math.random() * 10000).toString().padStart(4, '0')}</code>
                    </p>
                  </div>

                  {/* Spreadsheet-style table for batch entry */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100 border-b">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium text-gray-700 w-16">#</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-700">Ear Tag</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-700 w-28">Right Notch</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-700 w-28">Left Notch</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-700 w-32">Sex</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-700 w-32">Birth Weight (kg)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {piglets.map((piglet, index) => (
                            <tr key={index} className="border-b last:border-b-0 hover:bg-gray-50">
                              <td className="px-3 py-2 text-gray-600 font-medium">{index + 1}</td>
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
                                <Select
                                  value={piglet.sex}
                                  onChange={(e) => updatePiglet(index, 'sex', e.target.value)}
                                  className="h-9 text-sm border-gray-300 focus:border-red-500 focus:ring-red-500"
                                >
                                  <option value="unknown">Unknown</option>
                                  <option value="male">Male</option>
                                  <option value="female">Female</option>
                                </Select>
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
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex gap-4 pt-4 border-t">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Recording...' : 'Record Litter'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
