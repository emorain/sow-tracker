'use client';

import { useState } from 'react';
import { X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

type TransferAnimalModalProps = {
  animalType: 'sow' | 'boar';
  animalId: string;
  animalEarTag: string;
  animalName?: string;
  isOpen: boolean;
  onClose: () => void;
  onTransferCreated?: () => void;
};

export default function TransferAnimalModal({
  animalType,
  animalId,
  animalEarTag,
  animalName,
  isOpen,
  onClose,
  onTransferCreated
}: TransferAnimalModalProps) {
  const { user } = useAuth();
  const [sending, setSending] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [message, setMessage] = useState('');
  const [retainRecords, setRetainRecords] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recipientEmail.trim()) {
      toast.error('Please enter the recipient\'s email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Don't allow transferring to yourself
    if (recipientEmail.toLowerCase() === user?.email?.toLowerCase()) {
      toast.error('You cannot transfer an animal to yourself');
      return;
    }

    setSending(true);

    try {
      const tableName = animalType === 'sow' ? 'sow_transfer_requests' : 'boar_transfer_requests';
      const idField = animalType === 'sow' ? 'sow_id' : 'boar_id';

      const { error } = await supabase
        .from(tableName)
        .insert({
          [idField]: animalId,
          from_user_id: user?.id,
          to_user_email: recipientEmail.trim(),
          message: message.trim() || null,
          status: 'pending',
          retain_records: retainRecords
        });

      if (error) {
        console.error('Failed to create transfer request:', error);
        throw error;
      }

      toast.success(`Transfer request sent to ${recipientEmail}`);
      onTransferCreated?.();
      onClose();

      // Reset form
      setRecipientEmail('');
      setMessage('');
    } catch (error: any) {
      console.error('Failed to create transfer request:', error);
      if (error.message?.includes('unique_active')) {
        toast.error('This animal already has a pending transfer request');
      } else {
        toast.error('Failed to send transfer request');
      }
    } finally {
      setSending(false);
    }
  };

  const animalDisplay = animalName ? `${animalName} (${animalEarTag})` : animalEarTag;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-lg">
          <h2 className="text-xl font-bold text-gray-900">
            Transfer {animalType === 'sow' ? 'Sow' : 'Boar'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Animal Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">
              {animalType === 'sow' ? 'Sow' : 'Boar'} to Transfer:
            </div>
            <div className="font-semibold text-gray-900">{animalDisplay}</div>
          </div>

          {/* Recipient Email */}
          <div className="space-y-2">
            <Label htmlFor="recipient_email">
              Recipient Email Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="recipient_email"
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="recipient@example.com"
              required
            />
            <p className="text-xs text-gray-500">
              The recipient will receive a transfer request notification
            </p>
          </div>

          {/* Optional Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a note about this transfer..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600"
            />
          </div>

          {/* Keep Copy Checkbox */}
          <div className="flex items-start space-x-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <input
              type="checkbox"
              id="retain_records"
              checked={retainRecords}
              onChange={(e) => setRetainRecords(e.target.checked)}
              className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
            />
            <div className="flex-1">
              <Label htmlFor="retain_records" className="cursor-pointer font-medium text-gray-900">
                Keep copy of records after transfer
              </Label>
              <p className="text-xs text-gray-600 mt-1">
                If checked, a copy of this {animalType} will be kept in your account with status "Sold" along with all historical records. The original will transfer to the recipient.
              </p>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-900">
              <strong>What gets transferred:</strong>
            </p>
            <ul className="text-xs text-blue-800 mt-1 ml-4 list-disc space-y-1">
              <li>The {animalType}</li>
              <li>{animalType === 'sow' ? 'Breeding and farrowing records' : 'Breeding records'}</li>
              <li>Vaccination records</li>
              <li>Health records</li>
              {animalType === 'sow' && <li>Scheduled tasks and treatments</li>}
            </ul>
            {animalType === 'sow' && (
              <p className="text-xs text-blue-800 mt-2">
                <strong>Note:</strong> Piglets are not transferred automatically.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={sending}>
              {sending ? 'Sending...' : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Transfer Request
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
