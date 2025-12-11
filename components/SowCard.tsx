'use client';

import { Button } from '@/components/ui/button';
import { PiggyBank, Syringe } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Sow } from '@/lib/types/sow';

type SowCardProps = {
  sow: Sow;
  isSelected: boolean;
  farrowingCount: number;
  isInFarrowing: boolean;
  onToggleSelection: (id: string) => void;
  onBreed: (sow: Sow) => void;
  onPregnancyCheck: (sow: Sow, breedingAttempt: any) => void;
  onAIDose: (sow: Sow) => void;
  onCompleteBreeding: (attemptId: string, sowId: string) => void;
  onViewDetails: (sow: Sow) => void;
  onAssignHousing: (sow: Sow) => void;
  calculateAge: (birthDate: string) => string;
  getStatusColor: (status: string) => string;
  getHousingStalenessInfo: (sow: Sow) => { daysInHousing: number; badge: { text: string; color: string } } | null;
  getLocationBadge: (sow: Sow, isInFarrowing: boolean) => { text: string; color: string } | null;
};

export default function SowCard({
  sow,
  isSelected,
  farrowingCount,
  isInFarrowing,
  onToggleSelection,
  onBreed,
  onPregnancyCheck,
  onAIDose,
  onCompleteBreeding,
  onViewDetails,
  onAssignHousing,
  calculateAge,
  getStatusColor,
  getHousingStalenessInfo,
  getLocationBadge,
}: SowCardProps) {
  const isGilt = farrowingCount === 0;
  const housingStaleness = getHousingStalenessInfo(sow);
  const locationBadge = getLocationBadge(sow, isInFarrowing);

  const handlePregnancyCheck = async () => {
    // Fetch the breeding attempt details
    const { data: breedingAttempt } = await supabase
      .from('breeding_attempts')
      .select('*')
      .eq('sow_id', sow.id)
      .in('result', ['pending'])
      .order('breeding_date', { ascending: false })
      .limit(1)
      .single();

    if (breedingAttempt) {
      onPregnancyCheck(sow, {
        ...breedingAttempt,
        days_since_breeding: sow.breeding_status?.days_since_breeding || 0,
      });
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition-colors">
      {/* Top row on mobile: Checkbox, Photo, Name & Badges */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Selection Checkbox */}
        <div className="flex-shrink-0">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelection(sow.id)}
            className="h-4 w-4 rounded border-gray-300 text-red-700 focus:ring-red-600 cursor-pointer"
          />
        </div>

        {/* Sow Photo */}
        <div className="flex-shrink-0">
          {sow.photo_url ? (
            <img
              src={sow.photo_url}
              alt={sow.name || sow.ear_tag}
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-gray-200"
            />
          ) : (
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-200 flex items-center justify-center">
              <PiggyBank className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
            </div>
          )}
        </div>

        {/* Sow Name & Badges - Mobile */}
        <div className="flex-1 min-w-0 sm:hidden">
          <h3 className="text-base font-semibold text-gray-900 truncate">
            {sow.name || sow.ear_tag}
          </h3>
          <div className="flex flex-wrap gap-1 mt-0.5">
            {isGilt && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Gilt
              </span>
            )}
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(sow.status)}`}>
              {sow.status}
            </span>
            {locationBadge && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${locationBadge.color}`}>
                {locationBadge.text}
              </span>
            )}
            {sow.breeding_status?.is_bred && sow.breeding_status.status_label && (
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  sow.breeding_status.pregnancy_confirmed
                    ? 'bg-green-100 text-green-800'
                    : sow.breeding_status.days_since_breeding && sow.breeding_status.days_since_breeding >= 21
                    ? 'bg-red-100 text-red-800'
                    : sow.breeding_status.days_since_breeding && sow.breeding_status.days_since_breeding >= 18
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {sow.breeding_status.status_label}
              </span>
            )}
            {housingStaleness?.badge && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${housingStaleness.badge.color}`}>
                {housingStaleness.badge.text}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Sow Info - Desktop and mobile details */}
      <div className="flex-1 min-w-0">
        {/* Desktop name & badges */}
        <div className="hidden sm:flex items-center gap-2 mb-1 flex-wrap">
          <h3 className="text-lg font-semibold text-gray-900">{sow.name || sow.ear_tag}</h3>
          {isGilt && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              Gilt
            </span>
          )}
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(sow.status)}`}>
            {sow.status}
          </span>
          {locationBadge && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${locationBadge.color}`}>
              {locationBadge.text}
            </span>
          )}
          {sow.breeding_status?.is_bred && sow.breeding_status.status_label && (
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                sow.breeding_status.pregnancy_confirmed
                  ? 'bg-green-100 text-green-800'
                  : sow.breeding_status.days_since_breeding && sow.breeding_status.days_since_breeding >= 21
                  ? 'bg-red-100 text-red-800'
                  : sow.breeding_status.days_since_breeding && sow.breeding_status.days_since_breeding >= 18
                  ? 'bg-orange-100 text-orange-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {sow.breeding_status.status_label}
            </span>
          )}
          {housingStaleness?.badge && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${housingStaleness.badge.color}`}>
              {housingStaleness.badge.text}
            </span>
          )}
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-1.5 sm:gap-2 text-sm text-gray-600">
          <div>
            <span className="font-medium">Ear Tag:</span> {sow.ear_tag}
          </div>
          <div>
            <span className="font-medium">Breed:</span> {sow.breed}
          </div>
          <div>
            <span className="font-medium">Age:</span> {calculateAge(sow.birth_date)}
          </div>
          {(sow.right_ear_notch !== null || sow.left_ear_notch !== null) && (
            <div>
              <span className="font-medium">Notches:</span> R:{sow.right_ear_notch || '-'} L:
              {sow.left_ear_notch || '-'}
            </div>
          )}
          {sow.registration_number && (
            <div className="sm:col-span-2">
              <span className="font-medium">Registration:</span> {sow.registration_number}
            </div>
          )}
        </div>
      </div>

      {/* Actions - Compact grid layout */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:flex-shrink-0 ml-auto max-w-md">
        {sow.status === 'active' && !isInFarrowing && (
          <>
            {/* Only show Record Breeding if sow is not currently bred */}
            {!sow.breeding_status?.is_bred && (
              <Button
                variant="default"
                size="sm"
                onClick={() => onBreed(sow)}
                className="text-xs px-2 py-1 h-8"
              >
                Breed
              </Button>
            )}
            {/* Show Pregnancy Check button for bred sows that need checking */}
            {sow.breeding_status?.is_bred && sow.breeding_status?.needs_pregnancy_check && (
              <Button
                variant="default"
                size="sm"
                onClick={handlePregnancyCheck}
                className="text-xs px-2 py-1 h-8 bg-green-600 hover:bg-green-700"
              >
                Preg Check
              </Button>
            )}
            {/* Show Add AI Dose button for AI-bred sows */}
            {sow.breeding_status?.is_bred &&
              sow.current_breeding_method === 'ai' &&
              sow.current_breeding_attempt_id &&
              !sow.breeding_cycle_complete && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => onAIDose(sow)}
                  className="text-xs px-2 py-1 h-8 bg-purple-600 hover:bg-purple-700"
                >
                  <Syringe className="mr-1 h-3 w-3" />
                  AI Dose
                </Button>
              )}
            {/* Show Complete Breeding Cycle button for incomplete AI breedings */}
            {sow.breeding_status?.is_bred &&
              sow.current_breeding_method === 'ai' &&
              sow.current_breeding_attempt_id &&
              !sow.breeding_cycle_complete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCompleteBreeding(sow.current_breeding_attempt_id!, sow.id)}
                  className="text-xs px-2 py-1 h-8 border-green-600 text-green-700 hover:bg-green-50"
                >
                  Complete Breeding
                </Button>
              )}
          </>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewDetails(sow)}
          className="text-xs px-2 py-1 h-8"
        >
          Details
        </Button>
        {sow.status === 'active' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAssignHousing(sow)}
            className="text-xs px-2 py-1 h-8"
          >
            Housing
          </Button>
        )}
      </div>
    </div>
  );
}
