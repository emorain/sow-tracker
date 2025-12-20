'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

type DateRangeFilterProps = {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
  presets?: Array<{ label: string; days: number }>;
};

const DEFAULT_PRESETS = [
  { label: 'Last 7 Days', days: 7 },
  { label: 'Last 30 Days', days: 30 },
  { label: 'Last 90 Days', days: 90 },
  { label: 'This Year', days: -1 }, // Special case
];

export default function DateRangeFilter({
  startDate,
  endDate,
  onChange,
  presets = DEFAULT_PRESETS,
}: DateRangeFilterProps) {
  const handlePresetClick = (days: number) => {
    const end = new Date();
    let start = new Date();

    if (days === -1) {
      // This Year
      start = new Date(end.getFullYear(), 0, 1);
    } else {
      start.setDate(end.getDate() - days);
    }

    onChange(
      start.toISOString().split('T')[0],
      end.toISOString().split('T')[0]
    );
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="start-date" className="mb-2 block">
            Start Date
          </Label>
          <Input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => onChange(e.target.value, endDate)}
          />
        </div>
        <div>
          <Label htmlFor="end-date" className="mb-2 block">
            End Date
          </Label>
          <Input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => onChange(startDate, e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-gray-600 self-center">Quick select:</span>
        {presets.map((preset) => (
          <Button
            key={preset.label}
            variant="outline"
            size="sm"
            onClick={() => handlePresetClick(preset.days)}
          >
            {preset.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
