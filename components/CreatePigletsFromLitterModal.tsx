'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/lib/settings-context';

type PigletData = {
  ear_tag: string;
  right_ear_notch: string;
  left_ear_notch: string;
  sex: 'male' | 'female' | 'unknown';
  birth_weight: string;
};

type CreatePigletsFromLitterModalProps = {
  farrowingId: string;
  sowName: string;
  sowEarTag: string;
  livePigletCount: number;
  farrowingDate: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function CreatePigletsFromLitterModal({
  farrowingId,
  sowName,
  sowEarTag,
  livePigletCount,
  farrowingDate,
  isOpen,
  onClose,
  onSuccess,
}: CreatePigletsFromLitterModalProps) {
  const { settings, updateSettings } = useSettings();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [piglets, setPiglets] = useState<PigletData[]>([]);
  const [existingPigletCount, setExistingPigletCount] = useState(0);

  useEffect(() => {
    if (isOpen && farrowingId) {
      initializePiglets();
    }
  }, [isOpen, farrowingId]);

  const initializePiglets = async () => {
    try {
      // Check if there are already nursing piglets for this farrowing
      const { data: existingPiglets, error: pigletsError } = await supabase
        .from('piglets')
        .select('id')
        .eq('farrowing_id', farrowingId)
        .eq('status', 'nursing');

      if (pigletsError) throw pigletsError;

      const existingCount = existingPiglets?.length || 0;
      setExistingPigletCount(existingCount);

      // Calculate how many more piglets need to be created
      const remainingCount = livePigletCount - existingCount;

      if (remainingCount > 0) {
        // Initialize piglet data with auto-notching
        const currentLitter = settings?.ear_notch_current_litter || 1;
        setPiglets(
          Array(remainingCount)
            .fill(null)
            .map((_, index) => ({
              ear_tag: '',
              right_ear_notch: currentLitter.toString(),
              left_ear_notch: (existingCount + index + 1).toString(),
              sex: 'unknown' as 'male' | 'female' | 'unknown',
              birth_weight: '',
            }))
        );
      } else {
        setPiglets([]);
      }
    } catch (err) {
      console.error('Failed to check existing piglets:', err);
      setError('Failed to load piglet data');
    }
  };

  const updatePiglet = (index: number, field: keyof PigletData, value: string) => {
    const updated = [...piglets];
    updated[index][field] = value as any;
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
        setError('You must be logged in to create piglets');
        setLoading(false);
        return;
      }

      // Validate that we have piglets to create
      if (piglets.length === 0) {
        setError('All piglets have already been created for this litter');
        setLoading(false);
        return;
      }

      // Prepare piglet records
      const pigletRecords = piglets.map((piglet) => {
        // Auto-generate ear tag if no identification provided
        let earTag = piglet.ear_tag?.trim() || null;
        if (!earTag && !piglet.right_ear_notch && !piglet.left_ear_notch) {
          const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
          const random = Math.floor(Math.random() * 10000)
            .toString()
            .padStart(4, '0');
          earTag = `PIG-${date}-${random}`;
        }

        return {
          user_id: user.id,
          farrowing_id: farrowingId,
          ear_tag: earTag,
          right_ear_notch: piglet.right_ear_notch
            ? parseInt(piglet.right_ear_notch)
            : null,
          left_ear_notch: piglet.left_ear_notch
            ? parseInt(piglet.left_ear_notch)
            : null,
          sex: piglet.sex || 'unknown',
          birth_weight: piglet.birth_weight ? parseFloat(piglet.birth_weight) : null,
          status: 'nursing',
        };
      });

      // Insert piglet records
      const { error: pigletsError } = await supabase
        .from('piglets')
        .insert(pigletRecords);

      if (pigletsError) throw pigletsError;

      // Increment the litter number for next time
      const currentLitter = settings?.ear_notch_current_litter || 1;
      await updateSettings({ ear_notch_current_litter: currentLitter + 1 });

      // Reset and close
      setPiglets([]);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create piglets');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const daysSinceFarrowing = Math.floor(
    (new Date().getTime() - new Date(farrowingDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  const remainingPiglets = piglets.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            Create Individual Piglets from Litter
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
                Farrowed {daysSinceFarrowing} days ago • {livePigletCount} live piglets total
              </p>
              {existingPigletCount > 0 && (
                <p className="text-xs text-blue-700 mt-1">
                  {existingPigletCount} piglet{existingPigletCount !== 1 ? 's' : ''} already created • {remainingPiglets} remaining to create
                </p>
              )}
            </div>

            {remainingPiglets === 0 ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <p className="text-sm font-medium text-green-900">
                  All piglets have already been created for this litter!
                </p>
                <p className="text-xs text-green-700 mt-1">
                  You can view them in the Nursing Piglets page.
                </p>
              </div>
            ) : (
              <>
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Individual Piglet Data ({remainingPiglets} to create)
                  </h3>
                  <p className="text-xs text-gray-600">
                    Enter identification and weight data for each piglet. All fields are optional - if no ear tag or notch is provided, an ear tag will be auto-generated.
                  </p>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
                    <p className="text-xs text-yellow-900">
                      <strong>Auto-generated ear tag format:</strong>{' '}
                      <code className="bg-yellow-100 px-1 py-0.5 rounded">
                        PIG-{new Date().toISOString().slice(0, 10).replace(/-/g, '')}-XXXX
                      </code>{' '}
                      (where XXXX is a random 4-digit number)
                    </p>
                    <p className="text-xs text-yellow-800 mt-1">
                      Example:{' '}
                      <code className="bg-yellow-100 px-1 py-0.5 rounded">
                        PIG-{new Date().toISOString().slice(0, 10).replace(/-/g, '')}-
                        {Math.floor(Math.random() * 10000)
                          .toString()
                          .padStart(4, '0')}
                      </code>
                    </p>
                  </div>
                </div>

                {/* Mobile: Card-based layout - Shows on small screens */}
                <div className="space-y-4 md:hidden">
                  {piglets.map((piglet, index) => (
                    <div
                      key={index}
                      className="border-2 border-gray-200 rounded-lg p-4 bg-white shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-3 pb-2 border-b">
                        <h4 className="font-bold text-lg text-gray-900">
                          Piglet #{existingPigletCount + index + 1}
                        </h4>
                      </div>

                      <div className="space-y-3">
                        {/* Ear Tag */}
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                            Ear Tag
                          </Label>
                          <Input
                            type="text"
                            value={piglet.ear_tag}
                            onChange={(e) =>
                              updatePiglet(index, 'ear_tag', e.target.value)
                            }
                            placeholder="P001 (optional)"
                            className="h-12 text-base border-2 border-gray-300 focus:border-red-500 focus:ring-red-500"
                          />
                        </div>

                        {/* Ear Notches - Side by side */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                              Right Notch
                            </Label>
                            <Input
                              type="number"
                              min="0"
                              max="9"
                              value={piglet.right_ear_notch}
                              onChange={(e) =>
                                updatePiglet(index, 'right_ear_notch', e.target.value)
                              }
                              placeholder="0-9"
                              className="h-12 text-base text-center border-2 border-gray-300 focus:border-red-500 focus:ring-red-500"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                              Left Notch
                            </Label>
                            <Input
                              type="number"
                              min="0"
                              max="9"
                              value={piglet.left_ear_notch}
                              onChange={(e) =>
                                updatePiglet(index, 'left_ear_notch', e.target.value)
                              }
                              placeholder="0-9"
                              className="h-12 text-base text-center border-2 border-gray-300 focus:border-red-500 focus:ring-red-500"
                            />
                          </div>
                        </div>

                        {/* Sex and Weight - Side by side */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                              Sex
                            </Label>
                            <select
                              value={piglet.sex}
                              onChange={(e) =>
                                updatePiglet(index, 'sex', e.target.value)
                              }
                              className="flex h-12 w-full rounded-md border-2 border-gray-300 bg-white px-3 py-2 text-base font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus:border-red-500 appearance-none cursor-pointer hover:border-gray-400"
                              style={{
                                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                backgroundPosition: 'right 0.5rem center',
                                backgroundRepeat: 'no-repeat',
                                backgroundSize: '1.5em 1.5em',
                                paddingRight: '2.5rem'
                              }}
                            >
                              <option value="unknown">Unknown</option>
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                            </select>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                              Weight (kg)
                            </Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={piglet.birth_weight}
                              onChange={(e) =>
                                updatePiglet(index, 'birth_weight', e.target.value)
                              }
                              placeholder="1.5"
                              className="h-12 text-base border-2 border-gray-300 focus:border-red-500 focus:ring-red-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop/Tablet: Table layout - Shows on medium screens and up */}
                <div className="hidden md:block border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 border-b">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-700 w-16">
                            #
                          </th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">
                            Ear Tag
                          </th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700 w-28">
                            Right Notch
                          </th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700 w-28">
                            Left Notch
                          </th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700 w-32">
                            Sex
                          </th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700 w-32">
                            Birth Weight (kg)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {piglets.map((piglet, index) => (
                          <tr
                            key={index}
                            className="border-b last:border-b-0 hover:bg-gray-50"
                          >
                            <td className="px-3 py-2 text-gray-600 font-medium">
                              {existingPigletCount + index + 1}
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                type="text"
                                value={piglet.ear_tag}
                                onChange={(e) =>
                                  updatePiglet(index, 'ear_tag', e.target.value)
                                }
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
                                onChange={(e) =>
                                  updatePiglet(index, 'right_ear_notch', e.target.value)
                                }
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
                                onChange={(e) =>
                                  updatePiglet(index, 'left_ear_notch', e.target.value)
                                }
                                placeholder="0-9"
                                className="h-9 text-sm border-gray-300 focus:border-red-500 focus:ring-red-500"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <select
                                value={piglet.sex}
                                onChange={(e) =>
                                  updatePiglet(index, 'sex', e.target.value)
                                }
                                className="flex h-10 w-full min-w-[100px] rounded-md border-2 border-gray-300 bg-white px-3 py-2 text-base font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus:border-red-500 appearance-none cursor-pointer hover:border-gray-400"
                                style={{
                                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                  backgroundPosition: 'right 0.5rem center',
                                  backgroundRepeat: 'no-repeat',
                                  backgroundSize: '1.5em 1.5em',
                                  paddingRight: '2.5rem'
                                }}
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
                                onChange={(e) =>
                                  updatePiglet(index, 'birth_weight', e.target.value)
                                }
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
              </>
            )}
          </div>

          {/* Footer - Fixed at bottom */}
          <div className="border-t px-6 py-4 bg-white">
            <div className="flex gap-3">
              {remainingPiglets > 0 ? (
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading
                    ? 'Creating Piglets...'
                    : `Create ${remainingPiglets} Piglet${remainingPiglets !== 1 ? 's' : ''}`}
                </Button>
              ) : (
                <Button type="button" onClick={onClose} className="flex-1">
                  Close
                </Button>
              )}
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
