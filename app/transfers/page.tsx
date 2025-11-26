'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from '@/lib/supabase';
import { ArrowLeft, ArrowRight, CheckCircle, XCircle, Clock, Ban } from "lucide-react";
import Link from 'next/link';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';

type TransferRequest = {
  id: string;
  animal_type: 'sow' | 'boar';
  animal_id: string;
  sow_id?: string;
  boar_id?: string;
  from_user_id: string;
  to_user_email: string;
  to_user_id?: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  message?: string;
  created_at: string;
  responded_at?: string;
  animal_ear_tag: string;
  animal_name?: string;
  animal_breed: string;
  request_type: 'sent' | 'received';
};

export default function TransfersPage() {
  const { user } = useAuth();
  const [transfers, setTransfers] = useState<TransferRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTransfers();
  }, []);

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('my_transfer_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTransfers(data || []);
    } catch (error) {
      console.error('Error fetching transfers:', error);
      toast.error('Failed to load transfer requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (transfer: TransferRequest) => {
    if (!confirm(`Accept transfer of ${transfer.animal_type} ${transfer.animal_ear_tag}?`)) {
      return;
    }

    setProcessingId(transfer.id);
    try {
      // First, update the request status to accepted
      const tableName = transfer.animal_type === 'sow' ? 'sow_transfer_requests' : 'boar_transfer_requests';
      const { error: updateError } = await supabase
        .from(tableName)
        .update({
          status: 'accepted',
          responded_at: new Date().toISOString()
        })
        .eq('id', transfer.id);

      if (updateError) throw updateError;

      // Execute the transfer
      const functionName = transfer.animal_type === 'sow' ? 'execute_sow_transfer' : 'execute_boar_transfer';
      const { data, error: executeError } = await supabase.rpc(functionName, {
        p_request_id: transfer.id
      });

      if (executeError) throw executeError;

      if (data && !data.success) {
        throw new Error(data.error || 'Transfer execution failed');
      }

      toast.success(`${transfer.animal_type === 'sow' ? 'Sow' : 'Boar'} transfer completed successfully!`);
      fetchTransfers();
    } catch (error: any) {
      console.error('Error accepting transfer:', error);
      toast.error(error.message || 'Failed to accept transfer');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (transfer: TransferRequest) => {
    if (!confirm(`Decline transfer of ${transfer.animal_type} ${transfer.animal_ear_tag}?`)) {
      return;
    }

    setProcessingId(transfer.id);
    try {
      const tableName = transfer.animal_type === 'sow' ? 'sow_transfer_requests' : 'boar_transfer_requests';
      const { error } = await supabase
        .from(tableName)
        .update({
          status: 'declined',
          responded_at: new Date().toISOString()
        })
        .eq('id', transfer.id);

      if (error) throw error;

      toast.success('Transfer request declined');
      fetchTransfers();
    } catch (error) {
      console.error('Error declining transfer:', error);
      toast.error('Failed to decline transfer');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancel = async (transfer: TransferRequest) => {
    if (!confirm(`Cancel transfer request for ${transfer.animal_type} ${transfer.animal_ear_tag}?`)) {
      return;
    }

    setProcessingId(transfer.id);
    try {
      const tableName = transfer.animal_type === 'sow' ? 'sow_transfer_requests' : 'boar_transfer_requests';
      const { error } = await supabase
        .from(tableName)
        .update({ status: 'cancelled' })
        .eq('id', transfer.id);

      if (error) throw error;

      toast.success('Transfer request cancelled');
      fetchTransfers();
    } catch (error) {
      console.error('Error cancelling transfer:', error);
      toast.error('Failed to cancel transfer');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'accepted':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'declined':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'cancelled':
        return <Ban className="h-5 w-5 text-gray-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-semibold";
    switch (status) {
      case 'pending':
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Pending</span>;
      case 'accepted':
        return <span className={`${baseClasses} bg-green-100 text-green-800`}>Accepted</span>;
      case 'declined':
        return <span className={`${baseClasses} bg-red-100 text-red-800`}>Declined</span>;
      case 'cancelled':
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>Cancelled</span>;
      default:
        return null;
    }
  };

  const sentTransfers = transfers.filter(t => t.request_type === 'sent');
  const receivedTransfers = transfers.filter(t => t.request_type === 'received');

  const displayTransfers = activeTab === 'sent' ? sentTransfers : receivedTransfers;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Transfer Requests</h1>
        <p className="text-gray-600">Manage sow and boar transfers between users</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('received')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'received'
              ? 'border-red-700 text-red-700'
              : 'border-transparent text-gray-600 hover:text-red-700'
          }`}
        >
          Received ({receivedTransfers.filter(t => t.status === 'pending').length})
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'sent'
              ? 'border-red-700 text-red-700'
              : 'border-transparent text-gray-600 hover:text-red-700'
          }`}
        >
          Sent ({sentTransfers.filter(t => t.status === 'pending').length})
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading transfer requests...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && displayTransfers.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-600">
              {activeTab === 'received'
                ? 'No transfer requests received yet'
                : 'No transfer requests sent yet'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Transfer Requests List */}
      {!loading && displayTransfers.length > 0 && (
        <div className="space-y-4">
          {displayTransfers.map((transfer) => (
            <Card key={transfer.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {activeTab === 'received' ? (
                        <ArrowRight className="h-5 w-5 text-green-600" />
                      ) : (
                        <ArrowLeft className="h-5 w-5 text-blue-600" />
                      )}
                      <h3 className="font-semibold text-lg">
                        {transfer.animal_type === 'sow' ? 'Sow' : 'Boar'}: {transfer.animal_name || transfer.animal_ear_tag}
                      </h3>
                      {getStatusBadge(transfer.status)}
                    </div>

                    <div className="ml-8 space-y-1 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">Ear Tag:</span> {transfer.animal_ear_tag}
                      </p>
                      <p>
                        <span className="font-medium">Breed:</span> {transfer.animal_breed}
                      </p>
                      <p>
                        <span className="font-medium">
                          {activeTab === 'received' ? 'From:' : 'To:'}
                        </span>{' '}
                        {transfer.to_user_email}
                      </p>
                      <p>
                        <span className="font-medium">Requested:</span>{' '}
                        {new Date(transfer.created_at).toLocaleDateString()}
                      </p>
                      {transfer.message && (
                        <p className="mt-2 p-2 bg-gray-50 rounded border">
                          <span className="font-medium">Message:</span> {transfer.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 ml-4">
                    {transfer.status === 'pending' && activeTab === 'received' && (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleAccept(transfer)}
                          disabled={processingId === transfer.id}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDecline(transfer)}
                          disabled={processingId === transfer.id}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Decline
                        </Button>
                      </>
                    )}

                    {transfer.status === 'pending' && activeTab === 'sent' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancel(transfer)}
                        disabled={processingId === transfer.id}
                      >
                        <Ban className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
