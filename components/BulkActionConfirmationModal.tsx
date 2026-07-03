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
        return 'bg-due text-white hover:bg-due/90';
      case 'update':
        return 'bg-brand text-brand-foreground hover:bg-brand/90';
      case 'create':
        return 'bg-brand text-brand-foreground hover:bg-brand/90';
      default:
        return 'bg-brand text-brand-foreground hover:bg-brand/90';
    }
  };

  const getHeaderColor = () => {
    switch (actionType) {
      case 'delete':
        return 'bg-due-bg border-due/25';
      case 'update':
        return 'bg-info-bg border-info/25';
      case 'create':
        return 'bg-ok-bg border-ok/25';
      default:
        return 'bg-secondary';
    }
  };

  const defaultConfirmLabel = actionType === 'delete'
    ? 'Yes, Delete All'
    : actionType === 'update'
    ? 'Confirm Update'
    : 'Confirm Action';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card text-card-foreground rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`border-b px-6 py-4 flex items-center justify-between ${getHeaderColor()}`}>
          <div className="flex items-center gap-3">
            <AlertTriangle
              className={`h-6 w-6 ${
                actionType === 'delete'
                  ? 'text-due'
                  : actionType === 'update'
                  ? 'text-info'
                  : 'text-ok'
              }`}
            />
            <h2 className="text-xl font-bold text-foreground">{title}</h2>
          </div>
          <button
            onClick={onCancel}
            disabled={loading}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Items List */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">
              Affected Animals ({items.length})
            </h3>
            <div className="border rounded-lg max-h-48 overflow-y-auto">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className={`px-4 py-3 flex items-center gap-3 ${
                    index !== items.length - 1 ? 'border-b' : ''
                  } hover:bg-secondary`}
                >
                  <span className="font-mono text-sm text-muted-foreground min-w-[60px]">
                    #{item.ear_tag}
                  </span>
                  {item.name && (
                    <span className="font-medium text-foreground">{item.name}</span>
                  )}
                  {item.additionalInfo && (
                    <span className="text-sm text-muted-foreground ml-auto">
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
                ? 'bg-due-bg border border-due/25'
                : 'bg-info-bg border border-info/25'
            }`}>
              <div className="flex items-start gap-2 mb-3">
                <Info className={`h-5 w-5 mt-0.5 ${
                  actionType === 'delete' ? 'text-due' : 'text-info'
                }`} />
                <h3 className={`font-semibold ${
                  actionType === 'delete' ? 'text-due' : 'text-info'
                }`}>
                  {actionType === 'delete' ? 'This will also delete:' : 'Impact Summary:'}
                </h3>
              </div>
              <ul className="space-y-2 ml-7">
                {impactSummary.map((impact, index) => (
                  <li key={index} className={`text-sm ${
                    actionType === 'delete' ? 'text-due' : 'text-info'
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
            <div className="bg-soon-bg border border-soon/25 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-soon mt-0.5 flex-shrink-0" />
                <p className="text-sm text-soon font-medium">
                  {warningMessage}
                </p>
              </div>
            </div>
          )}

          {/* Irreversible Warning for Delete */}
          {actionType === 'delete' && (
            <div className="bg-due-bg border-2 border-due/30 rounded-lg p-4">
              <p className="text-due font-bold text-center">
                ⛔ This action cannot be undone!
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 bg-secondary flex gap-3">
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
