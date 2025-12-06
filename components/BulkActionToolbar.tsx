'use client';

import { Button } from '@/components/ui/button';
import { ArrowRightLeft, Trash2, Syringe, Home, Droplet } from 'lucide-react';

type BulkActionToolbarProps = {
  selectedCount: number;
  totalCount: number;
  bulkDeleting?: boolean;
  onClearSelection: () => void;
  onTransfer: () => void;
  onBulkDelete: () => void;
  onBulkBreed: () => void;
  onAssignHousing: () => void;
  onRecordMatrix: () => void;
  onSelectAll: () => void;
};

export default function BulkActionToolbar({
  selectedCount,
  totalCount,
  bulkDeleting = false,
  onClearSelection,
  onTransfer,
  onBulkDelete,
  onBulkBreed,
  onAssignHousing,
  onRecordMatrix,
  onSelectAll,
}: BulkActionToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {selectedCount > 0 && (
        <>
          <span className="text-sm font-medium text-gray-700">
            {selectedCount} selected
          </span>
          <Button variant="outline" size="sm" onClick={onClearSelection}>
            Clear
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onTransfer}
            title={`Transfer ${selectedCount} animals`}
          >
            <ArrowRightLeft className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Transfer ({selectedCount})</span>
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onBulkDelete}
            disabled={bulkDeleting}
            title={bulkDeleting ? 'Deleting...' : `Delete ${selectedCount} animals`}
          >
            <Trash2 className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{bulkDeleting ? 'Deleting...' : `Delete (${selectedCount})`}</span>
          </Button>
        </>
      )}
      <Button
        variant="default"
        size="sm"
        onClick={onBulkBreed}
        disabled={selectedCount === 0}
        className="bg-red-600 hover:bg-red-700"
        title={`Bulk breed ${selectedCount} animals`}
      >
        <Syringe className="h-4 w-4 sm:mr-1" />
        <span className="hidden sm:inline">Bulk Breed ({selectedCount})</span>
      </Button>
      <Button
        variant="default"
        size="sm"
        onClick={onAssignHousing}
        disabled={selectedCount === 0}
        title={`Assign housing to ${selectedCount} animals`}
      >
        <Home className="h-4 w-4 sm:mr-1" />
        <span className="hidden sm:inline">Assign Housing ({selectedCount})</span>
      </Button>
      <Button
        variant="default"
        size="sm"
        onClick={onRecordMatrix}
        disabled={selectedCount === 0}
        title={`Record matrix for ${selectedCount} animals`}
      >
        <Droplet className="h-4 w-4 sm:mr-1" />
        <span className="hidden sm:inline">Record Matrix ({selectedCount})</span>
      </Button>
      {totalCount > 0 && selectedCount !== totalCount && (
        <Button variant="outline" size="sm" onClick={onSelectAll}>
          <span className="hidden sm:inline">Select All</span>
          <span className="sm:hidden">All</span>
        </Button>
      )}
    </div>
  );
}
