'use client';

import { Button } from '@/components/ui/button';
import { ArrowRightLeft, Trash2, Syringe } from 'lucide-react';

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
    <div className="flex items-center gap-2">
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
          >
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            Transfer ({selectedCount})
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onBulkDelete}
            disabled={bulkDeleting}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {bulkDeleting ? 'Deleting...' : `Delete (${selectedCount})`}
          </Button>
        </>
      )}
      <Button
        variant="default"
        size="sm"
        onClick={onBulkBreed}
        disabled={selectedCount === 0}
        className="bg-red-600 hover:bg-red-700"
      >
        <Syringe className="h-4 w-4 mr-1" />
        Bulk Breed ({selectedCount})
      </Button>
      <Button
        variant="default"
        size="sm"
        onClick={onAssignHousing}
        disabled={selectedCount === 0}
      >
        Assign Housing ({selectedCount})
      </Button>
      <Button
        variant="default"
        size="sm"
        onClick={onRecordMatrix}
        disabled={selectedCount === 0}
      >
        Record Matrix ({selectedCount})
      </Button>
      {totalCount > 0 && selectedCount !== totalCount && (
        <Button variant="outline" size="sm" onClick={onSelectAll}>
          Select All
        </Button>
      )}
    </div>
  );
}
