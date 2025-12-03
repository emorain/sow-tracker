'use client';

import { X, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

type AffectedItem = {
  id: string;
  ear_tag: string;
  name?: string | null;
  additionalInfo?: string;
};

type ImpactSummary = {
  label: string;
  count: number;
  description?: string;
};

type BulkActionConfirmationModalProps = {
  isOpen: boolean;
  title: string;
  actionType: 'delete' | 'update' | 'create';
  items: AffectedItem[];
  impactSummary?: ImpactSummary[];
  warningMessage?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
};

export default function BulkActionConfirmationModal({
  isOpen,
  title,
  actionType,
  items,
  impactSummary,
  warningMessage,
  confirmLabel,
  onConfirm,
  onCancel,
  loading = false,
}: BulkActionConfirmationModalProps) {
  if (!isOpen) return null;

  const getActionColor = () => {
    switch (actionType) {
      case 'delete':
        return 'bg-red-600 hover:bg-red-700';
      case 'update':
        return 'bg-blue-600 hover:bg-blue-700';
      case 'create':
        return 'bg-green-600 hover:bg-green-700';
      default:
        return 'bg-gray-600 hover:bg-gray-700';
    }
  };

  const getHeaderColor = () => {
    switch (actionType) {
      case 'delete':
        return 'bg-red-50 border-red-200';
      case 'update':
        return 'bg-blue-50 border-blue-200';
      case 'create':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const defaultConfirmLabel = actionType === 'delete'
    ? 'Yes, Delete All'
    : actionType === 'update'
    ? 'Confirm Update'
    : 'Confirm Action';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`border-b px-6 py-4 flex items-center justify-between ${getHeaderColor()}`}>
          <div className="flex items-center gap-3">
            <AlertTriangle
              className={`h-6 w-6 ${
                actionType === 'delete'
                  ? 'text-red-600'
                  : actionType === 'update'
                  ? 'text-blue-600'
                  : 'text-green-600'
              }`}
            />
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          </div>
          <button
            onClick={onCancel}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Items List */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">
              Affected Animals ({items.length})
            </h3>
            <div className="border rounded-lg max-h-48 overflow-y-auto">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className={`px-4 py-3 flex items-center gap-3 ${
                    index !== items.length - 1 ? 'border-b' : ''
                  } hover:bg-gray-50`}
                >
                  <span className="font-mono text-sm text-gray-600 min-w-[60px]">
                    #{item.ear_tag}
                  </span>
                  {item.name && (
                    <span className="font-medium text-gray-900">{item.name}</span>
                  )}
                  {item.additionalInfo && (
                    <span className="text-sm text-gray-500 ml-auto">
                      {item.additionalInfo}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Impact Summary */}
          {impactSummary && impactSummary.length > 0 && (
            <div className={`rounded-lg p-4 ${
              actionType === 'delete'
                ? 'bg-red-50 border border-red-200'
                : 'bg-blue-50 border border-blue-200'
            }`}>
              <div className="flex items-start gap-2 mb-3">
                <Info className={`h-5 w-5 mt-0.5 ${
                  actionType === 'delete' ? 'text-red-600' : 'text-blue-600'
                }`} />
                <h3 className={`font-semibold ${
                  actionType === 'delete' ? 'text-red-900' : 'text-blue-900'
                }`}>
                  {actionType === 'delete' ? 'This will also delete:' : 'Impact Summary:'}
                </h3>
              </div>
              <ul className="space-y-2 ml-7">
                {impactSummary.map((impact, index) => (
                  <li key={index} className={`text-sm ${
                    actionType === 'delete' ? 'text-red-800' : 'text-blue-800'
                  }`}>
                    <span className="font-medium">{impact.count}</span> {impact.label}
                    {impact.description && (
                      <span className="text-xs block mt-1 opacity-80">
                        {impact.description}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Warning Message */}
          {warningMessage && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-yellow-800 font-medium">
                  {warningMessage}
                </p>
              </div>
            </div>
          )}

          {/* Irreversible Warning for Delete */}
          {actionType === 'delete' && (
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
              <p className="text-red-900 font-bold text-center">
                ⛔ This action cannot be undone!
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 bg-gray-50 flex gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 ${getActionColor()}`}
          >
            {loading ? 'Processing...' : (confirmLabel || defaultConfirmLabel)}
          </Button>
        </div>
      </div>
    </div>
  );
}
